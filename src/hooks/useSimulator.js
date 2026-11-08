/**
 * Hook: useSimulator
 * Concentra TODO el estado y los cálculos del simulador
 * para que persistan al navegar entre las vistas Teoría / Simulador / Desafíos.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMathParser } from './useMathParser';
import { useDebouncedValue } from './useDebouncedValue';
import { analyzeExpression, parseBound } from '../math/expressionTools';
import {
  computeRiemannSlices,
  computeVolume,
  isIntegrandLinear,
  sampleOffsetForMode,
} from '../math/calculusEngine';
import { buildIntegralSteps } from '../math/symbolicEngine';

const zeroFn = () => 0;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Interpreta los límites de integración (texto) y los ordena de menor a mayor. */
function resolveRange(aStr, bStr) {
  const a = parseBound(aStr);
  const b = parseBound(bStr);
  const aOk = Number.isFinite(a);
  const bOk = Number.isFinite(b);

  if (!aOk || !bOk) {
    return { a: 0, b: 1, aStr: '0', bStr: '1', aOk, bOk, ok: false, message: 'Límite no válido. Usa números o expresiones como pi/2.' };
  }
  if (a === b) {
    return { a: 0, b: 1, aStr: '0', bStr: '1', aOk, bOk, ok: false, message: 'Los límites deben ser distintos.' };
  }
  if (a > b) {
    return { a: b, b: a, aStr: bStr, bStr: aStr, aOk, bOk, ok: true, message: 'a > b: se intercambiaron los límites.' };
  }
  return { a, b, aStr, bStr, aOk, bOk, ok: true, message: '' };
}

/** Cálculo (diferido) del volumen y del planteamiento paso a paso. */
function computeIntegralData({ expression, useG, gExpression, aStr, bStr, axis, axisOffset }) {
  const fInfo = analyzeExpression(expression);
  const gInfo = useG ? analyzeExpression(gExpression) : null;
  const range = resolveRange(aStr, bStr);

  const problems = [];
  if (!fInfo.isValid) problems.push(`f(x): ${fInfo.error}`);
  if (useG && !gInfo.isValid) problems.push(`g(x): ${gInfo.error}`);
  if (!range.ok) problems.push(range.message);

  if (problems.length > 0) {
    return {
      steps: {
        method: axis === 'x' ? 'washers' : 'shells',
        title: 'Revisa los datos de entrada',
        axisLabel: `${axis === 'x' ? 'y' : 'x'} = ${axisOffset}`,
        general:
          axis === 'x'
            ? 'V = \\pi \\int_{a}^{b} \\left[ R(x)^{2} - r(x)^{2} \\right] dx'
            : 'V = 2\\pi \\int_{a}^{b} \\rho(x)\\, h(x)\\, dx',
        notes: problems,
      },
      fullVolume: 0,
      warning: null,
    };
  }

  const f = fInfo.fn;
  const g = useG ? gInfo.fn : zeroFn;
  const { fullVolume: simpsonVolume, invalidFraction } = computeVolume({
    f,
    g,
    a: range.a,
    b: range.b,
    axis,
    axisOffset,
  });

  const steps = buildIntegralSteps({
    fInfo,
    gInfo,
    hasG: useG,
    aStr: range.aStr,
    bStr: range.bStr,
    a: range.a,
    b: range.b,
    axis,
    axisOffset,
    fullVolume: simpsonVolume,
  });

  const exactFullVolume = steps.exactNumeric ?? simpsonVolume;

  return {
    steps,
    fullVolume: exactFullVolume,
    warning:
      invalidFraction > 0.001
        ? 'f(x) o g(x) no está definida en parte de [a, b]: esas zonas se omiten en el volumen.'
        : range.message || null,
  };
}

const EMPTY_INTEGRAL_DATA = {
  steps: {
    method: 'washers',
    title: 'Planteamiento del volumen',
    axisLabel: 'y = 0',
    general: 'V = \\pi \\int_{a}^{b} \\left[ R(x)^{2} - r(x)^{2} \\right] dx',
    notes: [],
  },
  fullVolume: 0,
  warning: null,
};

export function useSimulator(isActive = true) {
  // Parámetros matemáticos
  const [expression, setExpression] = useState('sqrt(x)');
  const [useG, setUseG] = useState(false);
  const [gExpression, setGExpression] = useState('x^2');
  const [aStr, setAStr] = useState('0');
  const [bStr, setBStr] = useState('4');
  const [axis, setAxis] = useState('x'); // 'x' → y = k (arandelas) · 'y' → x = c (capas)
  const [axisOffset, setAxisOffset] = useState(0);

  // Animación del giro
  const [angleDeg, setAngleDeg] = useState(360);
  const [isPlaying, setIsPlaying] = useState(false);

  // Elemento diferencial / Riemann
  const [slicesCount, setSlicesCount] = useState(20);
  const [showRiemann, setShowRiemann] = useState(false);
  const [riemannMode, setRiemannMode] = useState('left'); // 'left' (por defecto) | 'right' | 'midpoint'
  const [showElement, setShowElement] = useState(true);
  const [xi, setXi] = useState(2);

  // Vista (opacidad inicial 0.55 para ver con claridad la arandela dorada interna dx)
  const [wireframe, setWireframe] = useState(false);
  const [opacity, setOpacity] = useState(0.55);

  // Validación inmediata (interfaz fluida)
  const fParsed = useMathParser(expression);
  const gParsed = useMathParser(gExpression);
  const range = useMemo(() => resolveRange(aStr, bStr), [aStr, bStr]);
  const { a, b } = range;

  const f = fParsed.fn;
  const g = useG && gParsed.isValid ? gParsed.fn : zeroFn;

  // Cálculo del Volumen Exacto (Simpson 1/3) e integrando lineal memoizado:
  // SOLO se recalcula cuando la pestaña Simulador está activa y cambia la función, los límites o el eje.
  const exactVolumeData = useMemo(() => {
    if (!isActive || !fParsed.isValid || (useG && !gParsed.isValid) || !range.ok) {
      return { fullVolume: 0, invalidFraction: 0, isLinearIntegrand: false };
    }
    const { fullVolume, invalidFraction } = computeVolume({
      f,
      g,
      a,
      b,
      axis,
      axisOffset,
    });
    const isLinearIntegrand = isIntegrandLinear({ f, g, a, b, axis, axisOffset });
    return { fullVolume, invalidFraction, isLinearIntegrand };
  }, [isActive, fParsed.isValid, gParsed.isValid, useG, range.ok, f, g, a, b, axis, axisOffset]);

  // Objeto de configuración memoizado para el cálculo simbólico/numérico diferido
  const debouncedConfig = useMemo(
    () => ({ expression, useG, gExpression, aStr, bStr, axis, axisOffset }),
    [expression, useG, gExpression, aStr, bStr, axis, axisOffset]
  );
  const debounced = useDebouncedValue(debouncedConfig, 350);
  const integralData = useMemo(
    () => (isActive ? computeIntegralData(debounced) : EMPTY_INTEGRAL_DATA),
    [isActive, debounced]
  );

  // Partición de la Suma de Riemann memoizada:
  // SOLO se recalcula cuando el Simulador está activo y cambian la función, límites, eje, N o modo.
  const riemannSlices = useMemo(() => {
    if (!isActive || !fParsed.isValid || (useG && !gParsed.isValid) || !range.ok) {
      return [];
    }
    return computeRiemannSlices({
      f,
      g,
      a,
      b,
      axis,
      axisOffset,
      count: slicesCount,
      mode: riemannMode,
    });
  }, [
    isActive,
    fParsed.isValid,
    gParsed.isValid,
    useG,
    range.ok,
    f,
    g,
    a,
    b,
    axis,
    axisOffset,
    slicesCount,
    riemannMode,
  ]);

  // Comparación memoizada: Suma de Riemann (N elementos) vs. Volumen Exacto (Simpson / Simbólico)
  const riemannStats = useMemo(() => {
    if (!fParsed.isValid || (useG && !gParsed.isValid) || !range.ok) {
      return { vApprox: 0, vExact: 0, relErrorPct: 0, isLinearIntegrand: false };
    }
    const vApprox = riemannSlices.reduce((acc, s) => acc + s.volume, 0);
    const simpsonExact = exactVolumeData.fullVolume;
    const isDebouncedSynced =
      debounced.expression === expression &&
      debounced.useG === useG &&
      debounced.gExpression === gExpression &&
      debounced.aStr === aStr &&
      debounced.bStr === bStr &&
      debounced.axis === axis &&
      debounced.axisOffset === axisOffset;
    const vExact =
      isDebouncedSynced && integralData.steps?.exactNumeric != null
        ? integralData.steps.exactNumeric
        : simpsonExact;
    const relErrorPct = vExact > 1e-12 ? (Math.abs(vExact - vApprox) / vExact) * 100 : 0;
    return {
      vApprox,
      vExact,
      relErrorPct,
      isLinearIntegrand: exactVolumeData.isLinearIntegrand,
    };
  }, [
    fParsed.isValid,
    gParsed.isValid,
    useG,
    range.ok,
    riemannSlices,
    exactVolumeData,
    debounced,
    expression,
    gExpression,
    aStr,
    bStr,
    axis,
    axisOffset,
    integralData.steps,
  ]);

  const angleFraction = clamp(angleDeg / 360, 0, 1);
  const currentVolume = integralData.fullVolume * angleFraction;

  // Elemento diferencial representativo (se ajusta al subintervalo i en modo Riemann y evalúa su altura en xSample).
  const element = useMemo(() => {
    const safeSlices = Math.max(1, Number(slicesCount) || 20);
    const span = b - a;
    const dx = Number.isFinite(span) && span > 0 ? span / safeSlices : 0.1;
    const x0 = !Number.isFinite(xi) || xi < a || xi > b ? (a + b) / 2 : xi;
    const mode = riemannMode || 'left';
    if (showRiemann) {
      const index = clamp(Math.floor((x0 - a) / dx), 0, safeSlices - 1);
      const xc = a + (index + 0.5) * dx;
      const xSample = a + (index + sampleOffsetForMode(mode)) * dx;
      return { xc, xSample, dx, index };
    }
    const xc = clamp(x0, a + dx / 2, b - dx / 2);
    return {
      xc,
      xSample: xc,
      dx,
      index: clamp(Math.floor((xc - a) / dx), 0, safeSlices - 1),
    };
  }, [a, b, xi, slicesCount, showRiemann, riemannMode]);

  const moveElement = useCallback((x) => setXi(clamp(x, a, b)), [a, b]);

  // Referencia al ángulo actual para arrancar la animación desde donde esté el giro
  const angleDegRef = useRef(angleDeg);
  useEffect(() => {
    angleDegRef.current = angleDeg;
  }, [angleDeg]);

  // Bucle de animación del barrido angular (se detiene al completar 360° o al salir del Simulador)
  useEffect(() => {
    if (!isPlaying || !isActive) return undefined;

    let raf;
    let last = performance.now();
    let angle = angleDegRef.current;
    const tick = (time) => {
      const dt = (time - last) / 1000;
      last = time;
      angle = Math.min(360, angle + dt * 100); // ~100°/s
      setAngleDeg(angle);
      if (angle >= 360) {
        setIsPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, isActive]);

  const boundsStatus = useMemo(
    () => ({
      aOk: range.aOk,
      bOk: range.bOk,
      message: range.ok && range.message ? '' : range.message,
    }),
    [range.aOk, range.bOk, range.ok, range.message]
  );

  return {
    // estado + setters
    expression, setExpression,
    useG, setUseG,
    gExpression, setGExpression,
    aStr, setAStr,
    bStr, setBStr,
    axis, setAxis,
    axisOffset, setAxisOffset,
    angleDeg, setAngleDeg,
    isPlaying, setIsPlaying,
    slicesCount, setSlicesCount,
    showRiemann, setShowRiemann,
    riemannMode, setRiemannMode,
    showElement, setShowElement,
    wireframe, setWireframe,
    opacity, setOpacity,
    // derivados
    fParsed, gParsed, range, a, b, f, g,
    integralData, riemannSlices, riemannStats,
    angleFraction, currentVolume,
    element, moveElement, boundsStatus,
  };
}
