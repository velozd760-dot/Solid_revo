/**
 * Expression tools
 * - normalizeExpression: acepta notación "amigable" (ln, sen, π, √, ², ³) y fuerza la variable formal "x"
 * - parseBound: evalúa límites como números o expresiones (pi/2, 2*pi, -1.5 ...)
 * - expressionToLatex: convierte f(x) a LaTeX válido para KaTeX a partir del AST de mathjs
 * - analyzeExpression: valida y compila f(x) de forma segura
 */
import { parse, evaluate } from 'mathjs';

/** Traduce notación común en español / Unicode a sintaxis mathjs y nerdamer, asegurando la variable formal "x". */
export function normalizeExpression(str = '') {
  return String(str)
    .replace(/\\text\{\s*inc[oó]gnita\s*\}/gi, 'x')
    .replace(/\\mathrm\{\s*inc[oó]gnita\s*\}/gi, 'x')
    .replace(/inc[oó]gnita/gi, 'x')
    .replace(/\bX\b/g, 'x')
    .replace(/π/g, 'pi')
    .replace(/√\s*\(/g, 'sqrt(')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/\bsen\s*\(/gi, 'sin(')
    .replace(/\btg\s*\(/gi, 'tan(')
    .replace(/\bln\s*\(/gi, 'log(')
    .trim();
}

/** Limpia cualquier rastro de palabras descriptivas en cadenas LaTeX para preservar siempre la variable formal "x". */
export function sanitizeLatexVariable(tex = '') {
  return String(tex)
    .replace(/\\text\{\s*inc[oó]gnita\s*\}/gi, 'x')
    .replace(/\\mathrm\{\s*inc[oó]gnita\s*\}/gi, 'x')
    .replace(/\\operatorname\{\s*inc[oó]gnita\s*\}/gi, 'x')
    .replace(/inc[oó]gnita/gi, 'x');
}

/** Evalúa un límite escrito como texto. Devuelve NaN si no es válido. */
export function parseBound(str) {
  try {
    const value = evaluate(normalizeExpression(str));
    return typeof value === 'number' && Number.isFinite(value) ? value : NaN;
  } catch {
    return NaN;
  }
}

/* ------------------------------------------------------------------ */
/*  AST -> LaTeX                                                       */
/* ------------------------------------------------------------------ */

const P = { ADD: 1, MUL: 2, NEG: 3, POW: 4, ATOM: 5 };

const TRIG = {
  sin: '\\sin', cos: '\\cos', tan: '\\tan', sec: '\\sec', csc: '\\csc', cot: '\\cot',
  sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh',
  asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan',
};

const wrap = (r) => `\\left(${r.s}\\right)`;
const paren = (r, minPrec) => (r.p < minPrec ? wrap(r) : r.s);

function numberToTex(v) {
  if (!Number.isFinite(v)) return '\\text{?}';
  const str = String(v);
  const m = /^(-?[\d.]+)e([+-]?\d+)$/i.exec(str);
  if (m) return `${m[1]}\\times 10^{${Number(m[2])}}`;
  return str;
}

function symbolToTex(name) {
  if (name === 'pi') return '\\pi';
  if (name === 'e') return 'e';
  if (name === 'x' || name === 'X' || /^inc[oó]gnita$/i.test(name)) return 'x';
  if (name.length === 1) return name;
  return `\\mathrm{${name}}`;
}

/** Convierte sin los paréntesis externos del usuario (para argumentos de \frac, \sqrt, etc.) */
function inner(node) {
  return node.type === 'ParenthesisNode' ? inner(node.content) : conv(node);
}

function convFunction(node) {
  const name = node.fn?.name ?? node.name;
  const args = node.args.map(inner);
  const a0 = args[0]?.s ?? '';

  if (TRIG[name]) return { s: `${TRIG[name]}\\left(${a0}\\right)`, p: P.ATOM };

  switch (name) {
    case 'sqrt':
      return { s: `\\sqrt{${a0}}`, p: P.ATOM };
    case 'cbrt':
      return { s: `\\sqrt[3]{${a0}}`, p: P.ATOM };
    case 'nthRoot':
      return { s: `\\sqrt[${args[1]?.s ?? '2'}]{${a0}}`, p: P.ATOM };
    case 'abs':
      return { s: `\\left|${a0}\\right|`, p: P.ATOM };
    case 'exp':
      return { s: `e^{${a0}}`, p: P.POW };
    case 'log':
      return args.length > 1
        ? { s: `\\log_{${args[1].s}}\\left(${a0}\\right)`, p: P.ATOM }
        : { s: `\\ln\\left(${a0}\\right)`, p: P.ATOM };
    case 'log10':
      return { s: `\\log_{10}\\left(${a0}\\right)`, p: P.ATOM };
    case 'log2':
      return { s: `\\log_{2}\\left(${a0}\\right)`, p: P.ATOM };
    default:
      return {
        s: `\\operatorname{${name}}\\left(${args.map((r) => r.s).join(', ')}\\right)`,
        p: P.ATOM,
      };
  }
}

function convOperator(node) {
  const [n0, n1] = node.args;

  switch (node.fn) {
    case 'add': {
      const l = conv(n0);
      const r = conv(n1);
      return { s: r.s.startsWith('-') ? `${l.s}${r.s}` : `${l.s}+${r.s}`, p: P.ADD };
    }
    case 'subtract': {
      const l = conv(n0);
      const r = conv(n1);
      return { s: `${l.s}-${paren(r, P.MUL)}`, p: P.ADD };
    }
    case 'multiply': {
      const l = conv(n0);
      const r = conv(n1);
      const left = paren(l, P.MUL);
      const right = r.p < P.MUL || r.p === P.NEG ? wrap(r) : r.s;
      const startsWithDigit = /^[\d.]/.test(right);
      const leftIsConstant = n0.type === 'ConstantNode';
      let joiner = ' \\cdot ';
      if (leftIsConstant && !startsWithDigit) joiner = '';
      else if (node.implicit && !startsWithDigit) joiner = '\\,';
      return { s: `${left}${joiner}${right}`, p: P.MUL };
    }
    case 'divide':
      return { s: `\\frac{${inner(n0).s}}{${inner(n1).s}}`, p: P.ATOM };
    case 'pow': {
      const base = conv(n0);
      const needsWrap = base.p < P.ATOM || (n0.type === 'OperatorNode' && n0.fn === 'divide');
      const baseS = needsWrap ? wrap(base) : base.s;
      return { s: `${baseS}^{${inner(n1).s}}`, p: P.POW };
    }
    case 'unaryMinus': {
      const a = conv(n0);
      return { s: `-${a.p <= P.NEG ? wrap(a) : a.s}`, p: P.NEG };
    }
    case 'unaryPlus':
      return conv(n0);
    default:
      return { s: sanitizeLatexVariable(node.toTex()), p: P.ATOM };
  }
}

function conv(node) {
  switch (node.type) {
    case 'ConstantNode':
      return {
        s: typeof node.value === 'number' ? numberToTex(node.value) : String(node.value),
        p: P.ATOM,
      };
    case 'SymbolNode':
      return { s: symbolToTex(node.name), p: P.ATOM };
    case 'ParenthesisNode':
      return { s: `\\left(${conv(node.content).s}\\right)`, p: P.ATOM };
    case 'FunctionNode':
      return convFunction(node);
    case 'OperatorNode':
      return convOperator(node);
    default:
      return { s: sanitizeLatexVariable(node.toTex()), p: P.ATOM };
  }
}

/**
 * Convierte el texto de una función a LaTeX.
 * @returns {{latex: string, isSum: boolean, error: string|null}}
 */
export function expressionToLatex(str) {
  try {
    const node = parse(normalizeExpression(str));
    const r = conv(node);
    return { latex: sanitizeLatexVariable(r.s), isSum: r.p === P.ADD, error: null };
  } catch (err) {
    return { latex: '\\text{?}', isSum: false, error: err.message };
  }
}

/** Envuelve en paréntesis si la expresión es una suma/resta. */
export function wrapIfSum(info) {
  return info.isSum ? `\\left(${info.latex}\\right)` : info.latex;
}

/* ------------------------------------------------------------------ */
/*  Validación y compilación segura                                    */
/* ------------------------------------------------------------------ */

const EMPTY = (error) => ({
  isValid: false,
  error,
  latex: '\\text{?}',
  isSum: false,
  normalized: '',
  fn: () => NaN,
});

/**
 * Valida una expresión en la variable x y devuelve una función numérica segura.
 */
export function analyzeExpression(str) {
  const normalized = normalizeExpression(str);
  if (!normalized) return EMPTY('Expresión vacía');

  try {
    const node = parse(normalized);
    const compiled = node.compile();

    // Detecta símbolos/funciones no definidos con una evaluación de prueba
    try {
      compiled.evaluate({ x: 0.5 });
    } catch (err) {
      if (/Undefined (symbol|function)/i.test(err.message)) {
        const name = err.message.replace(/^Undefined (symbol|function)\s*/i, '');
        return EMPTY(`"${name}" no está definido. Usa solo la variable x.`);
      }
    }

    const fn = (x) => {
      try {
        const res = compiled.evaluate({ x });
        if (typeof res === 'number') return res;
        if (res && typeof res.re === 'number') {
          return Math.abs(res.im) < 1e-9 ? res.re : NaN;
        }
        return NaN;
      } catch {
        return NaN;
      }
    };

    const tex = expressionToLatex(normalized);
    return {
      isValid: true,
      error: null,
      latex: tex.latex,
      isSum: tex.isSum,
      normalized,
      fn,
    };
  } catch (err) {
    return EMPTY(err.message || 'Error de sintaxis');
  }
}
