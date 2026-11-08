import React, { memo, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Cometas / destellos diagonales en tonos azul suave (.cosmic-comet-light en index.css)
 * sobre el fondo claro bg-slate-50 / bg-blue-50/40.
 */
const LIGHT_COMETS = [
  { id: 'c1', top: '6%', left: '92%', width: '175px', dur: '8.5s', delay: '0s' },
  { id: 'c2', top: '24%', left: '104%', width: '215px', dur: '10.2s', delay: '2.2s' },
  { id: 'c3', top: '44%', left: '108%', width: '155px', dur: '9.4s', delay: '4.5s' },
  { id: 'c4', top: '14%', left: '62%', width: '195px', dur: '11.2s', delay: '1.6s' },
  { id: 'c5', top: '62%', left: '106%', width: '165px', dur: '9.8s', delay: '6.1s' },
  { id: 'c6', top: '34%', left: '96%', width: '225px', dur: '11.8s', delay: '3.4s' },
  { id: 'c7', top: '78%', left: '98%', width: '185px', dur: '10.6s', delay: '7.4s' },
];

/** Símbolos matemáticos flotantes en capas de profundidad sobre el fondo claro. */
const SYMBOLS = [
  // Capa lejana
  { id: 'f1', text: '∫', left: '5%', top: '38%', size: 'text-[7.5rem]', layer: 'far', rot: -10, dur: '22s', delay: '0s' },
  { id: 'f2', text: 'π', left: '82%', top: '34%', size: 'text-[8rem]', layer: 'far', rot: 12, dur: '25s', delay: '-5s' },
  { id: 'f3', text: '∑', left: '14%', top: '78%', size: 'text-[7rem]', layer: 'far', rot: 7, dur: '24s', delay: '-9s' },
  { id: 'f4', text: '∞', left: '85%', top: '76%', size: 'text-[7.5rem]', layer: 'far', rot: -8, dur: '26s', delay: '-4s' },

  // Capa media
  { id: 'm1', text: 'dx', left: '26%', top: '48%', size: 'text-5xl', layer: 'mid', rot: -6, dur: '18s', delay: '-2s' },
  { id: 'm2', text: 'f(x)', left: '66%', top: '52%', size: 'text-5xl', layer: 'mid', rot: 8, dur: '19s', delay: '-6s' },
  { id: 'm3', text: 'R²−r²', left: '46%', top: '86%', size: 'text-4xl', layer: 'mid', rot: -5, dur: '20s', delay: '-11s' },
  { id: 'm4', text: '2πrh', left: '8%', top: '62%', size: 'text-4xl', layer: 'mid', rot: 9, dur: '17s', delay: '-7s' },
  { id: 'm5', text: 'Δx', left: '90%', top: '58%', size: 'text-5xl', layer: 'mid', rot: -9, dur: '21s', delay: '-3s' },
];

const FAR_ITEMS = SYMBOLS.filter((s) => s.layer === 'far');
const MID_ITEMS = SYMBOLS.filter((s) => s.layer === 'mid');

const MathBackground = memo(function MathBackground() {
  const normX = useMotionValue(0);
  const normY = useMotionValue(0);

  const smoothX = useSpring(normX, { stiffness: 45, damping: 24, mass: 0.8 });
  const smoothY = useSpring(normY, { stiffness: 45, damping: 24, mass: 0.8 });

  const farX = useTransform(smoothX, [-0.5, 0.5], [18, -18]);
  const farY = useTransform(smoothY, [-0.5, 0.5], [14, -14]);
  const midX = useTransform(smoothX, [-0.5, 0.5], [40, -40]);
  const midY = useTransform(smoothY, [-0.5, 0.5], [28, -28]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      normX.set(e.clientX / w - 0.5);
      normY.set(e.clientY / h - 0.5);
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [normX, normY]);

  const farItems = FAR_ITEMS;
  const midItems = MID_ITEMS;

  return (
    <div
      aria-hidden="true"
      translate="no"
      className="notranslate fixed inset-0 -z-10 overflow-hidden bg-slate-50 pointer-events-none select-none"
    >
      {/* Matices suaves en azul cielo e índigo muy claro (bg-blue-50/40) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(62rem 38rem at 14% 25%, rgba(59, 130, 246, 0.08), transparent 70%),
            radial-gradient(56rem 36rem at 86% 35%, rgba(96, 165, 250, 0.10), transparent 70%),
            radial-gradient(52rem 34rem at 50% 88%, rgba(37, 99, 235, 0.06), transparent 72%)
          `,
        }}
      />

      {/* Cuadrícula geométrica muy tenue */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(59, 130, 246, 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.045) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Cometas diagonales en tonos azul suave sobre el fondo claro */}
      <div className="absolute inset-0 overflow-hidden">
        {LIGHT_COMETS.map((c) => (
          <span
            key={c.id}
            className="cosmic-comet-light"
            style={{
              top: c.top,
              left: c.left,
              width: c.width,
              '--comet-dur': c.dur,
              '--comet-delay': c.delay,
            }}
          />
        ))}
      </div>

      {/* Capa lejana de símbolos matemáticos en azul tenue */}
      <motion.div style={{ x: farX, y: farY }} className="absolute inset-0">
        {farItems.map((el) => (
          <div
            key={el.id}
            style={{
              left: el.left,
              top: el.top,
              '--rot': `${el.rot}deg`,
              '--float-dur': el.dur,
              '--float-delay': el.delay,
            }}
            className={`math-float absolute font-serif font-bold tracking-tight text-blue-900/[0.045] ${el.size}`}
          >
            {el.text}
          </div>
        ))}
      </motion.div>

      {/* Capa media de símbolos matemáticos en azul suave */}
      <motion.div style={{ x: midX, y: midY }} className="absolute inset-0">
        {midItems.map((el) => (
          <div
            key={el.id}
            style={{
              left: el.left,
              top: el.top,
              '--rot': `${el.rot}deg`,
              '--float-dur': el.dur,
              '--float-delay': el.delay,
            }}
            className={`math-float absolute font-serif font-semibold tracking-tight text-blue-600/[0.06] ${el.size}`}
          >
            {el.text}
          </div>
        ))}
      </motion.div>
    </div>
  );
});

export default MathBackground;
