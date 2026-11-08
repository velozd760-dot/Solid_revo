import React from 'react';

/**
 * Estilo base para paneles del simulador en tema claro/azul suave:
 * fondo blanco translúcido bg-white/90, borde sutil border-slate-200/80,
 * y resplandor azul celeste/índigo al acercar el cursor.
 */
export const GLASS =
  'bg-white/90 backdrop-blur-xl rounded-2xl text-slate-800 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06),0_12px_32px_-8px_rgba(37,99,235,0.08)] hover:border-blue-400/80 hover:shadow-[0_14px_40px_-8px_rgba(37,99,235,0.20),inset_0_1px_0_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5 transform-gpu transition-all duration-300';

/** Sub-tarjeta interna limpia dentro de un panel principal. */
export const GLASS_INNER =
  'bg-slate-50/90 border border-slate-200/80 rounded-xl text-slate-700 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]';

/**
 * Estilo para tarjetas de Teoría y Desafíos con elevación hover:-translate-y-1
 * y brillo azul celeste/índigo sobre fondo blanco.
 */
export const GLASS_CLEAR =
  'bg-white/90 backdrop-blur-xl rounded-2xl text-slate-800 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06),0_12px_32px_-8px_rgba(37,99,235,0.08)] hover:border-blue-400/80 hover:shadow-[0_14px_40px_-8px_rgba(37,99,235,0.22),inset_0_1px_0_0_rgba(255,255,255,0.9)] hover:-translate-y-1 transform-gpu transition-all duration-300';

/** Sub-panel interno para diagramas y fórmulas en Teoría. */
export const GLASS_CLEAR_INNER =
  'bg-slate-50/90 border border-slate-200/80 rounded-xl text-slate-700';

export default function GlassCard({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`${GLASS} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
