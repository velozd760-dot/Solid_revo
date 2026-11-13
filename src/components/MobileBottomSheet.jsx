import React, { memo, useCallback, useEffect } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { Pause, Play, SlidersHorizontal, ChevronUp, X } from 'lucide-react';

/**
 * Contenedor móvil tipo Bottom Sheet colapsable con Framer Motion:
 * - En estado colapsado mantiene un dock compacto (<= 15% del viewport) en la zona del pulgar.
 * - Al expandirse despliega los controles completos con aislamiento de scroll (`overscroll-contain`)
 *   y un backdrop que protege el lienzo 3D de toques accidentales.
 */
const MobileBottomSheet = memo(function MobileBottomSheet({
  isOpen,
  onOpenChange,
  expression,
  angleDeg,
  isPlaying,
  onTogglePlay,
  children,
}) {
  const dragControls = useDragControls();

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleOpen = useCallback(() => {
    onOpenChange(true);
  }, [onOpenChange]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  const handleDragEnd = useCallback(
    (_, info) => {
      if (info.offset.y > 90 || info.velocity.y > 420) {
        handleClose();
      }
    },
    [handleClose]
  );

  return (
    <div>
      {/* Dock inferior persistente en estado colapsado (Thumb Zone) */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-8px_28px_rgba(15,23,42,0.09)] px-3 pt-2 pb-safe">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pausar giro angular' : 'Reproducir giro angular'}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 flex items-center justify-center shadow-sm shadow-amber-500/20 active:scale-[0.96] transition-transform cursor-pointer shrink-0"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          <button
            type="button"
            onClick={handleOpen}
            className="flex-1 min-w-0 min-h-[44px] px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between gap-2 text-left active:scale-[0.99] transition-transform cursor-pointer"
          >
            <div className="min-w-0">
              <span className="block text-[10px] font-semibold text-slate-500 leading-none mb-0.5">
                f(x) = <span className="font-mono text-blue-700">{expression || '…'}</span>
              </span>
              <span className="block text-xs font-bold text-slate-800 truncate tabular-nums">
                Giro: {Math.round(angleDeg)}° · Ajustar parámetros
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Controles</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Sheet expandido con Framer Motion */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="mobile-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
              aria-hidden="true"
              className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px] touch-none"
            />

            <motion.section
              key="mobile-sheet-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Panel de controles del simulador"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34, mass: 0.9 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.35 }}
              onDragEnd={handleDragEnd}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[84dvh] flex flex-col bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 overflow-hidden pb-safe"
            >
              {/* Barra de arrastre dedicada (no interfiere con sliders ni scroll interno) */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="shrink-0 pt-2.5 pb-1.5 px-4 flex items-center justify-between border-b border-slate-100 touch-none cursor-grab active:cursor-grabbing select-none bg-white"
              >
                <div className="w-11" aria-hidden="true" />
                <div className="flex flex-col items-center gap-1">
                  <span className="w-10 h-1.5 rounded-full bg-slate-300" />
                  <span className="text-[11px] font-semibold text-slate-500">
                    Desliza hacia abajo para cerrar
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Cerrar panel de controles"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido con scroll aislado del canvas 3D */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y">
                {children}
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MobileBottomSheet;
