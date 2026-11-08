import React, { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'sonner';
import {
  CheckCircle2,
  Compass,
  Flame,
  Layers,
  RotateCcw,
  Sparkles,
  Swords,
  Trophy,
} from 'lucide-react';
import KatexBlock from './KatexBlock';
import { GLASS_CLEAR, GLASS_CLEAR_INNER } from './GlassCard';

/* ==========================================================================
   ILUSTRACIONES SVG GENERADAS POR CÓDIGO ("Gráfica 2D" y "Sólido 3D")
   ========================================================================== */

function Graph2DSvg({ variant }) {
  if (variant === 'semicircle') {
    return (
      <svg viewBox="0 0 180 96" className="w-full h-20" fill="none" aria-hidden="true">
        <line x1="14" y1="78" x2="166" y2="78" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="90" y1="10" x2="90" y2="88" stroke="#94a3b8" strokeWidth="1.5" />
        <path
          d="M 34 78 A 56 56 0 0 1 146 78 Z"
          fill="rgba(37, 99, 235, 0.20)"
          stroke="#2563eb"
          strokeWidth="2.4"
        />
        <rect x="104" y="31" width="9" height="47" fill="rgba(251, 191, 36, 0.78)" stroke="#d97706" strokeWidth="1.2" />
        <line x1="14" y1="78" x2="166" y2="78" stroke="#e11d48" strokeWidth="1.6" strokeDasharray="4 3" />
        <text x="130" y="26" fill="#1d4ed8" fontSize="10" fontWeight="700" fontFamily="monospace">
          √(4−x²)
        </text>
        <text x="28" y="89" fill="#64748b" fontSize="9" fontFamily="monospace">
          -2
        </text>
        <text x="143" y="89" fill="#64748b" fontSize="9" fontFamily="monospace">
          2
        </text>
      </svg>
    );
  }

  if (variant === 'cone-line') {
    return (
      <svg viewBox="0 0 180 96" className="w-full h-20" fill="none" aria-hidden="true">
        <line x1="20" y1="78" x2="164" y2="78" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="28" y1="12" x2="28" y2="88" stroke="#94a3b8" strokeWidth="1.5" />
        <path
          d="M 28 78 L 150 22 L 150 78 Z"
          fill="rgba(37, 99, 235, 0.20)"
          stroke="#2563eb"
          strokeWidth="2.4"
        />
        <rect x="102" y="44" width="9" height="34" fill="rgba(251, 191, 36, 0.78)" stroke="#d97706" strokeWidth="1.2" />
        <line x1="20" y1="78" x2="164" y2="78" stroke="#e11d48" strokeWidth="1.6" strokeDasharray="4 3" />
        <text x="72" y="34" fill="#1d4ed8" fontSize="10" fontWeight="700" fontFamily="monospace">
          f(x) = 0.5x
        </text>
        <text x="145" y="89" fill="#64748b" fontSize="9" fontFamily="monospace">
          4
        </text>
      </svg>
    );
  }

  // two-curves: f(x)=sqrt(x) y g(x)=x^2 en [0, 1]
  return (
    <svg viewBox="0 0 180 96" className="w-full h-20" fill="none" aria-hidden="true">
      <line x1="22" y1="80" x2="162" y2="80" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="30" y1="12" x2="30" y2="88" stroke="#94a3b8" strokeWidth="1.5" />
      <path
        d="M 30 80 Q 64 26 144 20 Q 104 72 30 80 Z"
        fill="rgba(37, 99, 235, 0.22)"
      />
      <path d="M 30 80 Q 64 26 144 20" stroke="#2563eb" strokeWidth="2.4" />
      <path d="M 30 80 Q 104 72 144 20" stroke="#6366f1" strokeWidth="2.2" />
      <rect x="82" y="39" width="9" height="24" fill="rgba(251, 191, 36, 0.82)" stroke="#d97706" strokeWidth="1.2" />
      <text x="54" y="25" fill="#1d4ed8" fontSize="9.5" fontWeight="700" fontFamily="monospace">
        √x
      </text>
      <text x="108" y="68" fill="#4f46e5" fontSize="9.5" fontWeight="700" fontFamily="monospace">
        x²
      </text>
    </svg>
  );
}

function Solid3DSvg({ variant }) {
  if (variant === 'sphere') {
    return (
      <svg viewBox="0 0 180 96" className="w-full h-20" fill="none" aria-hidden="true">
        <line x1="12" y1="48" x2="168" y2="48" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="90" cy="48" r="36" fill="rgba(59, 130, 246, 0.22)" stroke="#2563eb" strokeWidth="2.2" />
        <ellipse cx="90" cy="48" rx="14" ry="36" fill="rgba(251, 191, 36, 0.45)" stroke="#f59e0b" strokeWidth="2" />
        <ellipse cx="90" cy="48" rx="36" ry="12" stroke="#60a5fa" strokeWidth="1.4" strokeDasharray="3 3" />
        <text x="132" y="24" fill="#b45309" fontSize="9.5" fontWeight="700" fontFamily="monospace">
          Esfera 3D
        </text>
      </svg>
    );
  }

  if (variant === 'paraboloid') {
    return (
      <svg viewBox="0 0 180 96" className="w-full h-20" fill="none" aria-hidden="true">
        <line x1="12" y1="48" x2="168" y2="48" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="4 3" />
        <path
          d="M 32 48 Q 75 14 142 14 L 142 82 Q 75 82 32 48 Z"
          fill="rgba(59, 130, 246, 0.22)"
          stroke="#2563eb"
          strokeWidth="2.2"
        />
        <ellipse cx="142" cy="48" rx="11" ry="34" fill="rgba(147, 197, 253, 0.45)" stroke="#1d4ed8" strokeWidth="2" />
        <ellipse cx="98" cy="48" rx="8" ry="26" fill="rgba(251, 191, 36, 0.55)" stroke="#f59e0b" strokeWidth="2" />
        <text x="30" y="22" fill="#1d4ed8" fontSize="9.5" fontWeight="700" fontFamily="monospace">
          Paraboloide
        </text>
      </svg>
    );
  }

  // torus (dona 3D)
  return (
    <svg viewBox="0 0 180 96" className="w-full h-20" fill="none" aria-hidden="true">
      <line x1="12" y1="48" x2="168" y2="48" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="4 3" />
      <ellipse cx="90" cy="48" rx="48" ry="32" fill="rgba(59, 130, 246, 0.22)" stroke="#2563eb" strokeWidth="2.2" />
      <ellipse cx="90" cy="48" rx="20" ry="12" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
      <ellipse cx="90" cy="48" rx="34" ry="22" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" />
      <text x="134" y="22" fill="#1d4ed8" fontSize="9.5" fontWeight="700" fontFamily="monospace">
        Toro 3D
      </text>
    </svg>
  );
}

/* ==========================================================================
   MOCK DATA DE 14 CARTAS (7 PAREJAS MATEMÁTICAS = 14 CARTAS EN MESA)
   Categorías: "Gráfica 2D" | "Fórmula Integral" | "Eje de Rotación" | "Sólido 3D"
   ========================================================================== */

const CHALLENGE_GROUPS = [
  {
    groupId: 'esfera',
    title: '1. Esfera de radio 2',
    subtitle: 'Semicírculo en [−2, 2] alrededor de y = 0',
  },
  {
    groupId: 'cono',
    title: '2. Cono recto',
    subtitle: 'Recta f(x) = 0.5x en [0, 4] sobre eje x',
  },
  {
    groupId: 'paraboloide',
    title: '3. Trompeta parabólica',
    subtitle: 'Curva f(x) = √x en [0, 4] sobre eje x',
  },
  {
    groupId: 'arandela',
    title: '4. Arandela entre √x y x²',
    subtitle: 'Dos curvas en [0, 1] alrededor de y = 0',
  },
  {
    groupId: 'capas',
    title: '5. Capas cilíndricas (eje y)',
    subtitle: 'f(x) = x² en [0, 2] alrededor de x = 0',
  },
  {
    groupId: 'toro',
    title: '6. Toro de revolución',
    subtitle: 'Círculo desplazado 2 ± √(1−x²) en [−1, 1]',
  },
  {
    groupId: 'desplazado',
    title: '7. Eje desplazado y = −1',
    subtitle: 'Región entre f(x) = x y g(x) = x² en [0, 1]',
  },
];

const INITIAL_CARDS = [
  // Par 1: Esfera (Gráfica 2D + Sólido 3D)
  {
    id: 'card-esfera-2d',
    groupId: 'esfera',
    category: 'Gráfica 2D',
    svgType: '2d',
    variant: 'semicircle',
    caption: 'f(x) = √(4 − x²) en [−2, 2]',
  },
  {
    id: 'card-esfera-3d',
    groupId: 'esfera',
    category: 'Sólido 3D',
    svgType: '3d',
    variant: 'sphere',
    caption: 'Esfera maciza · V = (32/3)π u³',
  },

  // Par 2: Cono (Gráfica 2D + Fórmula Integral)
  {
    id: 'card-cono-2d',
    groupId: 'cono',
    category: 'Gráfica 2D',
    svgType: '2d',
    variant: 'cone-line',
    caption: 'Triángulo generatriz f(x) = 0.5x',
  },
  {
    id: 'card-cono-int',
    groupId: 'cono',
    category: 'Fórmula Integral',
    tex: 'V = \\pi \\int_{0}^{4} (0.5x)^{2}\\,dx = \\frac{16}{3}\\pi',
    caption: 'Método de discos en [0, 4]',
  },

  // Par 3: Paraboloide (Sólido 3D + Fórmula Integral)
  {
    id: 'card-parab-3d',
    groupId: 'paraboloide',
    category: 'Sólido 3D',
    svgType: '3d',
    variant: 'paraboloid',
    caption: 'Campana parabólica · V = 8π u³',
  },
  {
    id: 'card-parab-int',
    groupId: 'paraboloide',
    category: 'Fórmula Integral',
    tex: 'V = \\pi \\int_{0}^{4} \\left(\\sqrt{x}\\right)^{2} dx = 8\\pi',
    caption: 'Integrando lineal R(x)² = x',
  },

  // Par 4: Arandelas entre dos curvas (Gráfica 2D + Fórmula Integral)
  {
    id: 'card-aran-2d',
    groupId: 'arandela',
    category: 'Gráfica 2D',
    svgType: '2d',
    variant: 'two-curves',
    caption: 'Región acotada por √x y x² en [0, 1]',
  },
  {
    id: 'card-aran-int',
    groupId: 'arandela',
    category: 'Fórmula Integral',
    tex: 'V = \\pi \\int_{0}^{1} \\left[(\\sqrt{x})^{2} - (x^{2})^{2}\\right] dx',
    caption: 'Resta de radios R² − r² = 3π/10',
  },

  // Par 5: Capas cilíndricas (Eje de Rotación + Fórmula Integral)
  {
    id: 'card-capas-axis',
    groupId: 'capas',
    category: 'Eje de Rotación',
    axisBadge: 'Eje Vertical x = 0',
    text: 'Cortes paralelos al eje y con radio ρ(x) = x y altura h(x) = x² en [0, 2]',
  },
  {
    id: 'card-capas-int',
    groupId: 'capas',
    category: 'Fórmula Integral',
    tex: 'V = 2\\pi \\int_{0}^{2} x \\cdot x^{2}\\,dx = 8\\pi',
    caption: 'Método de capas: 2π ∫ ρ(x)h(x) dx',
  },

  // Par 6: Toro (Eje de Rotación + Sólido 3D)
  {
    id: 'card-toro-axis',
    groupId: 'toro',
    category: 'Eje de Rotación',
    axisBadge: 'Eje Horizontal y = 0',
    text: 'R(x) = 2 + √(1−x²) y r(x) = 2 − √(1−x²) girando en [−1, 1]',
  },
  {
    id: 'card-toro-3d',
    groupId: 'toro',
    category: 'Sólido 3D',
    svgType: '3d',
    variant: 'torus',
    caption: 'Dona con hueco central · V = 4π² u³',
  },

  // Par 7: Eje desplazado y = -1 (Eje de Rotación + Fórmula Integral)
  {
    id: 'card-desp-axis',
    groupId: 'desplazado',
    category: 'Eje de Rotación',
    axisBadge: 'Recta Horizontal y = −1',
    text: 'Distancias al eje desplazado: R(x) = x − (−1) y r(x) = x² − (−1)',
  },
  {
    id: 'card-desp-int',
    groupId: 'desplazado',
    category: 'Fórmula Integral',
    tex: 'V = \\pi \\int_{0}^{1} \\left[(x+1)^{2} - (x^{2}+1)^{2}\\right] dx',
    caption: 'Arandelas con desplazamiento k = −1',
  },
];

const CATEGORY_STYLES = {
  'Gráfica 2D': 'bg-blue-50 text-blue-700 border-blue-200',
  'Fórmula Integral': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Eje de Rotación': 'bg-amber-50 text-amber-800 border-amber-300',
  'Sólido 3D': 'bg-sky-50 text-sky-700 border-sky-200',
};

function shuffleCards(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ==========================================================================
   CONTENIDO VISUAL DE CADA CARTA
   ========================================================================== */

function CardInnerContent({ card, compact = false }) {
  return (
    <div className="w-full h-full flex flex-col justify-between gap-2.5 select-none">
      <div className="flex items-center justify-between gap-1.5">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
            CATEGORY_STYLES[card.category] || 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {card.category}
        </span>
      </div>

      <div className="my-auto flex flex-col items-center justify-center min-h-[84px] w-full text-center">
        {card.svgType === '2d' && <Graph2DSvg variant={card.variant} />}
        {card.svgType === '3d' && <Solid3DSvg variant={card.variant} />}
        {card.tex && (
          <div className="w-full py-2.5 px-2.5 rounded-lg bg-slate-50/90 border border-slate-200/70 text-slate-800 flex items-center justify-center overflow-x-auto overflow-y-hidden">
            <KatexBlock
              display={false}
              tex={card.tex}
              className={`${compact ? 'text-xs' : 'text-[13px]'} whitespace-nowrap`}
            />
          </div>
        )}
        {card.axisBadge && (
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2.5 py-0.5">
              <Compass className="w-3 h-3" /> {card.axisBadge}
            </span>
            <p className="text-xs text-slate-600 leading-relaxed px-1">{card.text}</p>
          </div>
        )}
      </div>

      {card.caption && (
        <p className="text-[11px] font-mono text-slate-500 text-center truncate border-t border-slate-100 pt-1.5">
          {card.caption}
        </p>
      )}
    </div>
  );
}

/* ==========================================================================
   CARTA ARRASTRABLE (@dnd-kit/core + framer-motion)
   ========================================================================== */

function DraggableCard({ card, isShaking }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, scale: 0.94, y: 10 }}
      animate={
        isShaking
          ? {
              x: [0, -10, 10, -8, 8, -4, 4, 0],
              opacity: 1,
              scale: 1,
              transition: { duration: 0.42 },
            }
          : {
              x: 0,
              opacity: isDragging ? 0.3 : 1,
              scale: 1,
              y: 0,
              transition: { type: 'spring', stiffness: 320, damping: 26 },
            }
      }
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      {...listeners}
      {...attributes}
      className={`bg-white rounded-xl border shadow-sm overflow-hidden flex items-center justify-center p-4 min-h-[175px] cursor-grab active:cursor-grabbing active:scale-[0.98] hover:-translate-y-0.5 transform-gpu transition-colors duration-150 ${
        isShaking
          ? 'border-rose-400 bg-rose-50/70 shadow-[0_0_20px_rgba(244,63,94,0.28)]'
          : 'border-slate-200 hover:border-blue-400/80 hover:shadow-[0_10px_28px_-6px_rgba(37,99,235,0.18)]'
      }`}
    >
      <CardInnerContent card={card} />
    </motion.div>
  );
}

/* ==========================================================================
   ZONA DE SOLUCIÓN (DROP ZONE)
   ========================================================================== */

function SolutionDropZone({ group, placedCards, isShaking, isJustMatched }) {
  const isComplete = placedCards.length === 2;
  const { isOver, setNodeRef } = useDroppable({
    id: `zone-${group.groupId}`,
    data: { groupId: group.groupId },
    disabled: isComplete,
  });

  return (
    <motion.div
      ref={setNodeRef}
      animate={
        isShaking
          ? { x: [0, -10, 10, -7, 7, -3, 3, 0], transition: { duration: 0.4 } }
          : { x: 0 }
      }
      className={`rounded-2xl p-3.5 border-2 transition-all duration-200 transform-gpu flex flex-col gap-2.5 ${
        isShaking
          ? 'border-rose-400 bg-rose-50/85 shadow-[0_0_22px_rgba(244,63,94,0.28)]'
          : isComplete
            ? 'border-blue-500 bg-gradient-to-br from-blue-50/90 via-white to-amber-50/60 shadow-[0_0_24px_rgba(37,99,235,0.22)]'
            : isOver
              ? 'border-amber-400 bg-amber-50/60 shadow-[0_0_22px_rgba(251,191,36,0.35)] scale-[1.01]'
              : isJustMatched
                ? 'border-blue-400 bg-blue-50/50 shadow-[0_0_18px_rgba(37,99,235,0.2)]'
                : 'border-dashed border-slate-300 bg-white/80 hover:border-blue-300'
      }`}
    >
      {/* Cabecera de la zona */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            {group.title}
          </h4>
          <p className="text-[10px] text-slate-500">{group.subtitle}</p>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border tabular-nums shrink-0 ${
            isComplete
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {placedCards.length} / 2
        </span>
      </div>

      {/* Ranuras para las 2 cartas del par */}
      <div className="grid grid-cols-2 gap-2 min-h-[112px]">
        {[0, 1].map((slotIdx) => {
          const card = placedCards[slotIdx];
          if (card) {
            return (
              <motion.div
                key={card.id}
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 340, damping: 24 }}
                className="bg-white rounded-xl border border-blue-300 shadow-[0_0_14px_rgba(37,99,235,0.14)] p-2.5 flex items-center justify-center overflow-hidden"
              >
                <CardInnerContent card={card} compact />
              </motion.div>
            );
          }
          return (
            <div
              key={slotIdx}
              className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center p-2 text-center"
            >
              <span className="text-[10px] font-medium text-slate-400">
                Arrastra carta {slotIdx + 1}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ==========================================================================
   COMPONENTE PRINCIPAL: DUELO DE CARTAS (14 CARTAS)
   ========================================================================== */

export default function CardDuel({ onNavigate }) {
  const [deck, setDeck] = useState(() => shuffleCards(INITIAL_CARDS));
  const [placedByGroup, setPlacedByGroup] = useState(() => ({}));
  const [attempts, setAttempts] = useState(0);
  const [activeCard, setActiveCard] = useState(null);
  const [dragTilt, setDragTilt] = useState(2);
  const [shakingZone, setShakingZone] = useState(null);
  const [shakingCardId, setShakingCardId] = useState(null);
  const [recentZone, setRecentZone] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } })
  );

  // Contadores reactivos
  const matchedPairsCount = useMemo(
    () =>
      CHALLENGE_GROUPS.filter((g) => (placedByGroup[g.groupId]?.length || 0) === 2).length,
    [placedByGroup]
  );

  const lockedIds = useMemo(() => {
    const ids = new Set();
    Object.values(placedByGroup).forEach((arr) => arr.forEach((c) => ids.add(c.id)));
    return ids;
  }, [placedByGroup]);

  const availableCards = useMemo(
    () => deck.filter((c) => !lockedIds.has(c.id)),
    [deck, lockedIds]
  );

  const fireVictoryCelebration = useCallback((finalAttempts) => {
    // Dispara canvas-confetti desde ambos bordes inferiores
    const colors = ['#2563eb', '#3b82f6', '#fbbf24', '#fde047', '#ffffff'];
    confetti({
      particleCount: 70,
      angle: 60,
      spread: 65,
      origin: { x: 0.06, y: 0.92 },
      colors,
    });
    confetti({
      particleCount: 70,
      angle: 120,
      spread: 65,
      origin: { x: 0.94, y: 0.92 },
      colors,
    });

    toast.success('¡Victoria magistral en el Duelo de Cartas!', {
      description: `Completaste las 7 parejas (14 cartas) en ${finalAttempts} intentos. ¡Dominas los Sólidos de Revolución!`,
      duration: 6000,
    });
  }, []);

  const handleDragStart = useCallback((event) => {
    const card = event.active.data.current?.card;
    if (!card) return;
    // Ángulo aleatorio entre -3 y 3 grados (excluyendo 0 plano para dar dinamismo físico)
    const randomAngle = (Math.random() * 6 - 3) || 2.2;
    setDragTilt(Number(randomAngle.toFixed(2)));
    setActiveCard(card);
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      const card = active.data.current?.card;
      setActiveCard(null);

      if (!card || !over) return;
      const targetGroupId = over.data.current?.groupId;
      if (!targetGroupId) return;

      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (card.groupId === targetGroupId) {
        // ¡Match Correcto!
        setPlacedByGroup((prev) => {
          const current = prev[targetGroupId] || [];
          if (current.some((c) => c.id === card.id) || current.length >= 2) return prev;
          const updatedGroup = [...current, card];
          const nextState = { ...prev, [targetGroupId]: updatedGroup };

          const totalCompleted = CHALLENGE_GROUPS.filter(
            (g) => (nextState[g.groupId]?.length || 0) === 2
          ).length;

          if (totalCompleted === CHALLENGE_GROUPS.length) {
            setTimeout(() => fireVictoryCelebration(nextAttempts), 120);
          } else if (updatedGroup.length === 2) {
            toast.success('¡Pareja matemática completada!', {
              description: `${CHALLENGE_GROUPS.find((g) => g.groupId === targetGroupId)?.title}`,
              duration: 2400,
            });
          }
          return nextState;
        });

        setRecentZone(targetGroupId);
        setTimeout(() => setRecentZone(null), 900);
      } else {
        // Match Incorrecto: shake animation + destello rojo tenue y regresa a la mesa
        setShakingZone(targetGroupId);
        setShakingCardId(card.id);
        toast.error('Correspondencia incorrecta', {
          description: 'Revisa el eje de giro, los límites o el método de integración.',
          duration: 2200,
        });
        setTimeout(() => {
          setShakingZone(null);
          setShakingCardId(null);
        }, 500);
      }
    },
    [attempts, fireVictoryCelebration]
  );

  const handleResetGame = useCallback(() => {
    setPlacedByGroup({});
    setAttempts(0);
    setActiveCard(null);
    setShakingZone(null);
    setShakingCardId(null);
    setDeck(shuffleCards(INITIAL_CARDS));
    toast('Tablero reiniciado: 14 cartas barajadas', {
      duration: 2000,
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Toaster position="bottom-right" richColors closeButton />

      {/* =====================================================================
          CABECERA Y MARCADORES CON TABULAR-NUMS
         ===================================================================== */}
      <header className={`${GLASS_CLEAR} p-5 md:p-6 flex flex-wrap items-center justify-between gap-4`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-300 rounded-full px-3 py-0.5">
              <Swords className="w-3.5 h-3.5 text-amber-600" /> Minijuego Interactivo · 14 Cartas
            </span>
            {matchedPairsCount === CHALLENGE_GROUPS.length && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-600 text-white rounded-full px-3 py-0.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> ¡Partida Completada!
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Duelo de Cartas: Sólidos de Revolución
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Arrastra cada una de las <b className="text-slate-800">14 cartas</b> desde la mesa inferior hacia su{' '}
            <b className="text-blue-700">Zona de Solución</b> superior emparejando gráficas 2D, fórmulas integrales, ejes de rotación y sólidos 3D.
          </p>
        </div>

        {/* Marcadores reactivos con tabular-nums */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`${GLASS_CLEAR_INNER} px-4 py-2.5 flex items-center gap-2.5`}>
            <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="leading-tight">
              <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Parejas Encontradas
              </span>
              <span className="text-base font-extrabold font-mono text-blue-700 tabular-nums">
                {matchedPairsCount} / {CHALLENGE_GROUPS.length}
              </span>
            </div>
          </div>

          <div className={`${GLASS_CLEAR_INNER} px-4 py-2.5 flex items-center gap-2.5`}>
            <Flame className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="leading-tight">
              <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Intentos
              </span>
              <span className="text-base font-extrabold font-mono text-slate-800 tabular-nums">
                {attempts}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetGame}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Barajar 14 cartas
          </button>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveCard(null)}
      >
        {/* ===================================================================
            ÁREA SUPERIOR: ZONAS DE SOLUCIÓN (DROP ZONES)
           =================================================================== */}
        <section className={`${GLASS_CLEAR} p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Zonas de Solución (Drop Zones)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              Cartas bloqueadas: <b className="text-blue-700">{lockedIds.size} / 14</b>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {CHALLENGE_GROUPS.map((group) => (
              <SolutionDropZone
                key={group.groupId}
                group={group}
                placedCards={placedByGroup[group.groupId] || []}
                isShaking={shakingZone === group.groupId}
                isJustMatched={recentZone === group.groupId}
              />
            ))}
          </div>
        </section>

        {/* ===================================================================
            ÁREA INFERIOR: CUADRÍCULA DE LAS 14 CARTAS DISPONIBLES EN MESA
           =================================================================== */}
        <section className={`${GLASS_CLEAR} p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Mesa de Juego ({availableCards.length} de 14 cartas disponibles)
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
              {Object.entries(CATEGORY_STYLES).map(([cat, cls]) => (
                <span key={cat} className={`px-2 py-0.5 rounded-md border ${cls}`}>
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {availableCards.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4"
            >
              <AnimatePresence>
                {availableCards.map((card) => (
                  <DraggableCard
                    key={card.id}
                    card={card}
                    isShaking={shakingCardId === card.id}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-300 bg-gradient-to-r from-blue-50 via-white to-amber-50 p-6 text-center space-y-3"
            >
              <Trophy className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-lg font-extrabold text-slate-900">
                ¡Has emparejado las 14 cartas correctamente!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto tabular-nums">
                Completaste las 7 parejas en <b>{attempts}</b> intentos. Puedes iniciar una nueva partida o verificar cualquiera de los sólidos en el simulador 3D.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleResetGame}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs shadow-md shadow-amber-500/20 transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer"
                >
                  Jugar otra partida
                </button>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('simulator')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer"
                  >
                    Ir al Simulador 3D
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </section>

        {/* Overlay flotante con físicas de resorte, scale: 1.05, rotación [-3°, 3°] y brillo ámbar */}
        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {activeCard ? (
            <motion.div
              initial={{ scale: 1, rotate: 0 }}
              animate={{ scale: 1.05, rotate: dragTilt }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              className="bg-white rounded-xl border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] overflow-hidden flex items-center justify-center p-4 min-h-[175px] cursor-grabbing w-72 transform-gpu"
            >
              <CardInnerContent card={activeCard} />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
