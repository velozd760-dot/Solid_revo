import React, { memo, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Box,
  Home,
  Trophy,
} from 'lucide-react';
import MathBackground from './components/MathBackground';
import ConstellationBackground from './components/ConstellationBackground';
import SimulatorView from './views/SimulatorView';
import TheoryView from './views/TheoryView';
import ChallengesView from './views/ChallengesView';

const NAV_TABS = [
  {
    id: 'theory',
    step: 'PASO 01 · RECOMENDADO',
    label: 'Teoría',
    subtitle: 'Fundamentos, fórmulas y criterios de selección',
    icon: BookOpen,
    primary: true,
  },
  {
    id: 'simulator',
    step: 'PASO 02 · LABORATORIO',
    label: 'Simulador',
    subtitle: 'Cockpit 2D/3D interactivo y cálculo paso a paso',
    icon: Box,
    primary: false,
  },
  {
    id: 'challenges',
    step: 'PASO 03 · EVALUACIÓN',
    label: 'Desafíos',
    subtitle: 'Duelo de cartas y asociación geométrica',
    icon: Trophy,
    primary: false,
  },
];

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: 'easeIn' } },
};

/**
 * Isotipo / ilustración estática 2D isométrica del Sólido de Revolución
 * (sin recuadro independiente, integrada junto al título principal).
 */
const SolidHeroEmblem = memo(function SolidHeroEmblem() {
  return (
    <div className="relative flex items-center justify-center shrink-0 w-[165px] sm:w-[195px] lg:w-[245px] xl:w-[265px] pointer-events-none select-none">
      {/* Resplandor sutil detrás del isotipo sin tarjeta ni movimiento */}
      <div
        aria-hidden="true"
        className="absolute inset-2 rounded-full bg-sky-300/18 blur-2xl pointer-events-none"
      />

      <svg
        viewBox="34 10 204 220"
        className="relative w-full h-auto overflow-visible drop-shadow-[0_10px_22px_rgba(15,23,42,0.35)]"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="heroBlueBodyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.44" />
            <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.50" />
          </linearGradient>
          <linearGradient id="heroBlueCapGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.74" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.40" />
          </linearGradient>
          <linearGradient id="amberSliceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.92" />
          </linearGradient>
        </defs>

        {/* Eje de revolución vertical */}
        <line
          x1="120"
          y1="16"
          x2="120"
          y2="222"
          stroke="#ffffff"
          strokeWidth="2.1"
          strokeDasharray="5 5"
          strokeOpacity="0.85"
        />

        {/* Flecha curva superior de revolución alrededor del eje en ámbar */}
        <path
          d="M 95 30 A 28 10 0 1 1 145 30"
          stroke="#fbbf24"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M 141 24 L 148 31 L 138 34"
          stroke="#fbbf24"
          strokeWidth="2.6"
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
          strokeWidth="2.1"
          strokeOpacity="0.88"
        />
        <ellipse
          cx="120"
          cy="174"
          rx="32"
          ry="10.5"
          fill="#1e40af"
          stroke="#bfdbfe"
          strokeWidth="1.7"
          strokeDasharray="4 3"
          strokeOpacity="0.82"
        />

        {/* Cuerpo lateral del sólido */}
        <path
          d="M 44 76 V 174 A 76 25 0 0 0 196 174 V 76 Z"
          fill="url(#heroBlueBodyGrad)"
          stroke="#e0f2fe"
          strokeWidth="2.1"
        />

        {/* Paredes del hueco interior (arandela r(x)) */}
        <line
          x1="88"
          y1="76"
          x2="88"
          y2="174"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeDasharray="4 4"
          strokeOpacity="0.75"
        />
        <line
          x1="152"
          y1="76"
          x2="152"
          y2="174"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeDasharray="4 4"
          strokeOpacity="0.75"
        />

        {/* Elemento diferencial central (dx) en ámbar (#fbbf24) */}
        <g>
          <path
            d="M 44 116 V 134 A 76 25 0 0 0 196 134 V 116 A 76 25 0 0 1 44 116 Z"
            fill="url(#amberSliceGrad)"
            stroke="#fef08a"
            strokeWidth="2.4"
          />
          <ellipse
            cx="120"
            cy="116"
            rx="76"
            ry="25"
            fill="#fbbf24"
            fillOpacity="0.4"
            stroke="#fef08a"
            strokeWidth="2.1"
            strokeDasharray="4 3"
          />
          <ellipse
            cx="120"
            cy="116"
            rx="32"
            ry="10.5"
            fill="#1e3a8a"
            fillOpacity="0.68"
            stroke="#fde047"
            strokeWidth="1.7"
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
          strokeWidth="2.6"
        />
        <ellipse
          cx="120"
          cy="76"
          rx="32"
          ry="10.5"
          fill="#1d4ed8"
          stroke="#ffffff"
          strokeWidth="2.3"
        />

        {/* Cota del radio interior r(x) hacia la izquierda */}
        <line x1="88" y1="76" x2="120" y2="76" stroke="#bae6fd" strokeWidth="2.1" strokeDasharray="2.5 2.5" />
        <circle cx="88" cy="76" r="3.2" fill="#bae6fd" />

        {/* Flecha estática del radio de giro R(x) hacia la derecha */}
        <line
          x1="120"
          y1="76"
          x2="194"
          y2="76"
          stroke="#fde047"
          strokeWidth="2.9"
          strokeLinecap="round"
        />
        <path
          d="M 187 71 L 196 76 L 187 81"
          stroke="#fde047"
          strokeWidth="2.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="120" cy="76" r="4.2" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.6" />
        <circle cx="196" cy="76" r="3.7" fill="#ffffff" stroke="#fbbf24" strokeWidth="2.1" />

        {/* Etiquetas matemáticas estáticas (R(x), r(x), dx) */}
        <g>
          <rect
            x="141"
            y="45"
            width="42"
            height="20"
            rx="5.5"
            fill="#0f172a"
            fillOpacity="0.52"
            stroke="#fde047"
            strokeWidth="1.3"
          />
          <text x="162" y="59" textAnchor="middle" fill="#fef08a" fontSize="12.5" fontWeight="800" fontFamily="monospace">
            R(x)
          </text>
        </g>

        <g>
          <rect
            x="73"
            y="47"
            width="38"
            height="19"
            rx="5.5"
            fill="#0f172a"
            fillOpacity="0.46"
            stroke="#bae6fd"
            strokeWidth="1.2"
          />
          <text x="92" y="60" textAnchor="middle" fill="#e0f2fe" fontSize="12" fontWeight="700" fontFamily="monospace">
            r(x)
          </text>
        </g>

        <g>
          <rect
            x="198"
            y="113"
            width="32"
            height="22"
            rx="6"
            fill="#fbbf24"
            stroke="#fef08a"
            strokeWidth="1.5"
          />
          <text x="214" y="128" textAnchor="middle" fill="#0f172a" fontSize="13.5" fontWeight="900" fontFamily="monospace">
            dx
          </text>
        </g>
      </svg>
    </div>
  );
});

/**
 * 1. LANDING VIEW (Two-Column Hero - Zero-Scroll):
 * - Fondo azul cobalto/zafiro original + canvas interactivo de constelaciones (efecto enredadera al clic).
 * - Bloque izquierdo/central: Título en 2 niveles ("SIMULADOR DE" + "SÓLIDOS DE REVOLUCIÓN") + <SolidHeroEmblem />.
 * - Bloque derecho: Tarjeta vertical "RUTA DE APRENDIZAJE" con las 3 tarjetas de navegación originales.
 */
const LandingView = memo(function LandingView({ onNavigate }) {
  return (
    <div className="h-screen w-full overflow-hidden relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 select-none">
      {/* Fondo interactivo de constelaciones (Canvas 2D con brote de nodos al hacer clic) */}
      <ConstellationBackground />

      {/* Contenedor principal Two-Column Hero a pantalla completa */}
      <div className="h-screen w-full overflow-hidden relative flex flex-col lg:flex-row items-center justify-center lg:justify-between max-w-7xl mx-auto px-8 lg:px-14 z-10 gap-8">
        {/* BLOQUE IZQUIERDO/CENTRAL: TÍTULO ARRIBA (UN POCO AL CENTRO) + SÓLIDO AMPLIADO DEBAJO */}
        <div className="lg:flex-1 flex flex-col items-center justify-center lg:pr-10 lg:-mt-6">
          <div className="flex flex-col items-center gap-5 sm:gap-6">
            <h1 className="font-display text-center lg:text-left">
              <span className="block text-amber-400 font-extrabold tracking-wider text-3xl md:text-4xl lg:text-[2.45rem] uppercase mb-2.5">
                SIMULADOR DE
              </span>
              <span className="block text-white font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-[4.15rem] leading-[1.04] tracking-tight uppercase">
                SÓLIDOS DE
                <br />
                REVOLUCIÓN
              </span>
            </h1>

            {/* Isotipo estático ampliado del sólido de revolución debajo del título */}
            <SolidHeroEmblem />
          </div>
        </div>

        {/* BLOQUE DERECHO: TARJETA "RUTA DE APRENDIZAJE" ORIGINAL */}
        <aside
          aria-label="Ruta de Aprendizaje"
          className="w-full max-w-[340px] bg-slate-900/35 backdrop-blur-xl border border-white/15 rounded-3xl p-5 shadow-2xl shrink-0"
        >
          {/* Cabecera interna de la tarjeta */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest text-blue-100/80 uppercase">
              RUTA DE APRENDIZAJE
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>

          {/* 3 tarjetas de navegación apiladas verticalmente */}
          <div className="flex flex-col gap-3.5 mt-4">
            {NAV_TABS.map(({ id, step, label, subtitle, icon: Icon, primary }) => (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={
                  primary
                    ? 'group w-full text-left bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl p-4 transition-all cursor-pointer shadow-lg flex items-center justify-between gap-3'
                    : 'group w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl p-4 transition-all cursor-pointer flex items-center justify-between gap-3'
                }
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={
                      primary
                        ? 'p-2.5 rounded-xl bg-slate-950/10 text-slate-950 shrink-0 mt-0.5'
                        : 'p-2.5 rounded-xl bg-white/5 border border-white/10 text-amber-400 shrink-0 mt-0.5'
                    }
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={
                        primary
                          ? 'block text-[10px] font-bold uppercase tracking-wider opacity-80'
                          : 'block text-[10px] font-bold uppercase tracking-wider text-amber-400'
                      }
                    >
                      {step}
                    </span>
                    <span className="block text-lg font-extrabold leading-snug">
                      {label}
                    </span>
                    <span
                      className={
                        primary
                          ? 'block text-xs opacity-85 leading-snug mt-0.5'
                          : 'block text-xs text-blue-100/75 leading-snug mt-0.5'
                      }
                    >
                      {subtitle}
                    </span>
                  </div>
                </div>

                <ArrowRight
                  className={
                    primary
                      ? 'w-4 h-4 shrink-0 text-slate-950 transition-transform group-hover:translate-x-1'
                      : 'w-4 h-4 shrink-0 text-amber-400 transition-transform group-hover:translate-x-1'
                  }
                />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
});

export default function App() {
  // Navegación: 'landing' (Hero Zero-Scroll con Teoría destacado) | 'theory' | 'simulator' | 'challenges'
  const [activeTab, setActiveTab] = useState('landing');
  // Contador de sesión del Simulador: garantiza remontaje limpio desde DEFAULT_SIMULATOR_STATE al volver a entrar
  const [simulatorSession, setSimulatorSession] = useState(0);

  const handleNavigate = useCallback(
    (tab) => {
      if (tab === activeTab) return;
      if (tab === 'simulator') {
        setSimulatorSession((n) => n + 1);
      }
      setActiveTab(tab);
    },
    [activeTab]
  );

  // Cuando el usuario está en el Inicio (LandingView), se muestra únicamente el Hero Zero-Scroll
  if (activeTab === 'landing') {
    return (
      <div translate="no" className="notranslate w-full h-screen overflow-hidden font-sans">
        <LandingView onNavigate={handleNavigate} />
      </div>
    );
  }

  const isViewportLocked = activeTab === 'simulator' || activeTab === 'challenges';

  return (
    <div
      translate="no"
      className={`notranslate w-full flex flex-col text-slate-800 font-sans relative ${
        isViewportLocked ? 'h-screen overflow-hidden' : 'min-h-screen overflow-x-hidden'
      }`}
    >
      {/* Fondo claro interactivo en la zona de contenido */}
      <MathBackground />

      {/* =====================================================================
          HEADER FIJO Y COMPACTO (80px = h-20) PARA TEORÍA, SIMULADOR Y DESAFÍOS
         ===================================================================== */}
      <header className="sticky top-0 z-30 h-[80px] w-full shrink-0 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 border-b border-blue-500/40 shadow-md">
        {/* Identidad de marca y retorno al Hero de Inicio */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => handleNavigate('landing')}
            title="Volver a la portada de Inicio"
            className="flex items-center gap-3.5 text-left group cursor-pointer focus:outline-none shrink-0"
          >
            <img
              src="/icon.svg"
              alt="Logo Solid Revo"
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain filter drop-shadow-md transition-transform duration-200 group-hover:scale-105 shrink-0"
            />
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-amber-400 leading-none mb-1">
                SIMULADOR DE
              </span>
              <span className="block text-sm sm:text-base md:text-lg font-black uppercase text-white tracking-tight leading-none truncate">
                SÓLIDOS DE REVOLUCIÓN
              </span>
            </div>
          </button>
        </div>

        {/* Barra de Navegación Compacta */}
        <nav
          aria-label="Navegación principal"
          role="tablist"
          className="bg-blue-950/35 backdrop-blur-md border border-white/25 p-1 rounded-full inline-flex items-center gap-1.5 shadow-inner shrink-0"
        >
          <button
            type="button"
            onClick={() => handleNavigate('landing')}
            className="text-white/90 hover:text-white hover:bg-white/15 px-3.5 py-2 rounded-full transition-all duration-150 active:scale-[0.97] transform-gpu flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm font-medium"
            title="Ir al Inicio"
          >
            <Home className="w-4 h-4 text-amber-300" />
            <span className="hidden md:inline">Inicio</span>
          </button>

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
                    ? 'bg-amber-400 text-slate-900 font-bold shadow-md shadow-amber-500/30 rounded-full px-4 sm:px-5 py-2 flex items-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.97] transform-gpu text-xs sm:text-sm'
                    : 'text-white/90 hover:text-white hover:bg-white/15 px-4 sm:px-5 py-2 rounded-full transition-all duration-150 active:scale-[0.97] transform-gpu flex items-center gap-2 cursor-pointer font-medium text-xs sm:text-sm'
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* =====================================================================
          ZONA DE CONTENIDO PRINCIPAL (100vh Zero-Scroll en Simulador y Desafíos)
         ===================================================================== */}
      <section
        className={`flex-1 w-full bg-blue-50/25 relative z-10 ${
          isViewportLocked ? 'h-[calc(100vh-80px)] overflow-hidden' : 'py-6 pb-16'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab === 'simulator' ? `simulator-${simulatorSession}` : activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={
              isViewportLocked
                ? 'h-full w-full overflow-hidden'
                : 'max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8'
            }
          >
            {activeTab === 'theory' && <TheoryView onNavigate={handleNavigate} />}
            {activeTab === 'simulator' && (
              <SimulatorView
                key={simulatorSession}
                isActive={activeTab === 'simulator'}
              />
            )}
            {activeTab === 'challenges' && <ChallengesView onNavigate={handleNavigate} />}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}
