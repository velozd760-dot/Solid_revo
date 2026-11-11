import React, { memo, useMemo } from 'react';
import { Calculator, AlertTriangle, Info } from 'lucide-react';
import KatexBlock from './KatexBlock';
import { GLASS, GLASS_INNER } from './GlassCard';

const COLOR = {
  indigo: 'text-blue-900',
  cyan: 'text-blue-800',
  emerald: 'text-slate-800',
  amber: 'text-amber-900',
  slate: 'text-slate-800',
};

const Step = memo(
  function Step({ n, title, tex, color = 'slate', highlight = false }) {
    return (
      <div
        className={`rounded-xl p-2.5 border transition-colors ${
          highlight
            ? 'bg-amber-50/70 border-amber-300 text-amber-900 shadow-sm'
            : `${GLASS_INNER} hover:border-blue-200`
        }`}
      >
        <div
          className={`text-[10px] uppercase tracking-wider mb-0.5 font-semibold flex items-center gap-1.5 ${
            highlight ? 'text-amber-800' : 'text-slate-500'
          }`}
        >
          <span
            className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
              highlight ? 'bg-amber-400 text-slate-900' : 'bg-blue-600 text-white'
            }`}
          >
            {n}
          </span>
          {title}
        </div>
        <KatexBlock tex={tex} className={`text-sm ${COLOR[color]}`} />
      </div>
    );
  },
  (prev, next) =>
    prev.tex === next.tex &&
    prev.n === next.n &&
    prev.title === next.title &&
    prev.color === next.color &&
    prev.highlight === next.highlight
);

const IntegralLatex = memo(function IntegralLatex({
  steps,
  fullVolume,
  currentVolume,
  angleFraction,
  warning,
}) {
  const isWashers = steps.method === 'washers';

  // Construye la lista de pasos visibles (memoizada)
  const rows = useMemo(() => {
    const list = [];
    list.push({
      title: isWashers ? 'Fórmula general (arandelas)' : 'Fórmula general (capas)',
      tex: steps.general,
      color: 'indigo',
    });
    if (steps.radii) {
      list.push({
        title: isWashers ? 'Radios exterior R(x) e interior r(x)' : 'Radio ρ(x) y altura h(x) de la capa',
        tex: steps.radii,
        color: 'indigo',
      });
    }
    if (steps.substituted) list.push({ title: 'Sustitución de límites y funciones', tex: steps.substituted, color: 'cyan' });
    if (steps.integrandSimplified) list.push({ title: 'Integrando desarrollado', tex: steps.integrandSimplified, color: 'cyan' });
    if (steps.antiderivative) list.push({ title: 'Antiderivada F(x)', tex: steps.antiderivative, color: 'emerald' });
    if (steps.evaluated) list.push({ title: 'Evaluación en [a, b]  (Teorema Fundamental)', tex: steps.evaluated, color: 'emerald' });
    if (steps.exact) list.push({ title: 'Resultado exacto', tex: steps.exact, color: 'amber', highlight: true });
    else if (steps.rationalHint) list.push({ title: 'Resultado ≈ en términos de π', tex: steps.rationalHint, color: 'amber', highlight: true });
    return list;
  }, [isWashers, steps]);

  return (
    <div
      translate="no"
      className={`${GLASS} notranslate h-full overflow-y-auto p-4 text-slate-800 space-y-3`}
    >
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <Calculator className="w-4 h-4 text-blue-600 shrink-0" />
        <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700 leading-snug">
          {steps.title ?? 'Planteamiento del volumen'}
        </h2>
      </div>

      {warning && (
        <div className="flex gap-2 items-start text-[11px] text-amber-900 bg-amber-50 border border-amber-300 rounded-lg p-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
          <span>{warning}</span>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2">
        {rows.map((row, i) => (
          <Step key={row.title} n={i + 1} {...row} />
        ))}
      </div>

      {/* Numeric result highlighted in soft amber/gold */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-50/70 rounded-xl border border-amber-300 text-amber-900">
        <div>
          <span className="text-xs text-amber-800 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Valor decimal (Simpson 1/3, giro 360°):
          </span>
          <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
            <span className="text-lg font-bold font-mono text-amber-900 tabular-nums">
              {fullVolume.toFixed(4)} <span className="text-xs font-normal text-amber-700">u³</span>
            </span>
            <span className="text-xs font-mono text-amber-800/80 tabular-nums">≈ {(fullVolume / Math.PI).toFixed(4)}π u³</span>
          </div>
        </div>

        {angleFraction < 0.999 && (
          <div className="border-l border-amber-300 pl-3">
            <span className="text-xs text-amber-800 block">Volumen del sólido parcial:</span>
            <span className="text-lg font-bold font-mono text-blue-700 tabular-nums">
              {currentVolume.toFixed(4)}{' '}
              <span className="text-xs font-normal text-amber-700 tabular-nums">u³ ({Math.round(angleFraction * 100)}%)</span>
            </span>
          </div>
        )}
      </div>

      {steps.notes?.map((note) => (
        <div key={note} className="flex gap-2 items-start text-[11px] text-slate-500 italic">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
          <span>{note}</span>
        </div>
      ))}
    </div>
  );
});

export default IntegralLatex;
