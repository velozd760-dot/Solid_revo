import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  Loader2,
  Maximize2,
  Minimize2,
  MousePointerClick,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Swords,
  Trophy,
  UserCheck,
} from 'lucide-react';
import KatexBlock from './KatexBlock';
import { GLASS_CLEAR, GLASS_CLEAR_INNER } from './GlassCard';
import { submitChallengeGrade } from '../services/gradeSubmissionService';

/* ==========================================================================
   ILUSTRACIONES SVG GENERADAS POR CÓDIGO ("Gráfica 2D" y "Sólido 3D")
   ========================================================================== */

const Graph2DSvg = memo(function Graph2DSvg({ variant, compact = false }) {
  const heightClass = compact ? 'h-10' : 'h-12 xl:h-14';

  if (variant === 'semicircle') {
    return (
      <svg viewBox="0 0 190 92" className={`w-full ${heightClass}`} fill="none" aria-hidden="true">
        <line x1="14" y1="74" x2="176" y2="74" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="95" y1="8" x2="95" y2="84" stroke="#94a3b8" strokeWidth="1.5" />
        <path
          d="M 39 74 A 56 56 0 0 1 151 74 Z"
          fill="rgba(37, 99, 235, 0.20)"
          stroke="#2563eb"
          strokeWidth="2.4"
        />
        <rect x="109" y="27" width="9" height="47" fill="rgba(251, 191, 36, 0.80)" stroke="#d97706" strokeWidth="1.2" />
        <line x1="14" y1="74" x2="176" y2="74" stroke="#e11d48" strokeWidth="1.6" strokeDasharray="4 3" />
        <text x="134" y="24" fill="#1d4ed8" fontSize="10.5" fontWeight="700" fontFamily="monospace">
          √(4−x²)
        </text>
        <text x="33" y="86" fill="#64748b" fontSize="9.5" fontFamily="monospace">
          -2
        </text>
        <text x="148" y="86" fill="#64748b" fontSize="9.5" fontFamily="monospace">
          2
        </text>
      </svg>
    );
  }

  if (variant === 'cone-line') {
    return (
      <svg viewBox="0 0 190 92" className={`w-full ${heightClass}`} fill="none" aria-hidden="true">
        <line x1="20" y1="74" x2="172" y2="74" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="30" y1="10" x2="30" y2="84" stroke="#94a3b8" strokeWidth="1.5" />
        <path
          d="M 30 74 L 156 18 L 156 74 Z"
          fill="rgba(37, 99, 235, 0.20)"
          stroke="#2563eb"
          strokeWidth="2.4"
        />
        <rect x="106" y="40" width="9" height="34" fill="rgba(251, 191, 36, 0.80)" stroke="#d97706" strokeWidth="1.2" />
        <line x1="20" y1="74" x2="172" y2="74" stroke="#e11d48" strokeWidth="1.6" strokeDasharray="4 3" />
        <text x="68" y="30" fill="#1d4ed8" fontSize="10.5" fontWeight="700" fontFamily="monospace">
          f(x) = 0.5x
        </text>
        <text x="152" y="86" fill="#64748b" fontSize="9.5" fontFamily="monospace">
          4
        </text>
      </svg>
    );
  }

  // two-curves: f(x)=sqrt(x) y g(x)=x^2 en [0, 1]
  return (
    <svg viewBox="0 0 190 92" className={`w-full ${heightClass}`} fill="none" aria-hidden="true">
      <line x1="22" y1="76" x2="170" y2="76" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="32" y1="10" x2="32" y2="84" stroke="#94a3b8" strokeWidth="1.5" />
      <path d="M 32 76 Q 68 22 150 16 Q 108 68 32 76 Z" fill="rgba(37, 99, 235, 0.22)" />
      <path d="M 32 76 Q 68 22 150 16" stroke="#2563eb" strokeWidth="2.4" />
      <path d="M 32 76 Q 108 68 150 16" stroke="#6366f1" strokeWidth="2.2" />
      <rect x="86" y="35" width="9" height="24" fill="rgba(251, 191, 36, 0.82)" stroke="#d97706" strokeWidth="1.2" />
      <text x="58" y="22" fill="#1d4ed8" fontSize="10" fontWeight="700" fontFamily="monospace">
        √x
      </text>
      <text x="114" y="64" fill="#4f46e5" fontSize="10" fontWeight="700" fontFamily="monospace">
        x²
      </text>
    </svg>
  );
});

const Solid3DSvg = memo(function Solid3DSvg({ variant, compact = false }) {
  const heightClass = compact ? 'h-10' : 'h-12 xl:h-14';

  if (variant === 'sphere') {
    return (
      <svg viewBox="0 0 190 92" className={`w-full ${heightClass}`} fill="none" aria-hidden="true">
        <line x1="12" y1="46" x2="178" y2="46" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="95" cy="46" r="34" fill="rgba(59, 130, 246, 0.22)" stroke="#2563eb" strokeWidth="2.2" />
        <ellipse cx="95" cy="46" rx="13" ry="34" fill="rgba(251, 191, 36, 0.45)" stroke="#f59e0b" strokeWidth="2" />
        <ellipse cx="95" cy="46" rx="34" ry="11" stroke="#60a5fa" strokeWidth="1.4" strokeDasharray="3 3" />
        <text x="136" y="22" fill="#b45309" fontSize="10" fontWeight="700" fontFamily="monospace">
          Esfera 3D
        </text>
      </svg>
    );
  }

  // paraboloid (Trompeta parabólica)
  return (
    <svg viewBox="0 0 190 92" className={`w-full ${heightClass}`} fill="none" aria-hidden="true">
      <line x1="12" y1="46" x2="178" y2="46" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="4 3" />
      <path
        d="M 34 46 Q 78 13 148 13 L 148 79 Q 78 79 34 46 Z"
        fill="rgba(59, 130, 246, 0.22)"
        stroke="#2563eb"
        strokeWidth="2.2"
      />
      <ellipse cx="148" cy="46" rx="11" ry="33" fill="rgba(147, 197, 253, 0.45)" stroke="#1d4ed8" strokeWidth="2" />
      <ellipse cx="102" cy="46" rx="8" ry="25" fill="rgba(251, 191, 36, 0.55)" stroke="#f59e0b" strokeWidth="2" />
      <text x="30" y="21" fill="#1d4ed8" fontSize="10" fontWeight="700" fontFamily="monospace">
        Trompeta 3D
      </text>
    </svg>
  );
});

/* ==========================================================================
   4 DESAFÍOS CONCEPTUALES Y 8 CARTAS (2 POR PROBLEMA)
   ========================================================================== */

const CHALLENGE_GROUPS = [
  {
    groupId: 'esfera',
    title: '1. Esfera de Revolución',
    method: 'Método de Discos',
    subtitle: 'Semicírculo f(x) = √(4 − x²) en [−2, 2] sobre eje y = 0',
  },
  {
    groupId: 'cono',
    title: '2. Cono Recto',
    method: 'Método de Discos',
    subtitle: 'Recta generatriz f(x) = 0.5x en [0, 4] sobre eje y = 0',
  },
  {
    groupId: 'paraboloide',
    title: '3. Trompeta Parabólica',
    method: 'Método de Discos',
    subtitle: 'Curva radical f(x) = √x en [0, 4] sobre eje y = 0',
  },
  {
    groupId: 'arandela',
    title: '4. Arandela entre dos Curvas',
    method: 'Método de Arandelas',
    subtitle: 'Región entre f(x) = √x y g(x) = x² en [0, 1] sobre y = 0',
  },
];

const INITIAL_CARDS = [
  // Problema 1: Esfera (Gráfica 2D + Sólido 3D)
  {
    id: 'card-esfera-2d',
    groupId: 'esfera',
    category: 'Gráfica 2D',
    svgType: '2d',
    variant: 'semicircle',
    caption: 'Región f(x) = √(4 − x²) en [−2, 2]',
  },
  {
    id: 'card-esfera-3d',
    groupId: 'esfera',
    category: 'Sólido 3D',
    svgType: '3d',
    variant: 'sphere',
    caption: 'Esfera maciza · V = (32/3)π u³',
  },

  // Problema 2: Cono (Gráfica 2D + Fórmula Integral)
  {
    id: 'card-cono-2d',
    groupId: 'cono',
    category: 'Gráfica 2D',
    svgType: '2d',
    variant: 'cone-line',
    caption: 'Triángulo generatriz f(x) = 0.5x en [0, 4]',
  },
  {
    id: 'card-cono-int',
    groupId: 'cono',
    category: 'Fórmula Integral',
    tex: 'V = \\pi \\int_{0}^{4} (0.5x)^{2}\\,dx = \\frac{16}{3}\\pi',
    caption: 'Discos: R(x) = 0.5x en [0, 4]',
  },

  // Problema 3: Trompeta Parabólica (Sólido 3D + Fórmula Integral)
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

  // Problema 4: Arandela entre dos curvas (Gráfica 2D + Fórmula Integral)
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
];

const CATEGORY_STYLES = {
  'Gráfica 2D': 'bg-blue-50 text-blue-700 border-blue-200',
  'Fórmula Integral': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Sólido 3D': 'bg-amber-50 text-amber-800 border-amber-300',
};

const TOTAL_CARDS = INITIAL_CARDS.length;
const MAX_SCORE = 100;
const CHALLENGE_TOPIC = 'Duelo de Cartas: Sólidos de Revolución';
const STUDENT_PROFILE_KEY = 'solid_revo_challenge_student';

function loadSavedStudentProfile() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return { studentName: '', studentId: '' };
    }
    const raw = window.sessionStorage.getItem(STUDENT_PROFILE_KEY);
    if (!raw) return { studentName: '', studentId: '' };
    const parsed = JSON.parse(raw);
    return {
      studentName: typeof parsed?.studentName === 'string' ? parsed.studentName : '',
      studentId: typeof parsed?.studentId === 'string' ? parsed.studentId : '',
    };
  } catch {
    return { studentName: '', studentId: '' };
  }
}

function saveStudentProfile(studentName, studentId) {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    window.sessionStorage.setItem(
      STUDENT_PROFILE_KEY,
      JSON.stringify({ studentName, studentId })
    );
  } catch {
    // Fallback silencioso si sessionStorage está restringido
  }
}

function formatElapsedTime(totalSeconds) {
  const safe = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return mins > 0 ? `${mins}m ${String(secs).padStart(2, '0')}s` : `${secs}s`;
}

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

const CardInnerContent = memo(function CardInnerContent({ card, compact = false, isSelected = false }) {
  return (
    <div className="w-full h-full flex flex-col justify-between gap-1 select-none min-h-0">
      <div className="flex items-center justify-between gap-1.5 shrink-0">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
            CATEGORY_STYLES[card.category] || 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {card.category}
        </span>
        {isSelected && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md animate-pulse">
            <MousePointerClick className="w-3 h-3 text-amber-600" />
            Seleccionada
          </span>
        )}
      </div>

      <div className="my-auto flex flex-col items-center justify-center w-full text-center min-h-0 overflow-hidden">
        {card.svgType === '2d' && <Graph2DSvg variant={card.variant} compact={compact} />}
        {card.svgType === '3d' && <Solid3DSvg variant={card.variant} compact={compact} />}
        {card.tex && (
          <div
            className={`w-full ${
              compact ? 'py-1 px-2' : 'py-1.5 px-2.5'
            } rounded-lg bg-slate-50/90 border border-slate-200/70 text-slate-800 flex items-center justify-center overflow-x-auto overflow-y-hidden`}
          >
            <KatexBlock
              display={false}
              tex={card.tex}
              className={`${compact ? 'text-[11px]' : 'text-xs xl:text-sm'} whitespace-nowrap`}
            />
          </div>
        )}
      </div>

      {card.caption && (
        <p className="text-[10px] font-mono text-slate-500 text-center truncate border-t border-slate-100 pt-1 shrink-0">
          {card.caption}
        </p>
      )}
    </div>
  );
});

/* ==========================================================================
   CARTA INTERACTIVA HÍBRIDA (CLICK-TO-PLACE + DRAG & DROP)
   ========================================================================== */

const DraggableCard = memo(function DraggableCard({ card, isSelected, isShaking, onSelectCard }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onSelectCard(card.id);
    },
    [card.id, onSelectCard]
  );

  return (
    <motion.div
      ref={setNodeRef}
      layoutId={`duel-card-${card.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
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
              scale: isSelected ? 1.05 : 1,
              y: isSelected ? -2 : 0,
              transition: { type: 'spring', stiffness: 360, damping: 26 },
            }
      }
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      onClick={handleClick}
      {...listeners}
      {...attributes}
      className={`bg-white rounded-xl border p-2.5 h-full min-h-0 flex flex-col justify-between cursor-grab active:cursor-grabbing transform-gpu will-change-transform transition-all duration-150 ${
        isShaking
          ? 'border-rose-400 bg-rose-50/85 ring-4 ring-rose-200/60 shadow-[0_0_20px_rgba(244,63,94,0.28)] z-20'
          : isSelected
            ? 'border-amber-400 ring-4 ring-amber-300/40 shadow-lg z-20'
            : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <CardInnerContent card={card} isSelected={isSelected} />
    </motion.div>
  );
});

/* ==========================================================================
   CASILLA RECEPTORA INDIVIDUAL (DROP SLOT) Y ZONA DE SOLUCIÓN
   ========================================================================== */

const DropSlot = memo(function DropSlot({ groupId, slotIdx, card, isZoneOver, hasSelection, onSlotClick }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${groupId}-${slotIdx}`,
    data: { groupId, slotIdx },
    disabled: Boolean(card),
  });

  const activeOver = !card && (isOver || isZoneOver);

  const handleSlotClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!card && hasSelection) {
        onSlotClick(groupId);
      }
    },
    [card, groupId, hasSelection, onSlotClick]
  );

  if (card) {
    return (
      <motion.div
        layoutId={`duel-card-${card.id}`}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
        className="rounded-xl border-2 border-emerald-500/80 bg-emerald-50/35 shadow-sm h-full min-h-0 flex items-center justify-center p-2 overflow-hidden transform-gpu will-change-transform"
      >
        <CardInnerContent card={card} compact />
      </motion.div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      onClick={handleSlotClick}
      role={hasSelection ? 'button' : undefined}
      tabIndex={hasSelection ? 0 : undefined}
      onKeyDown={
        hasSelection
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onSlotClick(groupId);
              }
            }
          : undefined
      }
      className={`border-2 border-dashed rounded-xl h-full min-h-0 flex items-center justify-center p-2 transition-all transform-gpu will-change-transform ${
        activeOver
          ? 'border-amber-400 bg-amber-50/60 scale-[1.02]'
          : hasSelection
            ? 'border-amber-300 bg-amber-50/35 hover:border-amber-400 hover:bg-amber-50/70 hover:scale-[1.01] cursor-pointer'
            : 'border-slate-200 bg-slate-50/50'
      }`}
    >
      <span
        className={`text-[11px] font-medium text-center select-none ${
          hasSelection ? 'text-amber-700 font-semibold' : 'text-slate-400'
        }`}
      >
        {hasSelection
          ? `Ranura ${slotIdx + 1} · Clic para colocar`
          : `Ranura ${slotIdx + 1} · Suelta carta aquí`}
      </span>
    </div>
  );
});

const SolutionDropZone = memo(function SolutionDropZone({ group, placedCards, isShaking, hasSelection, onSlotClick }) {
  const isComplete = placedCards.length === 2;
  const { isOver, setNodeRef } = useDroppable({
    id: `zone-${group.groupId}`,
    data: { groupId: group.groupId },
    disabled: isComplete,
  });

  const handleZoneClick = useCallback(
    (e) => {
      if (!isComplete && hasSelection) {
        e.stopPropagation();
        onSlotClick(group.groupId);
      }
    },
    [group.groupId, hasSelection, isComplete, onSlotClick]
  );

  return (
    <motion.div
      ref={setNodeRef}
      onClick={handleZoneClick}
      animate={
        isShaking
          ? { x: [0, -10, 10, -7, 7, -3, 3, 0], transition: { duration: 0.4 } }
          : { x: 0 }
      }
      className={`flex-1 min-h-0 rounded-2xl p-2.5 xl:p-3 border transition-all duration-200 transform-gpu will-change-transform flex flex-col justify-between gap-1.5 ${
        isShaking
          ? 'border-rose-400 bg-rose-50/85 shadow-[0_0_22px_rgba(244,63,94,0.28)]'
          : isComplete
            ? 'border-emerald-500/80 bg-gradient-to-br from-emerald-50/50 via-white to-blue-50/40 shadow-sm'
            : isOver
              ? 'border-amber-400 bg-amber-50/30 shadow-md'
              : hasSelection
                ? 'border-amber-300/80 bg-white hover:border-amber-400 shadow-sm cursor-pointer'
                : 'border-slate-200/90 bg-white shadow-sm'
      }`}
    >
      {/* Cabecera compacta: título, método sugerido y contador tabular */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-xs xl:text-sm font-bold text-slate-800 flex items-center gap-1.5 truncate">
              {isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <span className="truncate">{group.title}</span>
            </h4>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              {group.method}
            </span>
          </div>
          <p className="text-[10px] xl:text-[11px] text-slate-500 truncate">{group.subtitle}</p>
        </div>

        <span
          className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border tabular-nums shrink-0 ${
            isComplete
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {placedCards.length}/2
        </span>
      </div>

      {/* Fila con 2 casillas receptoras (Drop Targets) */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-2.5">
        {[0, 1].map((slotIdx) => (
          <DropSlot
            key={slotIdx}
            groupId={group.groupId}
            slotIdx={slotIdx}
            card={placedCards[slotIdx]}
            isZoneOver={isOver && placedCards.length === slotIdx}
            hasSelection={hasSelection}
            onSlotClick={onSlotClick}
          />
        ))}
      </div>
    </motion.div>
  );
});

/* ==========================================================================
   COMPONENTE PRINCIPAL: DUELO DE CARTAS (ZERO-SCROLL + FULLSCREEN + HÍBRIDO)
   ========================================================================== */

const CardDuel = memo(function CardDuel({ onNavigate }) {
  const containerRef = useRef(null);
  const confettiCanvasRef = useRef(null);
  const roundStartMsRef = useRef(Date.now());
  const submissionCtrlRef = useRef(null);
  const activeAttemptIdRef = useRef(null);
  const isMountedRef = useRef(true);

  const [deck, setDeck] = useState(() => shuffleCards(INITIAL_CARDS));
  const [placedByGroup, setPlacedByGroup] = useState(() => ({}));
  const [attempts, setAttempts] = useState(0);
  const [activeCard, setActiveCard] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [dragTilt, setDragTilt] = useState(2);
  const [shakingZone, setShakingZone] = useState(null);
  const [shakingCardId, setShakingCardId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estado aislado de registro y sincronización de calificaciones
  const [initialProfile] = useState(() => loadSavedStudentProfile());
  const [studentName, setStudentName] = useState(initialProfile.studentName);
  const [studentId, setStudentId] = useState(initialProfile.studentId);
  const [completionSnapshot, setCompletionSnapshot] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [syncMessage, setSyncMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [submittedRecord, setSubmittedRecord] = useState(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      submissionCtrlRef.current?.abort();
    };
  }, []);

  // Sincronización con Fullscreen API
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = useCallback(async (e) => {
    e.stopPropagation();
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.error('No se pudo alternar el modo de pantalla completa.');
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 110, tolerance: 8 } })
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

  const selectedCard = useMemo(
    () => availableCards.find((c) => c.id === selectedCardId) || null,
    [availableCards, selectedCardId]
  );

  // Congela el puntaje, intentos y duración exacta en cuanto se completan los 4 desafíos
  useEffect(() => {
    if (matchedPairsCount === CHALLENGE_GROUPS.length && !completionSnapshot) {
      const elapsedSec = Math.max(
        1,
        Math.round((Date.now() - roundStartMsRef.current) / 1000)
      );
      const safeAttempts = Math.max(TOTAL_CARDS, attempts);
      const mistakes = Math.max(0, safeAttempts - TOTAL_CARDS);
      const score = Math.round((TOTAL_CARDS / safeAttempts) * MAX_SCORE);
      const percentage = Number(((score / MAX_SCORE) * 100).toFixed(1));
      const attemptId = `duel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      activeAttemptIdRef.current = attemptId;
      setCompletionSnapshot({
        attemptId,
        attempts: safeAttempts,
        mistakes,
        score,
        maxScore: MAX_SCORE,
        percentage,
        timeElapsedSeconds: elapsedSec,
      });
    }
  }, [attempts, completionSnapshot, matchedPairsCount]);

  const fireVictoryCelebration = useCallback((finalAttempts) => {
    const colors = ['#2563eb', '#10b981', '#fbbf24', '#fde047', '#ffffff'];
    const fire = confettiCanvasRef.current
      ? confetti.create(confettiCanvasRef.current, { resize: true, useWorker: true })
      : confetti;

    fire({
      particleCount: 70,
      angle: 60,
      spread: 65,
      origin: { x: 0.08, y: 0.9 },
      colors,
    });
    fire({
      particleCount: 70,
      angle: 120,
      spread: 65,
      origin: { x: 0.92, y: 0.9 },
      colors,
    });

    toast.success('¡Victoria en el Duelo de Cartas!', {
      description: `Completaste los 4 desafíos (8 de 8 cartas) en ${finalAttempts} intentos. ¡Excelente dominio de los Sólidos de Revolución!`,
      duration: 6000,
    });
  }, []);

  // Validación unificada para Drag & Drop y Click-to-Place
  const validateCardPlacement = useCallback(
    (card, targetGroupId) => {
      if (!card || !targetGroupId) return;

      const currentInZone = placedByGroup[targetGroupId] || [];
      if (currentInZone.length >= 2 || currentInZone.some((c) => c.id === card.id)) {
        return;
      }

      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (card.groupId === targetGroupId) {
        // ¡Match Correcto!
        setSelectedCardId(null);
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
            toast.success('¡Desafío completado (2/2)!', {
              description: `${CHALLENGE_GROUPS.find((g) => g.groupId === targetGroupId)?.title}`,
              duration: 2400,
            });
          }
          return nextState;
        });
      } else {
        // Match Incorrecto: vibración en eje X, deselección y destello rojo tenue
        setSelectedCardId(null);
        setShakingZone(targetGroupId);
        setShakingCardId(card.id);
        toast.error('Correspondencia incorrecta', {
          description: 'Revisa la curva generatriz, la integral o el volumen resultante.',
          duration: 2200,
        });
        setTimeout(() => {
          setShakingZone(null);
          setShakingCardId(null);
        }, 480);
      }
    },
    [attempts, fireVictoryCelebration, placedByGroup]
  );

  // Interacción por Clic: Seleccionar / Cambiar carta
  const handleSelectCard = useCallback((cardId) => {
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
  }, []);

  // Interacción por Clic: Colocar carta seleccionada en ranura vacía
  const handleSlotClick = useCallback(
    (targetGroupId) => {
      if (!selectedCard) return;
      validateCardPlacement(selectedCard, targetGroupId);
    },
    [selectedCard, validateCardPlacement]
  );

  // Clic fuera de cartas/ranuras limpia la selección
  const handleBackgroundClick = useCallback(() => {
    if (selectedCardId) {
      setSelectedCardId(null);
    }
  }, [selectedCardId]);

  const handleDragStart = useCallback((event) => {
    const card = event.active.data.current?.card;
    if (!card) return;
    const randomAngle = (Math.random() * 5 - 2.5) || 1.8;
    setDragTilt(Number(randomAngle.toFixed(2)));
    setActiveCard(card);
    setSelectedCardId(card.id);
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      const card = active.data.current?.card;
      setActiveCard(null);

      if (!card || !over) return;
      const targetGroupId = over.data.current?.groupId;
      if (!targetGroupId) return;

      validateCardPlacement(card, targetGroupId);
    },
    [validateCardPlacement]
  );

  const handleResetGame = useCallback((e) => {
    e?.stopPropagation();
    submissionCtrlRef.current?.abort();
    submissionCtrlRef.current = null;
    activeAttemptIdRef.current = null;
    roundStartMsRef.current = Date.now();
    setCompletionSnapshot(null);
    setSyncStatus('idle');
    setSyncMessage('');
    setFormError('');
    setSubmittedRecord(null);
    setPlacedByGroup({});
    setAttempts(0);
    setActiveCard(null);
    setSelectedCardId(null);
    setShakingZone(null);
    setShakingCardId(null);
    setDeck(shuffleCards(INITIAL_CARDS));
    toast('Partida reiniciada: 8 cartas mezcladas', {
      duration: 2000,
    });
  }, []);

  const handleSubmitGrade = useCallback(
    async (e) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (syncStatus === 'submitting' || syncStatus === 'success') return;

      const cleanName = studentName.trim();
      const cleanId = studentId.trim();
      if (cleanName.length < 2) {
        setFormError('Ingresa el nombre completo del estudiante (mínimo 2 caracteres).');
        return;
      }

      saveStudentProfile(cleanName, cleanId);

      const snapshot = completionSnapshot ?? {
        attemptId:
          activeAttemptIdRef.current ||
          `duel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        attempts: Math.max(TOTAL_CARDS, attempts),
        mistakes: Math.max(0, attempts - TOTAL_CARDS),
        score: Math.round((TOTAL_CARDS / Math.max(TOTAL_CARDS, attempts)) * MAX_SCORE),
        maxScore: MAX_SCORE,
        percentage: Number(
          ((TOTAL_CARDS / Math.max(TOTAL_CARDS, attempts)) * 100).toFixed(1)
        ),
        timeElapsedSeconds: Math.max(
          1,
          Math.round((Date.now() - roundStartMsRef.current) / 1000)
        ),
      };

      activeAttemptIdRef.current = snapshot.attemptId;
      submissionCtrlRef.current?.abort();
      const controller = new AbortController();
      submissionCtrlRef.current = controller;

      setFormError('');
      setSyncMessage('');
      setSyncStatus('submitting');

      const result = await submitChallengeGrade(
        {
          studentName: cleanName,
          studentId: cleanId,
          score: snapshot.score,
          maxScore: snapshot.maxScore,
          timeElapsedSeconds: snapshot.timeElapsedSeconds,
          topic: CHALLENGE_TOPIC,
          details: `4/4 desafíos completados (Esfera, Cono, Trompeta Parabólica, Arandela) · ${TOTAL_CARDS}/${TOTAL_CARDS} cartas en ${snapshot.attempts} intentos (${snapshot.mistakes === 1 ? '1 error' : `${snapshot.mistakes} errores`})`,
        },
        {
          signal: controller.signal,
          submissionId: snapshot.attemptId,
        }
      );

      if (
        !isMountedRef.current ||
        activeAttemptIdRef.current !== snapshot.attemptId ||
        result.status === 'aborted'
      ) {
        return;
      }

      if (result.ok) {
        setSyncStatus('success');
        setSyncMessage('');
        setSubmittedRecord({
          studentName: cleanName,
          studentId: cleanId || 'N/A',
        });
        toast.success('Calificación registrada en el sistema', { duration: 3500 });
      } else {
        setSyncStatus('error');
        setSyncMessage(
          result.error ||
            'No se pudo conectar con Google Sheets. Tu resultado sigue guardado localmente para reintentar.'
        );
        toast.error('Error de conexión: reintentar', {
          description: result.error,
          duration: 4000,
        });
      }
    },
    [attempts, completionSnapshot, studentId, studentName, syncStatus]
  );

  const displayAttempts = completionSnapshot?.attempts ?? attempts;
  const displayScore =
    completionSnapshot?.score ??
    Math.round((TOTAL_CARDS / Math.max(TOTAL_CARDS, attempts)) * MAX_SCORE);
  const displayPercentage =
    completionSnapshot?.percentage ??
    Number(((displayScore / MAX_SCORE) * 100).toFixed(1));
  const displayElapsedSec = completionSnapshot?.timeElapsedSeconds ?? 1;

  return (
    <div
      ref={containerRef}
      onClick={handleBackgroundClick}
      className={`w-full p-4 flex flex-col justify-between gap-3 overflow-hidden relative ${
        isFullscreen
          ? 'h-[100dvh] max-w-none bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/60'
          : 'h-[calc(100vh-80px)] max-w-7xl mx-auto rounded-3xl'
      }`}
    >
      {/* Lienzo de confeti compatible con modo Pantalla Completa */}
      <canvas
        ref={confettiCanvasRef}
        className="pointer-events-none fixed inset-0 w-full h-full z-50"
      />
      <Toaster position="bottom-right" richColors closeButton />

      {/* =====================================================================
          1. BARRA SUPERIOR COMPACTA CON CONTROLES Y MODO PANTALLA COMPLETA
         ===================================================================== */}
      <header
        className={`${GLASS_CLEAR} shrink-0 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3`}
      >
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-300 rounded-full px-3 py-1 shrink-0">
            <Swords className="w-3.5 h-3.5 text-amber-600" /> Duelo de Cartas
          </span>
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-extrabold tracking-tight text-slate-900 truncate">
              Desafíos de Sólidos de Revolución
            </h2>
            <p className="text-[11px] text-slate-500 truncate">
              {selectedCard
                ? 'Carta activa: haz clic en cualquier casilla vacía a la izquierda para colocarla.'
                : 'Haz clic en una carta (o arrástrala) hacia su desafío correspondiente.'}
            </p>
          </div>
          {matchedPairsCount === CHALLENGE_GROUPS.length && (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-600 text-white rounded-full px-3 py-1 shadow-sm shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" /> ¡Completado 4/4!
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className={`${GLASS_CLEAR_INNER} px-3 py-1.5 flex items-center gap-1.5`}>
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-600">Aciertos:</span>
            <span className="text-sm font-extrabold font-mono text-blue-700 tabular-nums">
              {matchedPairsCount}/{CHALLENGE_GROUPS.length}
            </span>
          </div>

          <div className={`${GLASS_CLEAR_INNER} px-3 py-1.5 flex items-center gap-1.5`}>
            <Flame className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-600">Intentos:</span>
            <span className="text-sm font-extrabold font-mono text-slate-800 tabular-nums">
              {attempts}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetGame}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar partida
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Modo Pantalla Completa'}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla Completa'}
            className="bg-white/80 border border-slate-200 hover:bg-slate-100 rounded-lg p-2 transition-all active:scale-95 text-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-blue-600" />
            ) : (
              <Maximize2 className="w-4 h-4 text-slate-700" />
            )}
            <span className="hidden sm:inline">
              {isFullscreen ? 'Salir' : 'Pantalla Completa'}
            </span>
          </button>
        </div>
      </header>

      {/* =====================================================================
          2. TABLERO DIVIDIDO ZERO-SCROLL (COLUMNAS BALANCEADAS)
         ===================================================================== */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveCard(null)}
      >
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch overflow-hidden">
          {/* =================================================================
              COLUMNA IZQUIERDA: 4 ZONAS DE SOLUCIÓN (FLEX-1 DISTRIBUIDO)
             ================================================================= */}
          <section
            className={`${GLASS_CLEAR} lg:col-span-6 h-full min-h-0 p-3.5 flex flex-col justify-between gap-2.5 overflow-hidden`}
          >
            <div className="shrink-0 flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Zonas de Solución (4 Problemas)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                Colocadas: <b className="text-blue-700">{lockedIds.size}/8</b>
              </span>
            </div>

            <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5">
              {CHALLENGE_GROUPS.map((group) => (
                <SolutionDropZone
                  key={group.groupId}
                  group={group}
                  placedCards={placedByGroup[group.groupId] || []}
                  isShaking={shakingZone === group.groupId}
                  hasSelection={Boolean(selectedCard)}
                  onSlotClick={handleSlotClick}
                />
              ))}
            </div>
          </section>

          {/* =================================================================
              COLUMNA DERECHA: MAZO DE 8 CARTAS (CUADRÍCULA 2x4 PROPORCIONAL)
             ================================================================= */}
          <section
            className={`${GLASS_CLEAR} lg:col-span-6 h-full min-h-0 p-3.5 flex flex-col justify-between gap-2.5 overflow-hidden`}
          >
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 tabular-nums">
                  Mazo de Cartas Disponibles ({availableCards.length}/8)
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
              <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-4 gap-3">
                <AnimatePresence>
                  {availableCards.map((card) => (
                    <DraggableCard
                      key={card.id}
                      card={card}
                      isSelected={selectedCardId === card.id}
                      isShaking={shakingCardId === card.id}
                      onSelectCard={handleSelectCard}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/70 p-4 sm:p-5 flex flex-col items-center justify-between gap-3 transform-gpu will-change-transform"
              >
                <div className="w-full text-center space-y-2 shrink-0">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 text-amber-600 shadow-xs">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                      ¡4 de 4 desafíos resueltos con éxito!
                    </h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto mt-0.5 tabular-nums">
                      Colocaste las 8 cartas correctamente en <b>{displayAttempts}</b> intentos.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 text-slate-800 shadow-2xs tabular-nums">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Puntaje:{' '}
                      <b className="text-blue-700">
                        {displayScore}/{MAX_SCORE}
                      </b>{' '}
                      ({displayPercentage}%)
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 text-slate-700 shadow-2xs tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      Tiempo: <b>{formatElapsedTime(displayElapsedSec)}</b>
                    </span>
                  </div>
                </div>

                {/* Formulario no intrusivo + Indicador de estado de sincronización */}
                <div className="w-full max-w-md bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-3.5 shadow-sm space-y-2.5 text-left shrink-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      Registro de Calificación
                    </span>

                    {syncStatus === 'submitting' && (
                      <span
                        role="status"
                        aria-live="polite"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Guardando calificación...
                      </span>
                    )}
                    {syncStatus === 'success' && (
                      <span
                        role="status"
                        aria-live="polite"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Calificación registrada en el sistema
                      </span>
                    )}
                    {syncStatus === 'error' && (
                      <span
                        role="alert"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-300"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Error de conexión: reintentar
                      </span>
                    )}
                  </div>

                  {syncStatus === 'success' ? (
                    <div className="rounded-xl bg-emerald-50/75 border border-emerald-200 px-3 py-2.5 text-xs text-emerald-900 space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Calificación registrada en el sistema
                      </p>
                      <p className="text-[11px] text-emerald-800/90 tabular-nums">
                        Estudiante: <b>{submittedRecord?.studentName}</b>
                        {submittedRecord?.studentId && submittedRecord.studentId !== 'N/A'
                          ? ` (${submittedRecord.studentId})`
                          : ''}{' '}
                        · {displayScore}/{MAX_SCORE} pts ({formatElapsedTime(displayElapsedSec)})
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitGrade} className="space-y-2.5" noValidate>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label
                            htmlFor="challenge-student-name"
                            className="block text-[11px] font-semibold text-slate-600 mb-1"
                          >
                            Nombre completo <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="challenge-student-name"
                            type="text"
                            required
                            disabled={syncStatus === 'submitting'}
                            value={studentName}
                            onChange={(e) => {
                              setStudentName(e.target.value);
                              if (formError) setFormError('');
                            }}
                            placeholder="Ej. Ana María López"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 transition"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="challenge-student-id"
                            className="block text-[11px] font-semibold text-slate-600 mb-1"
                          >
                            Código / ID{' '}
                            <span className="text-slate-400 font-normal">(opcional)</span>
                          </label>
                          <input
                            id="challenge-student-id"
                            type="text"
                            disabled={syncStatus === 'submitting'}
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            placeholder="Ej. 20241045"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 transition"
                          />
                        </div>
                      </div>

                      {formError && (
                        <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          {formError}
                        </p>
                      )}

                      {syncStatus === 'error' && syncMessage && (
                        <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 leading-snug">
                          {syncMessage}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={syncStatus === 'submitting'}
                        className={`w-full py-2 px-3.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] transform-gpu cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed ${
                          syncStatus === 'error'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {syncStatus === 'submitting' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Guardando calificación...
                          </>
                        ) : syncStatus === 'error' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reintentar envío
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Registrar calificación
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetGame}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs shadow-sm transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer"
                  >
                    Reiniciar partida
                  </button>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (document.fullscreenElement) {
                          document.exitFullscreen().catch(() => {});
                        }
                        onNavigate('simulator');
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer"
                    >
                      Probar en el Simulador 3D
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </section>
        </div>

        {/* Overlay flotante con físicas de resorte al arrastrar */}
        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {activeCard ? (
            <motion.div
              initial={{ scale: 1, rotate: 0 }}
              animate={{ scale: 1.05, rotate: dragTilt }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className="bg-white rounded-xl border-2 border-amber-400 ring-4 ring-amber-300/40 shadow-lg p-3 min-h-[120px] flex flex-col justify-between cursor-grabbing w-72 transform-gpu will-change-transform"
            >
              <CardInnerContent card={activeCard} />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
});

export default CardDuel;
