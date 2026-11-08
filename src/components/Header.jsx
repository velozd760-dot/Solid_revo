import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, FlaskConical, Trophy, Sigma } from 'lucide-react';
import { GLASS } from './GlassCard';

const TABS = [
  { id: 'theory', label: 'Teoría', icon: BookOpen },
  { id: 'simulator', label: 'Simulador', icon: FlaskConical },
  { id: 'challenges', label: 'Desafíos', icon: Trophy },
];

/** Barra de navegación superior: minimalista, flotante y de cristal. */
export default function Header({ activeTab, onChange }) {
  return (
    <header className="fixed top-3 inset-x-3 z-50 pointer-events-none" translate="no">
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className={`${GLASS} pointer-events-auto mx-auto max-w-[1700px] h-14 px-4 grid grid-cols-[1fr_auto_1fr] items-center notranslate`}
        aria-label="Navegación principal"
      >
        {/* Logo / título */}
        <button
          type="button"
          onClick={() => onChange('simulator')}
          className="flex items-center gap-2.5 justify-self-start cursor-pointer group"
          title="Ir al simulador"
        >
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
            <Sigma className="w-5 h-5" />
          </span>
          <span className="leading-tight text-left">
            <span className="block text-sm font-bold text-slate-800 tracking-tight">Sólidos de Revolución</span>
            <span className="hidden sm:block text-[10px] font-medium text-slate-500">
              Cálculo integral <span className="text-yellow-500">·</span> WebGL
            </span>
          </span>
        </button>

        {/* Pestañas centrales */}
        <div role="tablist" className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/[0.04] border border-white/60">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = id === activeTab;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => onChange(id)}
                className={`relative px-3.5 sm:px-5 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-white shadow-md shadow-blue-900/10 ring-1 ring-blue-100"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : ''}`} />
                  <span className="hidden sm:inline">{label}</span>
                </span>
                {active && (
                  <motion.span
                    layoutId="nav-dot"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-yellow-400 z-10"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Lateral derecho: sello discreto */}
        <div className="justify-self-end hidden md:flex items-center gap-2 text-[11px] font-medium text-slate-500">
          <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.9)]" />
          Plataforma educativa
        </div>
      </motion.nav>
    </header>
  );
}
