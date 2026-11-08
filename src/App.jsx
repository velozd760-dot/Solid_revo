import React, { memo, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Book, Box, Trophy } from 'lucide-react';
import MathBackground from './components/MathBackground';
import SimulatorView from './views/SimulatorView';
import TheoryView from './views/TheoryView';
import ChallengesView from './views/ChallengesView';
import { useSimulator } from './hooks/useSimulator';

const NAV_TABS = [
  { id: 'theory', label: 'Teoría', icon: Book },
  { id: 'simulator', label: 'Simulador', icon: Box },
  { id: 'challenges', label: 'Desafíos', icon: Trophy },
];

const HERO_COMETS = [
  { id: 'hc1', top: '-6%', left: '22%', width: '190px', dur: '5.2s', delay: '0s', opacity: 0.32 },
  { id: 'hc2', top: '8%', left: '54%', width: '240px', dur: '6.8s', delay: '1.4s', opacity: 0.28 },
  { id: 'hc3', top: '-10%', left: '78%', width: '210px', dur: '4.7s', delay: '2.9s', opacity: 0.34 },
  { id: 'hc4', top: '28%', left: '92%', width: '175px', dur: '7.4s', delay: '0.8s', opacity: 0.24 },
  { id: 'hc5', top: '16%', left: '38%', width: '220px', dur: '5.9s', delay: '3.8s', opacity: 0.29 },
  { id: 'hc6', top: '42%', left: '84%', width: '185px', dur: '6.3s', delay: '2.1s', opacity: 0.26 },
];

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: 'easeIn' } },
};

/**
 * Ilustración estática y limpia del Sólido de Revolución (cilindro / arandela)
 * con levitación global sutil acelerada por GPU en su contenedor principal.
 */
const SolidHeroEmblem = memo(function SolidHeroEmblem() {
  return (
    <div className="relative flex items-center justify-center shrink-0">
      {/* Resplandor ambiental detrás de la ilustración */}
      <div
        aria-hidden="true"
        className="absolute w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full bg-amber-300/20 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-sky-300/20 blur-2xl pointer-events-none"
      />

      <div className="hero-float relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-[340px] lg:h-[340px] rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.38),inset_0_1px_0_0_rgba(255,255,255,0.45)] flex items-center justify-center p-5 transition-all duration-300 hover:border-amber-300/85 hover:shadow-[0_0_40px_rgba(251,191,36,0.38)] transform-gpu">
        <svg viewBox="0 0 240 240" className="w-full h-full overflow-visible" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="heroBlueBodyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
              <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.48" />
            </linearGradient>
            <linearGradient id="heroBlueCapGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.72" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.38" />
            </linearGradient>
            <linearGradient id="amberSliceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.90" />
            </linearGradient>
          </defs>

          {/* Anillos técnicos exteriores estáticos */}
          <circle
            cx="120"
            cy="120"
            r="106"
            stroke="#e0f2fe"
            strokeWidth="1.2"
            strokeDasharray="6 8"
            strokeOpacity="0.45"
          />
          <circle
            cx="120"
            cy="120"
            r="96"
            stroke="#fde047"
            strokeWidth="1.1"
            strokeDasharray="3 10"
            strokeOpacity="0.38"
          />

          {/* Eje de revolución vertical */}
          <line
            x1="120"
            y1="16"
            x2="120"
            y2="224"
            stroke="#ffffff"
            strokeWidth="2"
            strokeDasharray="5 5"
            strokeOpacity="0.8"
          />

          {/* Flecha curva superior de revolución alrededor del eje en ámbar */}
          <path
            d="M 95 30 A 28 10 0 1 1 145 30"
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 141 24 L 148 31 L 138 34"
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Base inferior del cilindro/arandela */}
          <ellipse
            cx="120"
            cy="174"
            rx="76"
            ry="25"
            fill="url(#heroBlueBodyGrad)"
            stroke="#e0f2fe"
            strokeWidth="2"
            strokeOpacity="0.85"
          />
          <ellipse
            cx="120"
            cy="174"
            rx="32"
            ry="10.5"
            fill="#1e40af"
            stroke="#bfdbfe"
            strokeWidth="1.6"
            strokeDasharray="4 3"
            strokeOpacity="0.8"
          />

          {/* Cuerpo lateral del sólido */}
          <path
            d="M 44 76 V 174 A 76 25 0 0 0 196 174 V 76 Z"
            fill="url(#heroBlueBodyGrad)"
            stroke="#e0f2fe"
            strokeWidth="2"
          />

          {/* Paredes del hueco interior (arandela r(x)) */}
          <line
            x1="88"
            y1="76"
            x2="88"
            y2="174"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeOpacity="0.72"
          />
          <line
            x1="152"
            y1="76"
            x2="152"
            y2="174"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeOpacity="0.72"
          />

          {/* Elemento diferencial central (dx) en ámbar (#fbbf24) */}
          <g>
            <path
              d="M 44 116 V 134 A 76 25 0 0 0 196 134 V 116 A 76 25 0 0 1 44 116 Z"
              fill="url(#amberSliceGrad)"
              stroke="#fef08a"
              strokeWidth="2.3"
            />
            <ellipse
              cx="120"
              cy="116"
              rx="76"
              ry="25"
              fill="#fbbf24"
              fillOpacity="0.38"
              stroke="#fef08a"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <ellipse
              cx="120"
              cy="116"
              rx="32"
              ry="10.5"
              fill="#1e3a8a"
              fillOpacity="0.65"
              stroke="#fde047"
              strokeWidth="1.6"
            />
          </g>

          {/* Tapa superior de la arandela (R exterior y r interior) */}
          <ellipse
            cx="120"
            cy="76"
            rx="76"
            ry="25"
            fill="url(#heroBlueCapGrad)"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <ellipse
            cx="120"
            cy="76"
            rx="32"
            ry="10.5"
            fill="#1d4ed8"
            stroke="#ffffff"
            strokeWidth="2.2"
          />

          {/* Cota del radio interior r(x) hacia la izquierda */}
          <line x1="88" y1="76" x2="120" y2="76" stroke="#bae6fd" strokeWidth="2" strokeDasharray="2 2" />
          <circle cx="88" cy="76" r="3" fill="#bae6fd" />

          {/* Flecha estática del radio de giro R(x) hacia la derecha */}
          <line
            x1="120"
            y1="76"
            x2="194"
            y2="76"
            stroke="#fde047"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M 187 71 L 196 76 L 187 81"
            stroke="#fde047"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="120" cy="76" r="4" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="196" cy="76" r="3.5" fill="#ffffff" stroke="#fbbf24" strokeWidth="2" />

          {/* Etiquetas matemáticas estáticas (R(x), r(x), dx) */}
          <g>
            <rect
              x="144"
              y="48"
              width="38"
              height="18"
              rx="5"
              fill="#0f172a"
              fillOpacity="0.45"
              stroke="#fde047"
              strokeWidth="1.2"
            />
            <text x="163" y="61" textAnchor="middle" fill="#fef08a" fontSize="11.5" fontWeight="800" fontFamily="monospace">
              R(x)
            </text>
          </g>

          <g>
            <rect
              x="76"
              y="50"
              width="34"
              height="17"
              rx="5"
              fill="#0f172a"
              fillOpacity="0.4"
              stroke="#bae6fd"
              strokeWidth="1.1"
            />
            <text x="93" y="62" textAnchor="middle" fill="#e0f2fe" fontSize="11" fontWeight="700" fontFamily="monospace">
              r(x)
            </text>
          </g>

          <g>
            <rect
              x="198"
              y="114"
              width="30"
              height="20"
              rx="6"
              fill="#fbbf24"
              stroke="#fef08a"
              strokeWidth="1.4"
            />
            <text x="213" y="128" textAnchor="middle" fill="#0f172a" fontSize="12.5" fontWeight="900" fontFamily="monospace">
              dx
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
});

export default function App() {
  // Navegación: 'theory' (por defecto) | 'simulator' | 'challenges'
  const [activeTab, setActiveTab] = useState('theory');

  // Estado persistente del simulador entre pestañas (suspende cálculos/animación en Teoría y Desafíos)
  const sim = useSimulator(activeTab === 'simulator');
  const { setIsPlaying } = sim;

  const handleNavigate = useCallback(
    (tab) => {
      if (tab !== 'simulator') {
        setIsPlaying(false);
      }
      setActiveTab(tab);
    },
    [setIsPlaying]
  );

  return (
    <div translate="no" className="notranslate min-h-screen w-full flex flex-col overflow-x-hidden text-slate-800 font-sans relative">
      {/* Fondo claro interactivo en la zona de contenido */}
      <MathBackground />

      {/* =====================================================================
          1. HERO BANNER SUPERIOR (AZUL VIBRANTE + COMETAS CÓSMICOS + HOLOGRAMA)
         ===================================================================== */}
      <header className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 py-12 md:py-16 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center border-b border-blue-500/40 shadow-xl shadow-blue-900/15 overflow-hidden">
        {/* Sistema de cometas cósmicos de fondo y halos de luz suaves */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-28 left-1/4 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-28 right-1/4 w-96 h-96 rounded-full bg-amber-300/10 blur-3xl" />

          {HERO_COMETS.map((c) => (
            <span
              key={c.id}
              className="cosmic-comet-hero transform-gpu"
              style={{
                top: c.top,
                left: c.left,
                width: c.width,
                '--comet-dur': c.dur,
                '--comet-delay': c.delay,
                '--comet-max-opacity': c.opacity,
              }}
            />
          ))}
        </div>

        {/* Contenido centrado en el eje horizontal */}
        <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center justify-center text-center gap-8 md:gap-12">
          {/* Holograma vivo del sólido de revolución con rebanada dx en ámbar (#fbbf24) */}
          <SolidHeroEmblem />

          {/* Bloque central: Título de gran impacto y Pill Navigation */}
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="font-display">
              <span className="block text-2xl md:text-3xl lg:text-4xl font-extrabold uppercase text-amber-400 tracking-wider mb-2">
                SIMULADOR DE
              </span>
              <span className="block text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black uppercase text-white tracking-tight leading-none drop-shadow-lg">
                SÓLIDOS DE REVOLUCIÓN
              </span>
            </h1>

            {/* Barra de Navegación Integrada (Pill Navigation) con indicador activo en ámbar */}
            <nav
              aria-label="Navegación principal"
              role="tablist"
              className="mt-8 bg-blue-950/35 backdrop-blur-md border border-white/25 p-1.5 rounded-full inline-flex flex-wrap justify-center gap-2 shadow-xl shadow-blue-950/20"
            >
              {NAV_TABS.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleNavigate(id)}
                    className={
                      isActive
                        ? 'bg-amber-400 text-slate-900 font-bold shadow-md shadow-amber-500/30 rounded-full px-6 py-2.5 flex items-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.97] transform-gpu'
                        : 'text-white/90 hover:text-white hover:bg-white/15 px-6 py-2.5 rounded-full transition-all duration-150 active:scale-[0.97] transform-gpu flex items-center gap-2 cursor-pointer font-medium'
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. ZONA INFERIOR DE CONTENIDO (FONDO CLARO CON TARJETAS BLANCAS)
         ===================================================================== */}
      <section className="flex-1 w-full bg-blue-50/25 pb-20">
        <div className="relative z-10 -mt-7 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {activeTab === 'theory' && <TheoryView onNavigate={handleNavigate} />}
              {activeTab === 'simulator' && <SimulatorView sim={sim} />}
              {activeTab === 'challenges' && <ChallengesView onNavigate={handleNavigate} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
