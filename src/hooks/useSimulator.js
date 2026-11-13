/**
 * Hook: useSimulator
 * Estado y cálculos del simulador encapsulados por instancia del Cockpit (`SimulatorView`),
 * con Single Source of Truth (`DEFAULT_SIMULATOR_STATE`) para reiniciarse de fábrica
 * al cambiar de pestaña o pulsar el botón "Restablecer".
 */
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
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

export const DEFAULT_CAMERA_STATE = Object.freeze({
  position: Object.freeze([6, 4.5, 7.5]),
  target: Object.freeze([0, 0, 0]),
  zoom: 1,
});

const createDefaultCameraState = () => ({
  position: [...DEFAULT_CAMERA_STATE.position],
  target: [...DEFAULT_CAMERA_STATE.target],
  zoom: DEFAULT_CAMERA_STATE.zoom,
});

export const DEFAULT_SIMULATOR_STATE = Object.freeze({
  expression: 'sqrt(x)',
  useG: false,
  gExpression: 'x^2',
  aStr: '0',
  bStr: '4',
  axis: 'x', // 'x' → y = k (horizontal · arandelas) · 'y' → x = c (vertical · capas)
  axisOffset: 0,
  angleDeg: 360,
  isPlaying: false,
  slicesCount: 20,
  showRiemann: false,
  riemannMode: 'left', // 'left' (por defecto) | 'right' | 'midpoint'
  showElement: true,
  xi: 2,
  wireframe: false,
  opacity: 0.55,
  panelTab: 'parameters',
  preset: '',
  cutAnglePref: 180,
});

const DEFAULT_INTEGRAL_CONFIG = Object.freeze({
  expression: DEFAULT_SIMULATOR_STATE.expression,
  useG: DEFAULT_SIMULATOR_STATE.useG,
  gExpression: DEFAULT_SIMULATOR_STATE.gExpression,
  aStr: DEFAULT_SIMULATOR_STATE.aStr,
  bStr: DEFAULT_SIMULATOR_STATE.bStr,
  axis: DEFAULT_SIMULATOR_STATE.axis,
  axisOffset: DEFAULT_SIMULATOR_STATE.axisOffset,
});

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

const EMPTY_EXACT_VOLUME = Object.freeze({
  fullVolume: 0,
  invalidFraction: 0,
  isLinearIntegrand: false,
});

const EMPTY_RIEMANN_STATS = Object.freeze({
  vApprox: 0,
  vExact: 0,
  relErrorPct: 0,
  isLinearIntegrand: false,
});

const EMPTY_RIEMANN_SLICES = Object.freeze([]);

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

const isSameIntegralConfig = (a, b) =>
  a.expression === b.expression &&
  a.useG === b.useG &&
  a.gExpression === b.gExpression &&
  a.aStr === b.aStr &&
  a.bStr === b.bStr &&
  a.axis === b.axis &&
  a.axisOffset === b.axisOffset;

export function useSimulator(isActive = true) {
  // Parámetros matemáticos (inicializados desde DEFAULT_SIMULATOR_STATE)
  const [expression, setExpressionState] = useState(DEFAULT_SIMULATOR_STATE.expression);
  const [useG, setUseGState] = useState(DEFAULT_SIMULATOR_STATE.useG);
  const [gExpression, setGExpressionState] = useState(DEFAULT_SIMULATOR_STATE.gExpression);
  const [aStr, setAStrState] = useState(DEFAULT_SIMULATOR_STATE.aStr);
  const [bStr, setBStrState] = useState(DEFAULT_SIMULATOR_STATE.bStr);
  const [axis, setAxisState] = useState(DEFAULT_SIMULATOR_STATE.axis);
  const [axisOffset, setAxisOffsetState] = useState(DEFAULT_SIMULATOR_STATE.axisOffset);

  // Desacople de estado interactivo vs pesado (KaTeX y malla 3D)
  const [isAdjustingAxis, setIsAdjustingAxis] = useState(false);
  const [integralDelayMs, setIntegralDelayMs] = useState(350);
  const deferredAxis = useDeferredValue(axis);
  const deferredAxisOffset = useDeferredValue(axisOffset);

  const setExpression = useCallback((v) => {
    setIntegralDelayMs(350);
    setExpressionState(v);
  }, []);
  const setUseG = useCallback((v) => {
    setIntegralDelayMs(150);
    setUseGState(v);
  }, []);
  const setGExpression = useCallback((v) => {
    setIntegralDelayMs(350);
    setGExpressionState(v);
  }, []);
  const setAStr = useCallback((v) => {
    setIntegralDelayMs(350);
    setAStrState(v);
  }, []);
  const setBStr = useCallback((v) => {
    setIntegralDelayMs(350);
    setBStrState(v);
  }, []);
  const setAxis = useCallback((v) => {
    setIntegralDelayMs(90);
    setAxisState(v);
  }, []);
  const setAxisOffset = useCallback((v) => {
    setIntegralDelayMs(90);
    setAxisOffsetState(v);
  }, []);

  // Animación del giro
  const [angleDeg, setAngleDeg] = useState(DEFAULT_SIMULATOR_STATE.angleDeg);
  const [isPlaying, setIsPlaying] = useState(DEFAULT_SIMULATOR_STATE.isPlaying);
  const [isAnimatingPreset, setIsAnimatingPreset] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(0);

  const startRevolutionAnimation = useCallback(() => {
    setIsAnimatingPreset(true);
    setAnimationTrigger((prev) => prev + 1);
  }, []);

  const endRevolutionAnimation = useCallback(() => {
    setIsAnimatingPreset(false);
  }, []);

  // Elemento diferencial / Riemann
  const [slicesCount, setSlicesCount] = useState(DEFAULT_SIMULATOR_STATE.slicesCount);
  const [showRiemann, setShowRiemann] = useState(DEFAULT_SIMULATOR_STATE.showRiemann);
  const [riemannMode, setRiemannMode] = useState(DEFAULT_SIMULATOR_STATE.riemannMode);
  const [showElement, setShowElement] = useState(DEFAULT_SIMULATOR_STATE.showElement);
  const [xi, setXi] = useState(DEFAULT_SIMULATOR_STATE.xi);

  // Vista (opacidad inicial 0.55 para ver con claridad la arandela dorada interna dx)
  const [wireframe, setWireframe] = useState(DEFAULT_SIMULATOR_STATE.wireframe);
  const [opacity, setOpacity] = useState(DEFAULT_SIMULATOR_STATE.opacity);

  // Sub-estado de UI del Panel de Control
  const [panelTab, setPanelTab] = useState(DEFAULT_SIMULATOR_STATE.panelTab);
  const [preset, setPreset] = useState(DEFAULT_SIMULATOR_STATE.preset);
  const [cutAnglePref, setCutAnglePref] = useState(DEFAULT_SIMULATOR_STATE.cutAnglePref);

  // Referencia de cámara 3D por sesión del Cockpit (vuelve al valor por defecto al re-montar o resetear)
  const cameraStateRef = useRef(createDefaultCameraState());
  const [cameraResetNonce, setCameraResetNonce] = useState(0);

  // Control de visibilidad del navegador (pausa render y animaciones en document.hidden)
  const [isDocVisible, setIsDocVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden
  );

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsDocVisible(visible);
      if (!visible) {
        setIsPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const effectiveActive = Boolean(isActive && isDocVisible);

  // Validación inmediata (interfaz fluida)
  const fParsed = useMathParser(expression);
  const gParsed = useMathParser(gExpression);
  const range = useMemo(() => resolveRange(aStr, bStr), [aStr, bStr]);
  const { a, b } = range;

  const f = fParsed.fn;
  const g = useG && gParsed.isValid ? gParsed.fn : zeroFn;

  // Cálculo del Volumen Exacto (Simpson 1/3) e integrando lineal memoizado:
  // SOLO se calcula cuando la pestaña Simulador está visible/activa, showRiemann está habilitado y no se arrastra k.
  const exactVolumeData = useMemo(() => {
    if (
      !effectiveActive ||
      !showRiemann ||
      isAdjustingAxis ||
      !fParsed.isValid ||
      (useG && !gParsed.isValid) ||
      !range.ok
    ) {
      return EMPTY_EXACT_VOLUME;
    }
    const { fullVolume, invalidFraction } = computeVolume({
      f,
      g,
      a,
      b,
      axis: deferredAxis,
      axisOffset: deferredAxisOffset,
    });
    const isLinearIntegrand = isIntegrandLinear({
      f,
      g,
      a,
      b,
      axis: deferredAxis,
      axisOffset: deferredAxisOffset,
    });
    return { fullVolume, invalidFraction, isLinearIntegrand };
  }, [
    effectiveActive,
    showRiemann,
    isAdjustingAxis,
    fParsed.isValid,
    gParsed.isValid,
    useG,
    range.ok,
    f,
    g,
    a,
    b,
    deferredAxis,
    deferredAxisOffset,
  ]);

  // Objeto de configuración memoizado para el cálculo simbólico/numérico diferido.
  // Se congela durante el arrastre activo del slider k (`paused = isAdjustingAxis`) para evitar compilar KaTeX en tiempo real.
  const isAtDefaultFormula =
    !isAdjustingAxis &&
    expression === DEFAULT_SIMULATOR_STATE.expression &&
    useG === DEFAULT_SIMULATOR_STATE.useG &&
    gExpression === DEFAULT_SIMULATOR_STATE.gExpression &&
    aStr === DEFAULT_SIMULATOR_STATE.aStr &&
    bStr === DEFAULT_SIMULATOR_STATE.bStr &&
    deferredAxis === DEFAULT_SIMULATOR_STATE.axis &&
    deferredAxisOffset === DEFAULT_SIMULATOR_STATE.axisOffset;

  const debouncedConfig = useMemo(
    () => ({
      expression,
      useG,
      gExpression,
      aStr,
      bStr,
      axis: deferredAxis,
      axisOffset: deferredAxisOffset,
    }),
    [expression, useG, gExpression, aStr, bStr, deferredAxis, deferredAxisOffset]
  );
  const debounced = useDebouncedValue(debouncedConfig, integralDelayMs, isAdjustingAxis);
  const effectiveIntegralConfig =
    isAtDefaultFormula && !isSameIntegralConfig(debounced, DEFAULT_INTEGRAL_CONFIG)
      ? DEFAULT_INTEGRAL_CONFIG
      : debounced;
  const integralData = useMemo(
    () => (effectiveActive ? computeIntegralData(effectiveIntegralConfig) : EMPTY_INTEGRAL_DATA),
    [effectiveActive, effectiveIntegralConfig]
  );

  // Partición de la Suma de Riemann memoizada:
  // SOLO se recalcula si está activa/visible y showRiemann está habilitado.
  const riemannSlices = useMemo(() => {
    if (
      !effectiveActive ||
      !showRiemann ||
      !fParsed.isValid ||
      (useG && !gParsed.isValid) ||
      !range.ok
    ) {
      return EMPTY_RIEMANN_SLICES;
    }
    return computeRiemannSlices({
      f,
      g,
      a,
      b,
      axis: deferredAxis,
      axisOffset: deferredAxisOffset,
      count: slicesCount,
      mode: riemannMode,
    });
  }, [
    effectiveActive,
    showRiemann,
    fParsed.isValid,
    gParsed.isValid,
    useG,
    range.ok,
    f,
    g,
    a,
    b,
    deferredAxis,
    deferredAxisOffset,
    slicesCount,
    riemannMode,
  ]);

  // Comparación memoizada: Suma de Riemann (N elementos) vs. Volumen Exacto (Simpson / Simbólico)
  const riemannStats = useMemo(() => {
    if (!effectiveActive || !showRiemann || !fParsed.isValid || (useG && !gParsed.isValid) || !range.ok) {
      return EMPTY_RIEMANN_STATS;
    }
    const vApprox = riemannSlices.reduce((acc, s) => acc + s.volume, 0);
    const simpsonExact = exactVolumeData.fullVolume;
    const isDebouncedSynced =
      isAtDefaultFormula ||
      (debounced.expression === expression &&
        debounced.useG === useG &&
        debounced.gExpression === gExpression &&
        debounced.aStr === aStr &&
        debounced.bStr === bStr &&
        debounced.axis === deferredAxis &&
        debounced.axisOffset === deferredAxisOffset);
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
    effectiveActive,
    showRiemann,
    fParsed.isValid,
    gParsed.isValid,
    useG,
    range.ok,
    riemannSlices,
    exactVolumeData,
    isAtDefaultFormula,
    debounced,
    expression,
    gExpression,
    aStr,
    bStr,
    deferredAxis,
    deferredAxisOffset,
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

  // Bucle de animación del barrido angular (se detiene al completar 360°, salir del Simulador u ocultar pestaña)
  useEffect(() => {
    if (!isPlaying || !effectiveActive) return undefined;

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
  }, [isPlaying, effectiveActive]);

  // Restablecimiento explícito e inmediato a valores por defecto + cámara 3D
  const resetSimulatorState = useCallback(() => {
    setIsPlaying(DEFAULT_SIMULATOR_STATE.isPlaying);
    setIsAnimatingPreset(false);
    setIsAdjustingAxis(false);
    setIntegralDelayMs(350);
    setExpressionState(DEFAULT_SIMULATOR_STATE.expression);
    setUseGState(DEFAULT_SIMULATOR_STATE.useG);
    setGExpressionState(DEFAULT_SIMULATOR_STATE.gExpression);
    setAStrState(DEFAULT_SIMULATOR_STATE.aStr);
    setBStrState(DEFAULT_SIMULATOR_STATE.bStr);
    setAxisState(DEFAULT_SIMULATOR_STATE.axis);
    setAxisOffsetState(DEFAULT_SIMULATOR_STATE.axisOffset);
    setAngleDeg(DEFAULT_SIMULATOR_STATE.angleDeg);
    setSlicesCount(DEFAULT_SIMULATOR_STATE.slicesCount);
    setShowRiemann(DEFAULT_SIMULATOR_STATE.showRiemann);
    setRiemannMode(DEFAULT_SIMULATOR_STATE.riemannMode);
    setShowElement(DEFAULT_SIMULATOR_STATE.showElement);
    setXi(DEFAULT_SIMULATOR_STATE.xi);
    setWireframe(DEFAULT_SIMULATOR_STATE.wireframe);
    setOpacity(DEFAULT_SIMULATOR_STATE.opacity);
    setPanelTab(DEFAULT_SIMULATOR_STATE.panelTab);
    setPreset(DEFAULT_SIMULATOR_STATE.preset);
    setCutAnglePref(DEFAULT_SIMULATOR_STATE.cutAnglePref);
    cameraStateRef.current = createDefaultCameraState();
    setCameraResetNonce((n) => n + 1);
  }, []);

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
    deferredAxis, deferredAxisOffset,
    isAdjustingAxis, setIsAdjustingAxis,
    angleDeg, setAngleDeg,
    isPlaying, setIsPlaying,
    isAnimatingPreset,
    animationTrigger,
    startRevolutionAnimation,
    endRevolutionAnimation,
    slicesCount, setSlicesCount,
    showRiemann, setShowRiemann,
    riemannMode, setRiemannMode,
    showElement, setShowElement,
    xi, setXi,
    wireframe, setWireframe,
    opacity, setOpacity,
    panelTab, setPanelTab,
    preset, setPreset,
    cutAnglePref, setCutAnglePref,
    // cámara 3D + visibilidad + reset
    cameraStateRef,
    cameraResetNonce,
    isDocVisible,
    resetSimulatorState,
    resetDefaults: resetSimulatorState,
    // derivados
    fParsed, gParsed, range, a, b, f, g,
    integralData, riemannSlices, riemannStats,
    angleFraction, currentVolume,
    element, moveElement, boundsStatus,
  };
}
