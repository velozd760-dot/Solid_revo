/**
 * Calculus Engine for Solids of Revolution
 *
 * Región plana R = { (x, y) : a ≤ x ≤ b, min(f,g) ≤ y ≤ max(f,g) }
 *  - Si no hay segunda curva, g(x) = 0 (la región queda entre f(x) y el eje x).
 *  - axis = 'x' → giro alrededor de la recta horizontal y = k  → método de ARANDELAS
 *      V = π ∫ [R(x)² − r(x)²] dx
 *  - axis = 'y' → giro alrededor de la recta vertical x = h   → método de CAPAS
 *      V = 2π ∫ |x − h| · |f(x) − g(x)| dx
 */

/** Evalúa fn(x) y devuelve NaN ante cualquier problema de dominio. */
export function evalAt(fn, x) {
  try {
    const y = fn(x);
    return typeof y === 'number' && Number.isFinite(y) ? y : NaN;
  } catch {
    return NaN;
  }
}

/**
 * Evalúa la función sobre una malla de puntos en [a, b].
 * Maneja errores de dominio, asíntotas y NaN.
 */
export function sampleFunction(fn, a, b, samples = 200) {
  const points = [];
  const n = Math.max(2, Math.floor(Number(samples) || 200));
  const safeA = Number.isFinite(a) ? a : 0;
  const safeB = Number.isFinite(b) ? b : 1;
  const step = (safeB - safeA) / (n - 1);

  for (let i = 0; i < n; i++) {
    const x = safeA + i * step;
    const y = evalAt(fn, x);
    points.push({ x, y: Number.isNaN(y) ? 0 : y, isValid: !Number.isNaN(y) });
  }

  return points;
}

/**
 * Integración numérica con la Regla de Simpson 1/3 compuesta, O(h⁴).
 * Los puntos fuera de dominio aportan 0 (se contabilizan en `invalid`).
 */
export function integrateSimpsons(fn, a, b, n = 800) {
  if (a === b) return { value: 0, invalid: 0 };
  const segments = Math.max(400, n % 2 === 0 ? n : n + 1);
  const h = (b - a) / segments;

  let invalid = 0;
  const val = (x) => {
    const v = evalAt(fn, x);
    if (Number.isNaN(v)) {
      invalid += 1;
      return 0;
    }
    return v;
  };

  let sum = val(a) + val(b);
  for (let i = 1; i < segments; i++) {
    sum += (i % 2 === 0 ? 2 : 4) * val(a + i * h);
  }

  return { value: (h / 3) * sum, invalid: invalid / (segments + 1) };
}

/**
 * Radios exterior R e interior r (distancias al eje y = k) de la sección en un x.
 * Si el eje atraviesa la región, el sólido es macizo en ese punto (r = 0).
 */
export function radiiAt(fv, gv, k) {
  const lo = Math.min(fv, gv);
  const hi = Math.max(fv, gv);
  if (k <= lo) return { R: hi - k, r: lo - k, lo, hi };
  if (k >= hi) return { R: k - lo, r: k - hi, lo, hi };
  return { R: Math.max(hi - k, k - lo), r: 0, lo, hi };
}

/**
 * Sección transversal de la región en x: valores usados por el elemento diferencial.
 * @returns {{x, f, g, lo, hi, R, r, radius, height, valid}}
 */
export function sectionAt({ f, g, x, axis, axisOffset }) {
  const fv = evalAt(f, x);
  const gv = evalAt(g, x);
  const valid = !Number.isNaN(fv) && !Number.isNaN(gv);
  const F = valid ? fv : 0;
  const G = valid ? gv : 0;
  const { R, r, lo, hi } = radiiAt(F, G, axis === 'x' ? axisOffset : 0);

  return {
    x,
    f: F,
    g: G,
    lo,
    hi,
    valid,
    // Arandelas (eje horizontal y = k)
    R,
    r,
    // Capas (eje vertical x = h)
    radius: Math.abs(x - axisOffset),
    height: hi - lo,
  };
}

/** Integrando del volumen en cada x (sin el factor π o 2π). */
function volumeIntegrand({ f, g, axis, axisOffset }) {
  if (axis === 'x') {
    return (x) => {
      const s = sectionAt({ f, g, x, axis, axisOffset });
      return s.valid ? s.R * s.R - s.r * s.r : NaN;
    };
  }
  return (x) => {
    const s = sectionAt({ f, g, x, axis, axisOffset });
    return s.valid ? s.radius * s.height : NaN;
  };
}

/**
 * Volumen del sólido de revolución completo (360°) de alta precisión (Simpson n=800).
 * @returns {{fullVolume:number, invalidFraction:number}}
 */
export function computeVolume({ f, g, a, b, axis = 'x', axisOffset = 0 }) {
  const integrand = volumeIntegrand({ f, g, axis, axisOffset });
  const { value, invalid } = integrateSimpsons(integrand, a, b, 800);
  const factor = axis === 'x' ? Math.PI : 2 * Math.PI;
  return { fullVolume: Math.abs(factor * value), invalidFraction: invalid };
}

/**
 * Offset relativo dentro del subintervalo [x_i, x_{i+1}] según la regla de muestreo:
 *  - 'left'     → x_i* = a + i·Δx
 *  - 'right'    → x_i* = a + (i + 1)·Δx
 *  - 'midpoint' → x_i* = a + (i + 0.5)·Δx
 */
export function sampleOffsetForMode(mode = 'left') {
  if (mode === 'right') return 1;
  if (mode === 'midpoint') return 0.5;
  return 0;
}

/**
 * Elementos de la suma de Riemann (N discos/arandelas o N capas) con su volumen:
 *  - Arandelas: sum_{i=0}^{N-1} π · [R(x_i*)² − r(x_i*)²] · Δx
 *  - Capas:     sum_{i=0}^{N-1} 2π · ρ(x_i*) · h(x_i*) · Δx
 */
export function computeRiemannSlices({
  f,
  g = () => 0,
  a = 0,
  b = 1,
  axis = 'x',
  axisOffset = 0,
  count = 20,
  mode = 'left',
  sampleMode,
} = {}) {
  const safeCount = Math.max(1, Math.min(500, Math.floor(Number(count) || 20)));
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b || typeof f !== 'function') {
    return [];
  }
  const resolvedMode = sampleMode ?? mode ?? 'left';
  const dx = (b - a) / safeCount;
  if (!Number.isFinite(dx) || Math.abs(dx) < 1e-12) return [];
  const offset = sampleOffsetForMode(resolvedMode);
  const slices = [];

  for (let i = 0; i < safeCount; i++) {
    const x0 = a + i * dx;
    const x1 = x0 + dx;
    const xc = a + (i + 0.5) * dx;
    const xSample = a + (i + offset) * dx;
    const s = sectionAt({ f, g, x: xSample, axis, axisOffset });
    const rawVol =
      axis === 'x'
        ? Math.PI * (s.R * s.R - s.r * s.r) * dx
        : 2 * Math.PI * s.radius * s.height * dx;
    const volume = Number.isFinite(rawVol) ? Math.abs(rawVol) : 0;
    slices.push({
      index: i,
      x0,
      x1,
      xc,
      xSample,
      dx,
      ...s,
      volume,
    });
  }

  return slices;
}

/**
 * Detecta si el integrando del volumen (R(x)² − r(x)² o ρ(x)·h(x)) es lineal en [a, b].
 * Cuando el integrando es lineal (p. ej. f(x) = √x sobre eje x, donde R(x)² = x),
 * la regla del Punto Medio cancela exactamente el error geométrico por simetría.
 */
export function isIntegrandLinear({
  f,
  g = () => 0,
  a = 0,
  b = 1,
  axis = 'x',
  axisOffset = 0,
  samples = 25,
} = {}) {
  if (typeof f !== 'function' || !Number.isFinite(a) || !Number.isFinite(b) || a === b) {
    return false;
  }
  const integrand = volumeIntegrand({ f, g, axis, axisOffset });
  const ya = evalAt(integrand, a);
  const yb = evalAt(integrand, b);
  if (!Number.isFinite(ya) || !Number.isFinite(yb)) return false;

  let maxAbs = Math.max(Math.abs(ya), Math.abs(yb), 1e-6);
  const n = Math.max(5, samples);
  for (let i = 1; i < n - 1; i++) {
    const t = i / (n - 1);
    const x = a + t * (b - a);
    const y = evalAt(integrand, x);
    if (!Number.isFinite(y)) return false;
    maxAbs = Math.max(maxAbs, Math.abs(y));
    const yLine = ya + t * (yb - ya);
    if (Math.abs(y - yLine) > 1e-6 * maxAbs) {
      return false;
    }
  }
  return true;
}

/**
 * Clasifica la configuración (región, eje) para saber si la integral puede
 * plantearse simbólicamente con una única fórmula analítica en todo [a, b].
 */
export function analyzeConfiguration({ f, g, a, b, axis, axisOffset, samples = 241 }) {
  const eps = 1e-9;
  let fAbove = true;
  let gAbove = true;
  let minLo = Infinity;
  let maxHi = -Infinity;

  for (let i = 0; i < samples; i++) {
    const x = a + ((b - a) * i) / (samples - 1);
    const fv = evalAt(f, x);
    const gv = evalAt(g, x);
    if (Number.isNaN(fv) || Number.isNaN(gv)) return { kind: 'invalid' };
    if (fv < gv - eps) fAbove = false;
    if (gv < fv - eps) gAbove = false;
    minLo = Math.min(minLo, fv, gv);
    maxHi = Math.max(maxHi, fv, gv);
  }

  if (!fAbove && !gAbove) return { kind: 'mixed' };
  const top = fAbove ? 'f' : 'g';
  const bottom = fAbove ? 'g' : 'f';

  if (axis === 'x') {
    if (minLo >= axisOffset - eps) return { kind: 'washer-above', top, bottom };
    if (maxHi <= axisOffset + eps) return { kind: 'washer-below', top, bottom };
    return { kind: 'washer-crossing', top, bottom };
  }

  if (axisOffset <= a + eps) return { kind: 'shell-right', top, bottom };
  if (axisOffset >= b - eps) return { kind: 'shell-left', top, bottom };
  return { kind: 'shell-inside', top, bottom };
}

/**
 * Aproxima un número por una fracción p/q (fracciones continuas).
 * Devuelve null si no hay una fracción "limpia" dentro de la tolerancia.
 */
export function toFraction(value, maxDenominator = 2000, tolerance = 1e-9) {
  if (!Number.isFinite(value)) return null;
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);

  let h1 = 1;
  let h0 = 0;
  let k1 = 0;
  let k0 = 1;
  let y = x;

  for (let i = 0; i < 40; i++) {
    const a = Math.floor(y);
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > maxDenominator) break;
    h0 = h1;
    h1 = h2;
    k0 = k1;
    k1 = k2;
    if (Math.abs(x - h1 / k1) <= tolerance * Math.max(1, x)) {
      return { p: sign * h1, q: k1 };
    }
    const frac = y - a;
    if (frac < 1e-12) break;
    y = 1 / frac;
  }
  return null;
}
