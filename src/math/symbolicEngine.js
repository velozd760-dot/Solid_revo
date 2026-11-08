/**
 * Symbolic Engine
 * Plantea paso a paso la integral del volumen (fórmula general, sustitución,
 * antiderivada, evaluación en [a, b] y resultado exacto en términos de π)
 * usando nerdamer para el álgebra simbólica y las curvas ya validadas con mathjs.
 */
import nerdamer from 'nerdamer';
import { analyzeConfiguration, toFraction } from './calculusEngine';
import { expressionToLatex, normalizeExpression, sanitizeLatexVariable } from './expressionTools';

/* ------------------------------------------------------------------ */
/*  Utilidades                                                         */
/* ------------------------------------------------------------------ */

const isLiteralNumber = (str) => /^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(str.trim());

/** Valor numérico exacto como cadena para nerdamer (fracción si es posible). */
function exactNumberString(value) {
  if (Number.isInteger(value)) return String(value);
  const frac = toFraction(value, 10000, 1e-12);
  return frac ? `(${frac.p}/${frac.q})` : String(value);
}

/** Límite como cadena para nerdamer: conserva pi, sqrt... o convierte decimales a fracciones. */
function boundExpression(str, value) {
  const normalized = normalizeExpression(str);
  return isLiteralNumber(normalized) ? exactNumberString(value) : `(${normalized})`;
}

const fmtNum = (v) => {
  if (!Number.isFinite(v)) return '?';
  const rounded = Math.round(v * 1e6) / 1e6;
  return String(rounded);
};

const wrapTerm = (info) =>
  info.isSum || info.latex.startsWith('-') ? `\\left(${info.latex}\\right)` : info.latex;

/** −curva en LaTeX (simplifica el doble signo: −(−x) = x). */
function negateTerm(info) {
  if (info.latex.startsWith('-') && !info.isSum) return info.latex.slice(1);
  return `-${wrapTerm(info)}`;
}

/** Sustituye decimales (1.2, .5) por fracciones exactas para que nerdamer no pierda exactitud. */
function fractionizeDecimals(expr) {
  return expr.replace(/\d*\.\d+/g, (m) => {
    const frac = toFraction(parseFloat(m), 10000, 1e-12);
    return frac ? `(${frac.p}/${frac.q})` : m;
  });
}

/** Resta o suma una constante k a una expresión LaTeX: curve − k */
function minusConst(latex, k) {
  if (k === 0) return latex;
  return k > 0 ? `${latex} - ${fmtNum(k)}` : `${latex} + ${fmtNum(-k)}`;
}

const cleanTex = (tex) =>
  sanitizeLatexVariable(tex)
    .replace(/\s*\\cdot\s*\\pi/g, '\\,\\pi')
    .replace(/\\cdot\s*\\sqrt/g, '\\sqrt')
    .replace(/\s+/g, ' ')
    .trim();

/** Número entero o racional o simbólico → LaTeX limpio via nerdamer. */
function nerdamerTex(expr) {
  return cleanTex(nerdamer(expr).toTeX());
}

/* ------------------------------------------------------------------ */
/*  API principal                                                      */
/* ------------------------------------------------------------------ */

/**
 * @param {object} p
 * @param {object} p.fInfo   resultado de analyzeExpression para f(x)
 * @param {object} p.gInfo   resultado de analyzeExpression para g(x)  (si hasG)
 * @param {boolean} p.hasG   ¿región entre dos curvas?
 * @param {string} p.aStr    texto del límite inferior
 * @param {string} p.bStr    texto del límite superior
 * @param {number} p.a       valor numérico (a < b)
 * @param {number} p.b
 * @param {'x'|'y'} p.axis   'x' → eje horizontal y = k (arandelas); 'y' → eje vertical x = c (capas)
 * @param {number} p.axisOffset
 * @param {number} p.fullVolume volumen numérico (Simpson), para verificar el resultado exacto
 */
export function buildIntegralSteps({
  fInfo,
  gInfo,
  hasG,
  aStr,
  bStr,
  a,
  b,
  axis,
  axisOffset,
  fullVolume,
}) {
  const steps = { method: axis === 'x' ? 'washers' : 'shells', notes: [] };
  const k = axisOffset;

  const zeroInfo = { latex: '0', isSum: false };
  const fTex = fInfo;
  const gTex = hasG ? gInfo : zeroInfo;

  const aTex = expressionToLatex(aStr).latex;
  const bTex = expressionToLatex(bStr).latex;
  const limits = `_{${aTex}}^{${bTex}}`;

  const config = analyzeConfiguration({
    f: fInfo.fn,
    g: hasG ? gInfo.fn : () => 0,
    a,
    b,
    axis,
    axisOffset,
  });
  steps.kind = config.kind;

  const curveInfo = (key) => (key === 'f' ? fTex : gTex);
  const curveStr = (key) => {
    if (key === 'f') return `(${fractionizeDecimals(fInfo.normalized)})`;
    return hasG ? `(${fractionizeDecimals(gInfo.normalized)})` : '(0)';
  };
  const isZero = (key) => key === 'g' && !hasG;

  /* ---------------- 1) Fórmula general + planteamiento ---------------- */
  let integrandStr = null; // para nerdamer (sin el factor π / 2π)
  let factorTex = '\\pi';
  let factorStr = '1'; // factor numérico previo a π en nerdamer

  if (axis === 'x') {
    steps.title = 'Método de las arandelas (eje horizontal)';
    steps.general =
      'V = \\pi \\int_{a}^{b} \\left[ R(x)^{2} - r(x)^{2} \\right] dx';
    steps.axisLabel = `y = ${fmtNum(k)}`;

    if (config.kind === 'washer-above' || config.kind === 'washer-below') {
      const above = config.kind === 'washer-above';
      const outerKey = above ? config.top : config.bottom;
      const innerKey = above ? config.bottom : config.top;
      const kStr = exactNumberString(k);

      // R(x), r(x) en LaTeX
      const radiusTex = (key) => {
        const c = curveInfo(key);
        if (above) return minusConst(c.latex, k);
        // por debajo del eje: k − curva
        if (k === 0) return negateTerm(c);
        return `${fmtNum(k)} - ${wrapTerm(c)}`;
      };
      const radiusIsZero = (key) => isZero(key) && k === 0;

      const Rtex = radiusTex(outerKey);
      const rtex = radiusTex(innerKey);
      steps.radii = `R(x) = ${radiusIsZero(outerKey) ? '0' : Rtex}, \\qquad r(x) = ${radiusIsZero(innerKey) ? '0' : rtex}`;

      const innerTerm = radiusIsZero(innerKey)
        ? ''
        : ` - \\left(${rtex}\\right)^{2}`;
      steps.substituted = `V = \\pi \\int${limits} \\left[ \\left(${Rtex}\\right)^{2}${innerTerm} \\right] dx`;

      const sub = (key) => (above ? `(${curveStr(key)}-${kStr})` : `(${kStr}-${curveStr(key)})`);
      integrandStr = `${sub(outerKey)}^2-${sub(innerKey)}^2`;
    } else if (config.kind === 'washer-crossing') {
      steps.radii =
        'R(x) = \\max\\{\\,|f(x)-k|,\\ |g(x)-k|\\,\\}, \\qquad r(x) = 0';
      steps.substituted = `V = \\pi \\int${limits} \\left[ R(x)^{2} \\right] dx`;
      steps.notes.push(
        'El eje de giro atraviesa la región: el sólido es macizo en esa zona (r = 0) y el radio exterior es el mayor entre las dos distancias al eje. Se evalúa numéricamente (Simpson).'
      );
    }
  } else {
    steps.title = 'Método de las capas cilíndricas (eje vertical)';
    steps.general = 'V = 2\\pi \\int_{a}^{b} \\rho(x)\\, h(x)\\, dx';
    steps.axisLabel = `x = ${fmtNum(k)}`;
    factorTex = '2\\pi';
    factorStr = '2';

    if (config.kind === 'shell-right' || config.kind === 'shell-left') {
      const right = config.kind === 'shell-right';
      const top = curveInfo(config.top);
      const bottom = curveInfo(config.bottom);

      const rhoTex = right
        ? minusConst('x', k)
        : k === 0
          ? '-x'
          : `${fmtNum(k)} - x`;

      let heightTex;
      if (isZero(config.bottom)) heightTex = top.latex;
      else if (isZero(config.top)) heightTex = negateTerm(bottom);
      else heightTex = `${top.latex} - ${wrapTerm(bottom)}`;

      steps.radii = `\\rho(x) = ${rhoTex}, \\qquad h(x) = ${heightTex}`;
      const rhoFactor = rhoTex === 'x' ? 'x' : `\\left(${rhoTex}\\right)`;
      steps.substituted = `V = 2\\pi \\int${limits} ${rhoFactor}\\left(${heightTex}\\right) dx`;

      const kStr = exactNumberString(k);
      const heightStr = `(${curveStr(config.top)}-${curveStr(config.bottom)})`;
      integrandStr = right ? `(x-${kStr})*${heightStr}` : `(${kStr}-x)*${heightStr}`;
    } else if (config.kind === 'shell-inside') {
      steps.radii = '\\rho(x) = |x - c|, \\qquad h(x) = |f(x) - g(x)|';
      steps.substituted = `V = 2\\pi \\int${limits} |x - c|\\,|f(x) - g(x)|\\, dx`;
      steps.notes.push(
        'El eje de giro corta el intervalo [a, b]: |x − c| cambia de signo, por lo que la integral debe partirse en dos tramos. Se evalúa numéricamente (Simpson).'
      );
    }
  }

  if (config.kind === 'mixed') {
    steps.substituted = `V = ${axis === 'x' ? '\\pi' : '2\\pi'} \\int${limits} (\\cdots)\\, dx`;
    steps.notes.push(
      'Las curvas f(x) y g(x) se cruzan dentro de [a, b]. Divide el intervalo en los puntos de intersección. Se evalúa numéricamente (Simpson).'
    );
  } else if (config.kind === 'invalid') {
    steps.notes.push(
      'Alguna de las curvas no está definida en todo [a, b] (raíz de un negativo, división por cero…). Ajusta el intervalo o la función.'
    );
  }

  steps.decimal = `V \\approx ${fmtNum(fullVolume)}\\ \\text{u}^{3}`;
  steps.exactAvailable = false;

  /* ---------------- 2) Antiderivada y resultado exacto ---------------- */
  if (!integrandStr) {
    steps.rationalHint = rationalHint(fullVolume);
    return steps;
  }

  try {
    const expanded = nerdamer(`expand(${integrandStr})`);
    steps.integrandSimplified = `V = ${factorTex} \\int${limits} \\left(${cleanTex(expanded.toTeX())}\\right) dx`;

    const antiderivative = nerdamer(`integrate(expand(${integrandStr}), x)`);
    const Fs = antiderivative.toString();
    if (/integrate\(/.test(Fs)) {
      steps.notes.push(
        'No se encontró una antiderivada elemental para este integrando; se muestra solo el valor numérico (Simpson).'
      );
      steps.rationalHint = rationalHint(fullVolume);
      return steps;
    }

    const FTex = cleanTex(antiderivative.toTeX());
    steps.antiderivative = `V = ${factorTex} \\left[ ${FTex} \\right]${limits}`;

    const aExpr = boundExpression(aStr, a);
    const bExpr = boundExpression(bStr, b);
    const Fb = nerdamer(Fs, { x: bExpr }).toString();
    const Fa = nerdamer(Fs, { x: aExpr }).toString();

    const FbTex = nerdamerTex(Fb);
    const FaTex = nerdamerTex(Fa);
    const FaWrapped = FaTex.startsWith('-') || /[+]|\s-\s/.test(FaTex) ? `\\left(${FaTex}\\right)` : FaTex;
    steps.evaluated = `V = ${factorTex} \\left[ F(${bTex}) - F(${aTex}) \\right] = ${factorTex} \\left[ ${FbTex} - ${FaWrapped} \\right]`;

    const exact = nerdamer(`pi*${factorStr}*((${Fb})-(${Fa}))`);
    const exactStr = exact.toString();
    const exactValue = Number(nerdamer(exactStr).evaluate().text('decimals'));

    // Verificación cruzada con la integración numérica
    const relErr = Math.abs(exactValue - fullVolume) / Math.max(1e-12, Math.abs(fullVolume));
    if (!/\./.test(exactStr) && relErr < 1e-3 && Number.isFinite(exactValue)) {
      steps.exact = `V = ${cleanTex(exact.toTeX())}\\ \\text{u}^{3}`;
      steps.exactAvailable = true;
      steps.exactNumeric = Math.abs(exactValue);
    } else if (relErr >= 1e-3) {
      steps.notes.push(
        'La antiderivada simbólica no coincide con la integración numérica (posible valor absoluto o dominio restringido); se muestra el valor numérico.'
      );
      steps.evaluated = null;
      steps.antiderivative = null;
      steps.rationalHint = rationalHint(fullVolume);
    } else {
      steps.rationalHint = rationalHint(fullVolume);
    }
  } catch (err) {
    steps.notes.push('No fue posible plantear la antiderivada simbólica: se usa el valor numérico.');
    steps.rationalHint = rationalHint(fullVolume);
    steps.error = err?.message;
  }

  return steps;
}

/** Si V/π es una fracción "limpia", devuelve LaTeX de la forma p/q·π */
function rationalHint(volume) {
  const frac = toFraction(volume / Math.PI, 1000, 1e-8);
  if (!frac || frac.p === 0) return null;
  const body = frac.q === 1 ? `${frac.p}` : `\\frac{${frac.p}}{${frac.q}}`;
  return `V \\approx ${body}\\,\\pi\\ \\text{u}^{3}`;
}
