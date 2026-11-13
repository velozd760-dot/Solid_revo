import React, { memo, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Calculator, LineChart } from 'lucide-react';
import ControlsPanel from '../components/ControlsPanel';
import Canvas2D from '../components/Canvas2D';
import Canvas3D from '../components/Canvas3D';
import IntegralLatex from '../components/IntegralLatex';
import MobileBottomSheet from '../components/MobileBottomSheet';
import { useSimulator } from '../hooks/useSimulator';
import { useViewportMetrics } from '../hooks/useViewport';

const MOBILE_STAGE_TABS = [
  { id: '3d', label: 'Visor 3D', icon: Box },
  { id: '2d', label: 'Plano 2D', icon: LineChart },
  { id: 'formulas', label: 'Fórmulas', icon: Calculator },
];

/**
 * Vista "Simulador" adaptativa:
 * - En móviles (< 768px): escenario principal a pantalla completa con selector segmentado
 *   (Visor 3D / Plano 2D / Fórmulas) + Bottom Sheet colapsable con Framer Motion.
 *   Mantiene un único árbol de Canvas3D/Canvas2D sin duplicar contextos WebGL.
 * - En escritorio (>= 768px): Cockpit de 3 columnas (100vh Zero-Scroll).
 */
const SimulatorView = memo(function SimulatorView({ isActive = true }) {
  const sim = useSimulator(isActive);
  const { isMobile, isPortrait } = useViewportMetrics();
  const [mobileStage, setMobileStage] = useState('3d');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleTogglePlay = useCallback(() => {
    if (!sim.isPlaying && sim.angleDeg >= 360) {
      sim.setAngleDeg(0);
    }
    sim.setIsPlaying((prev) => !prev);
  }, [sim]);

  const handleCloseSheet = useCallback(() => {
    setIsSheetOpen(false);
    setMobileStage('3d');
  }, []);

  const controlsProps = {
    expression: sim.expression,
    setExpression: sim.setExpression,
    useG: sim.useG,
    setUseG: sim.setUseG,
    gExpression: sim.gExpression,
    setGExpression: sim.setGExpression,
    aStr: sim.aStr,
    setAStr: sim.setAStr,
    bStr: sim.bStr,
    setBStr: sim.setBStr,
    boundsStatus: sim.boundsStatus,
    axis: sim.axis,
    setAxis: sim.setAxis,
    axisOffset: sim.axisOffset,
    setAxisOffset: sim.setAxisOffset,
    angleDeg: sim.angleDeg,
    setAngleDeg: sim.setAngleDeg,
    isPlaying: sim.isPlaying,
    setIsPlaying: sim.setIsPlaying,
    isAnimatingPreset: sim.isAnimatingPreset,
    startRevolutionAnimation: sim.startRevolutionAnimation,
    slicesCount: sim.slicesCount,
    setSlicesCount: sim.setSlicesCount,
    showRiemann: sim.showRiemann,
    setShowRiemann: sim.setShowRiemann,
    riemannMode: sim.riemannMode,
    setRiemannMode: sim.setRiemannMode,
    riemannStats: sim.riemannStats,
    showElement: sim.showElement,
    setShowElement: sim.setShowElement,
    xi: sim.element.xc,
    setXi: sim.moveElement,
    rangeA: sim.a,
    rangeB: sim.b,
    wireframe: sim.wireframe,
    setWireframe: sim.setWireframe,
    opacity: sim.opacity,
    setOpacity: sim.setOpacity,
    parserStatus: sim.fParsed,
    gStatus: sim.gParsed,
    activeTab: sim.panelTab,
    setActiveTab: sim.setPanelTab,
    preset: sim.preset,
    setPreset: sim.setPreset,
    cutAnglePref: sim.cutAnglePref,
    setCutAnglePref: sim.setCutAnglePref,
    onAxisDragChange: sim.setIsAdjustingAxis,
    onResetDefaults: sim.resetSimulatorState,
  };

  const canvas2DProps = {
    f: sim.f,
    g: sim.g,
    hasG: sim.useG && sim.gParsed.isValid,
    a: sim.a,
    b: sim.b,
    axis: sim.deferredAxis,
    axisOffset: sim.deferredAxisOffset,
    element: sim.element,
    showElement: sim.showElement,
    showRiemann: sim.showRiemann,
    riemannMode: sim.riemannMode,
    riemannSlices: sim.riemannSlices,
    slicesCount: sim.slicesCount,
    onElementMove: sim.moveElement,
  };

  const canvas3DProps = {
    f: sim.f,
    g: sim.g,
    a: sim.a,
    b: sim.b,
    axis: sim.deferredAxis,
    axisOffset: sim.deferredAxisOffset,
    angleDeg: sim.angleDeg,
    setAngleDeg: sim.setAngleDeg,
    setIsPlaying: sim.setIsPlaying,
    isAnimatingPreset: sim.isAnimatingPreset,
    animationTrigger: sim.animationTrigger,
    endRevolutionAnimation: sim.endRevolutionAnimation,
    slicesCount: sim.slicesCount,
    element: sim.element,
    showElement: sim.showElement,
    showRiemann: sim.showRiemann,
    riemannMode: sim.riemannMode,
    riemannSlices: sim.riemannSlices,
    wireframe: sim.wireframe,
    opacity: sim.opacity,
    cameraStateRef: sim.cameraStateRef,
    cameraResetNonce: sim.cameraResetNonce,
    isVisible: isActive && (!isMobile || mobileStage === '3d'),
    isDraftLod: sim.isAdjustingAxis,
  };

  const latexProps = {
    steps: sim.integralData.steps,
    hasG: sim.useG,
    fullVolume: sim.integralData.fullVolume,
    currentVolume: sim.currentVolume,
    angleFraction: sim.angleFraction,
    warning: sim.integralData.warning,
  };

  if (isMobile) {
    return (
      <div className="w-full h-[calc(100dvh-60px)] flex flex-col overflow-hidden px-2.5 pt-2 pb-[70px] gap-2">
        {/* Selector segmentado de escenario móvil (>= 44px de altura táctil) */}
        <div
          role="tablist"
          aria-label="Vistas del simulador"
          className="shrink-0 grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs"
        >
          {MOBILE_STAGE_TABS.map(({ id, label, icon: Icon }) => {
            const active = mobileStage === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMobileStage(id)}
                className={`min-h-[44px] px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Escenario activo: ocupa todo el viewport restante */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden">
          {/* En landscape móvil muy ancho, permite ver 2D y 3D lado a lado si está en modo 3D o 2D, o pantalla completa en portrait */}
          <div
            className={`w-full h-full ${
              !isPortrait && mobileStage !== 'formulas'
                ? 'grid grid-cols-2 gap-2'
                : 'block'
            }`}
          >
            {(mobileStage === '3d' || (!isPortrait && mobileStage !== 'formulas')) && (
              <div className="w-full h-full min-h-0 overflow-hidden">
                <Canvas3D {...canvas3DProps} />
              </div>
            )}

            {(mobileStage === '2d' || (!isPortrait && mobileStage !== 'formulas')) && (
              <div className="w-full h-full min-h-0 overflow-hidden">
                <Canvas2D {...canvas2DProps} />
              </div>
            )}

            <AnimatePresence mode="wait">
              {mobileStage === 'formulas' && (
                <motion.div
                  key="mobile-formulas"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                  className="w-full h-full min-h-0 overflow-y-auto overscroll-contain touch-pan-y"
                >
                  <IntegralLatex {...latexProps} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Sheet colapsable con controles táctiles */}
        <MobileBottomSheet
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          expression={sim.expression}
          angleDeg={sim.angleDeg}
          isPlaying={sim.isPlaying}
          onTogglePlay={handleTogglePlay}
        >
          <ControlsPanel {...controlsProps} isBottomSheet onCloseSheet={handleCloseSheet} />
        </MobileBottomSheet>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-76px)] overflow-hidden p-4 grid grid-cols-12 gap-4">
      {/* 1. Panel de Control: col-span-3 con scroll interno independiente */}
      <div className="col-span-4 lg:col-span-3 h-full max-h-full min-h-0 overflow-y-auto overscroll-contain">
        <ControlsPanel {...controlsProps} />
      </div>

      {/* 2 & 3. Visores Cartesiano 2D y WebGL 3D apilados verticalmente */}
      <main className="col-span-4 lg:col-span-5 xl:col-span-6 h-full max-h-full min-h-0 flex flex-col gap-4 overflow-hidden">
        <div className="h-1/2 min-h-0 w-full overflow-hidden">
          <Canvas2D {...canvas2DProps} />
        </div>

        <div className="h-1/2 min-h-0 w-full overflow-hidden">
          <Canvas3D {...canvas3DProps} />
        </div>
      </main>

      {/* 4. Panel de Fórmulas y Paso a Paso */}
      <aside className="col-span-4 lg:col-span-4 xl:col-span-3 h-full max-h-full min-h-0 overflow-hidden">
        <IntegralLatex {...latexProps} />
      </aside>
    </div>
  );
});

export default SimulatorView;
