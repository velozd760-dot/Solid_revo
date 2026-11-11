import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Circle, Disc3, Layers, Sigma, Sparkles, Target } from 'lucide-react';
import { GLASS_CLEAR, GLASS_CLEAR_INNER } from '../components/GlassCard';
import KatexBlock from '../components/KatexBlock';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 24 } },
};

/** Variable matemática inline destacada únicamente en texto dorado sin cajas ni fondos. */
function DxBadge({ children = 'dx' }) {
  return (
    <span className="text-amber-500 font-bold mx-1">
      {children}
    </span>
  );
}

/** Ilustración: disco (sección sólida) con elemento diferencial dx en amarillo/ámbar. */
function DiskDiagram() {
  return (
    <svg viewBox="0 0 220 120" className="w-full h-28" fill="none" aria-hidden="true">
      <path d="M10 100 H210 M10 100 V10" className="stroke-slate-300" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 90 C60 85 100 50 190 24" className="stroke-blue-600" strokeWidth="2.5" />
      <rect x="104" y="48" width="12" height="52" className="fill-amber-400/75 stroke-amber-500" />
      <ellipse cx="170" cy="62" rx="12" ry="34" className="fill-blue-500/15 stroke-blue-600" strokeWidth="2" />
      <ellipse cx="170" cy="62" rx="12" ry="34" className="stroke-amber-500" strokeDasharray="3 3" />
      <path d="M10 100 H210" className="stroke-rose-500" strokeDasharray="6 4" strokeWidth="1.8" />
    </svg>
  );
}

/** Ilustración: arandela (disco con hueco) con elemento diferencial dx en amarillo/ámbar. */
function WasherDiagram() {
  return (
    <svg viewBox="0 0 220 120" className="w-full h-28" fill="none" aria-hidden="true">
      <path d="M10 108 H210 M10 108 V8" className="stroke-slate-300" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 84 C60 70 110 40 190 16" className="stroke-blue-600" strokeWidth="2.5" />
      <path d="M10 96 C60 94 120 82 190 58" className="stroke-indigo-500" strokeWidth="2.5" />
      <rect x="104" y="48" width="12" height="34" className="fill-amber-400/75 stroke-amber-500" />
      <circle cx="168" cy="82" r="30" className="fill-blue-500/15 stroke-blue-600" strokeWidth="2" />
      <circle cx="168" cy="82" r="14" className="fill-white stroke-indigo-500" strokeWidth="2" />
      <path d="M168 82 L190 60" className="stroke-amber-500" strokeWidth="2" />
      <text x="184" y="64" className="fill-amber-700" fontSize="10" fontWeight="700">R</text>
      <text x="171" y="97" className="fill-indigo-700" fontSize="10" fontWeight="700">r</text>
    </svg>
  );
}

/** Ilustración: capa cilíndrica con elemento diferencial dx en amarillo/ámbar. */
function ShellDiagram() {
  return (
    <svg viewBox="0 0 220 120" className="w-full h-28" fill="none" aria-hidden="true">
      <path d="M10 108 H210 M10 108 V8" className="stroke-slate-300" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 108 C60 100 110 60 190 20" className="stroke-blue-600" strokeWidth="2.5" />
      <rect x="86" y="62" width="10" height="46" className="fill-amber-400/75 stroke-amber-500" />
      <ellipse cx="160" cy="46" rx="26" ry="9" className="fill-blue-500/10 stroke-blue-600" strokeWidth="2" />
      <ellipse cx="160" cy="46" rx="20" ry="6" className="stroke-amber-500" strokeWidth="2" />
      <path d="M134 46 V92 M186 46 V92" className="stroke-blue-600" strokeWidth="2" />
      <path d="M134 92 A26 9 0 0 0 186 92" className="stroke-blue-600" strokeWidth="2" />
      <path d="M10 108 V8" className="stroke-rose-500" strokeDasharray="6 4" strokeWidth="1.8" />
    </svg>
  );
}

function TheoryCard({ icon: Icon, badge, title, children, formula, note, diagram }) {
  return (
    <motion.article variants={item} className={`${GLASS_CLEAR} p-6 md:p-8 group`}>
      <div className="flex items-start gap-4 mb-5">
        <span className="shrink-0 grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 group-hover:scale-105 transition-transform duration-300">
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-300 rounded-full px-2.5 py-0.5">
            {badge}
          </span>
          <h2 className="mt-1.5 text-xl md:text-2xl font-bold text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors">
            {title}
          </h2>
        </div>
      </div>

      <div className={`grid ${diagram ? 'md:grid-cols-[1fr_15.5rem]' : 'grid-cols-1'} gap-5 items-start`}>
        <div className="text-sm md:text-[15px] leading-relaxed text-slate-600 space-y-3">{children}</div>
        {diagram && <div className={`${GLASS_CLEAR_INNER} p-3`}>{diagram}</div>}
      </div>

      {formula && (
        <div className="mt-5 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-white to-amber-50/50 px-5 py-3.5 text-slate-800 text-lg group-hover:border-blue-300/80 transition-colors">
          <KatexBlock tex={formula} />
        </div>
      )}
      {note && <p className="mt-3 text-xs text-slate-500">{note}</p>}
    </motion.article>
  );
}

export default function TheoryView({ onNavigate }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Tarjeta superior de síntesis rápida */}
      <motion.section
        variants={item}
        className={`${GLASS_CLEAR} p-6 md:p-7 flex flex-col gap-5`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-700">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400/30" />
                Fundamentos teóricos · Del área al volumen
              </span>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-800">
                Resumen de métodos de integración
              </h2>
            </div>
            <p className="text-sm md:text-[15px] leading-relaxed text-slate-600 max-w-2xl">
              Al girar una región plana alrededor de una recta y cortarla en rebanadas diferenciales{' '}
              <DxBadge>dx</DxBadge>, la integral definida suma sus volúmenes elementales sin error.
            </p>
          </div>
        </div>

        {/* Píldoras de fórmulas clave */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className={`${GLASS_CLEAR_INNER} px-4 py-3 flex items-center justify-between gap-2 hover:border-blue-300 transition-colors`}>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Discos
            </span>
            <KatexBlock display={false} tex={'V = \\pi \\int_a^b [f(x)]^2\\,dx'} className="text-sm text-slate-800" />
          </div>
          <div className={`${GLASS_CLEAR_INNER} px-4 py-3 flex items-center justify-between gap-2 hover:border-amber-300 transition-colors`}>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Arandelas
            </span>
            <KatexBlock display={false} tex={'V = \\pi \\int_a^b (R^2 - r^2)\\,dx'} className="text-sm text-slate-800" />
          </div>
          <div className={`${GLASS_CLEAR_INNER} px-4 py-3 flex items-center justify-between gap-2 hover:border-blue-300 transition-colors`}>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Capas
            </span>
            <KatexBlock display={false} tex={'V = 2\\pi \\int_a^b \\rho\\,h\\,dx'} className="text-sm text-slate-800" />
          </div>
        </div>
      </motion.section>

      <TheoryCard
        icon={Sigma}
        badge="Idea clave"
        title="De la suma de Riemann a la integral"
        formula={'V=\\lim_{n\\to\\infty}\\sum_{i=1}^{n} A(x_i)\\,\\Delta x=\\int_{a}^{b} A(x)\\,dx'}
        note="A(x) es el área de la sección transversal perpendicular al eje de giro en la posición x."
      >
        <p>
          Cada rebanada tiene un espesor <DxBadge>Δx</DxBadge> y un área{' '}
          <DxBadge>A(x)</DxBadge>; su volumen aproximado es{' '}
          <KatexBlock display={false} tex={'A(x_i)\\,\\Delta x'} className="text-blue-700" />. Al hacer{' '}
          <b className="text-slate-800">n → ∞</b> el error desaparece y la suma converge a una integral.
        </p>
        <p>
          En el simulador puedes comprobarlo: activa la <b className="text-blue-700">aproximación de Riemann</b> y
          observa cómo el error relativo tiende a 0 al aumentar N.
        </p>
      </TheoryCard>

      <TheoryCard
        icon={Disc3}
        badge="Método 1"
        title="Método de los discos"
        diagram={<DiskDiagram />}
        formula={'V=\\pi\\int_{a}^{b}\\bigl[f(x)\\bigr]^{2}\\,dx'}
        note="Ejemplo: f(x)=√x en [0, 4] girando sobre el eje x  →  V = π∫₀⁴ x dx = 8π."
      >
        <p>
          Cuando la región llega hasta el eje de giro, cada sección es un <b className="text-slate-800">disco</b> de
          radio <KatexBlock display={false} tex={'r=f(x)'} className="text-blue-700" /> y espesor{' '}
          <DxBadge>dx</DxBadge>.
        </p>
        <p>
          Su volumen diferencial es <KatexBlock display={false} tex={'dV=\\pi\\,[f(x)]^{2}\\,dx'} className="text-blue-700" />.
          Integrar de <b className="text-slate-800">a</b> a <b className="text-slate-800">b</b> reúne todos los discos.
        </p>
      </TheoryCard>

      <TheoryCard
        icon={Circle}
        badge="Método 2"
        title="Método de las arandelas"
        diagram={<WasherDiagram />}
        formula={'V=\\pi\\int_{a}^{b}\\Bigl(\\bigl[R(x)\\bigr]^{2}-\\bigl[r(x)\\bigr]^{2}\\Bigr)\\,dx'}
        note="R(x): radio exterior (curva más lejana al eje) · r(x): radio interior (curva más cercana)."
      >
        <p>
          Si entre la región y el eje queda un hueco, cada sección es una <b className="text-slate-800">arandela</b>: un
          disco exterior de radio <b className="text-blue-700">R(x)</b> al que se le resta el disco interior de radio{' '}
          <b className="text-indigo-600">r(x)</b> y espesor <DxBadge>dx</DxBadge>.
        </p>
        <p>
          Es el caso de la región entre dos curvas <KatexBlock display={false} tex={'f(x)\\ge g(x)'} className="text-blue-700" />{' '}
          o de un eje de giro desplazado. Activa «Región entre dos curvas» en el simulador para explorarlo.
        </p>
      </TheoryCard>

      <TheoryCard
        icon={Layers}
        badge="Bonus"
        title="Capas cilíndricas"
        diagram={<ShellDiagram />}
        formula={'V=2\\pi\\int_{a}^{b}\\rho(x)\\,h(x)\\,dx'}
        note="ρ(x): distancia de la capa al eje vertical · h(x): altura de la capa."
      >
        <p>
          Al girar sobre un eje <b className="text-slate-800">vertical</b>, conviene cortar en rectángulos paralelos al
          eje: cada uno genera un cilindro hueco de radio <KatexBlock display={false} tex={'\\rho'} className="text-blue-700" />,
          altura <b className="text-slate-800">h</b> y grosor <DxBadge>dx</DxBadge>.
        </p>
        <p>
          Su volumen es el de una lámina desenrollada:{' '}
          <KatexBlock display={false} tex={'2\\pi\\rho\\,h\\,dx'} className="text-blue-700" />.
        </p>
      </TheoryCard>

      <motion.div variants={item} className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => onNavigate('simulator')}
          className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold shadow-md shadow-amber-500/20 transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer"
        >
          <Target className="w-5 h-5" />
          Probarlo en el simulador
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </motion.div>
  );
}
