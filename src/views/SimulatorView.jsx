import React, { memo } from 'react';
import ControlsPanel from '../components/ControlsPanel';
import Canvas2D from '../components/Canvas2D';
import Canvas3D from '../components/Canvas3D';
import IntegralLatex from '../components/IntegralLatex';
import { useSimulator } from '../hooks/useSimulator';

/**
 * Vista "Simulador" en Cockpit de Alta Densidad ("Todo en una sola toma" · 100vh Zero-Scroll):
 * - El estado vive localmente dentro del Cockpit (`useSimulator`): al salir a Inicio/Teoría/Desafíos
 *   el componente se desmonta y al volver a entrar se monta limpio con `DEFAULT_SIMULATOR_STATE`.
 * - Columna 1 (col-span-3): Panel de Control con scroll interno independiente
 * - Columna Central (col-span-6): Plano 2D (h-1/2) y Visor WebGL 3D (h-1/2) apilados verticalmente
 * - Columna Derecha (col-span-3): Desglose matemático paso a paso con scroll interno independiente
 */
const SimulatorView = memo(function SimulatorView({ isActive = true }) {
  const sim = useSimulator(isActive);

  return (
    <div className="w-full min-h-screen md:min-h-0 md:h-[calc(100vh-80px)] overflow-x-clip md:overflow-hidden p-4 flex flex-col md:grid md:grid-cols-12 gap-4">
      {/* 1. Panel de Control: arriba en móvil, col-span-3 con scroll interno en escritorio */}
      <div className="order-1 w-full md:col-span-12 lg:col-span-3 md:h-full md:max-h-full md:min-h-0 md:overflow-y-auto">
        <ControlsPanel
          expression={sim.expression}
          setExpression={sim.setExpression}
          useG={sim.useG}
          setUseG={sim.setUseG}
          gExpression={sim.gExpression}
          setGExpression={sim.setGExpression}
          aStr={sim.aStr}
          setAStr={sim.setAStr}
          bStr={sim.bStr}
          setBStr={sim.setBStr}
          boundsStatus={sim.boundsStatus}
          axis={sim.axis}
          setAxis={sim.setAxis}
          axisOffset={sim.axisOffset}
          setAxisOffset={sim.setAxisOffset}
          angleDeg={sim.angleDeg}
          setAngleDeg={sim.setAngleDeg}
          isPlaying={sim.isPlaying}
          setIsPlaying={sim.setIsPlaying}
          isAnimatingPreset={sim.isAnimatingPreset}
          startRevolutionAnimation={sim.startRevolutionAnimation}
          slicesCount={sim.slicesCount}
          setSlicesCount={sim.setSlicesCount}
          showRiemann={sim.showRiemann}
          setShowRiemann={sim.setShowRiemann}
          riemannMode={sim.riemannMode}
          setRiemannMode={sim.setRiemannMode}
          riemannStats={sim.riemannStats}
          showElement={sim.showElement}
          setShowElement={sim.setShowElement}
          xi={sim.element.xc}
          setXi={sim.moveElement}
          rangeA={sim.a}
          rangeB={sim.b}
          wireframe={sim.wireframe}
          setWireframe={sim.setWireframe}
          opacity={sim.opacity}
          setOpacity={sim.setOpacity}
          parserStatus={sim.fParsed}
          gStatus={sim.gParsed}
          activeTab={sim.panelTab}
          setActiveTab={sim.setPanelTab}
          preset={sim.preset}
          setPreset={sim.setPreset}
          cutAnglePref={sim.cutAnglePref}
          setCutAnglePref={sim.setCutAnglePref}
          onAxisDragChange={sim.setIsAdjustingAxis}
          onResetDefaults={sim.resetSimulatorState}
        />
      </div>

      {/* 2 & 3. Visores Cartesiano 2D y WebGL 3D:
          - En móvil (< md): se muestran directamente en el flujo vertical (Canvas2D orden 2, Canvas3D orden 3) con min-h-[300px] h-[320px]
          - En escritorio (>= md): apilados al 50% de altura cada uno en la columna central
      */}
      <div className="order-2 w-full min-h-[300px] h-[320px] md:hidden overflow-hidden">
        <Canvas2D
          f={sim.f}
          g={sim.g}
          hasG={sim.useG && sim.gParsed.isValid}
          a={sim.a}
          b={sim.b}
          axis={sim.deferredAxis}
          axisOffset={sim.deferredAxisOffset}
          element={sim.element}
          showElement={sim.showElement}
          showRiemann={sim.showRiemann}
          riemannMode={sim.riemannMode}
          riemannSlices={sim.riemannSlices}
          slicesCount={sim.slicesCount}
          onElementMove={sim.moveElement}
        />
      </div>

      <div className="order-3 w-full min-h-[300px] h-[320px] md:hidden overflow-hidden">
        <Canvas3D
          f={sim.f}
          g={sim.g}
          a={sim.a}
          b={sim.b}
          axis={sim.deferredAxis}
          axisOffset={sim.deferredAxisOffset}
          angleDeg={sim.angleDeg}
          setAngleDeg={sim.setAngleDeg}
          setIsPlaying={sim.setIsPlaying}
          isAnimatingPreset={sim.isAnimatingPreset}
          animationTrigger={sim.animationTrigger}
          endRevolutionAnimation={sim.endRevolutionAnimation}
          slicesCount={sim.slicesCount}
          element={sim.element}
          showElement={sim.showElement}
          showRiemann={sim.showRiemann}
          riemannMode={sim.riemannMode}
          riemannSlices={sim.riemannSlices}
          wireframe={sim.wireframe}
          opacity={sim.opacity}
          cameraStateRef={sim.cameraStateRef}
          cameraResetNonce={sim.cameraResetNonce}
          isVisible={isActive}
          isDraftLod={sim.isAdjustingAxis}
        />
      </div>

      {/* COLUMNA CENTRAL (escritorio >= md): Visores 2D y 3D apilados verticalmente (h-1/2 cada uno) */}
      <main className="hidden md:flex md:col-span-12 lg:col-span-5 xl:col-span-6 h-full max-h-full min-h-0 flex-col gap-4 overflow-hidden">
        <div className="h-1/2 min-h-0 w-full overflow-hidden">
          <Canvas2D
            f={sim.f}
            g={sim.g}
            hasG={sim.useG && sim.gParsed.isValid}
            a={sim.a}
            b={sim.b}
            axis={sim.deferredAxis}
            axisOffset={sim.deferredAxisOffset}
            element={sim.element}
            showElement={sim.showElement}
            showRiemann={sim.showRiemann}
            riemannMode={sim.riemannMode}
            riemannSlices={sim.riemannSlices}
            slicesCount={sim.slicesCount}
            onElementMove={sim.moveElement}
          />
        </div>

        <div className="h-1/2 min-h-0 w-full overflow-hidden">
          <Canvas3D
            f={sim.f}
            g={sim.g}
            a={sim.a}
            b={sim.b}
            axis={sim.deferredAxis}
            axisOffset={sim.deferredAxisOffset}
            angleDeg={sim.angleDeg}
            setAngleDeg={sim.setAngleDeg}
            setIsPlaying={sim.setIsPlaying}
            isAnimatingPreset={sim.isAnimatingPreset}
            animationTrigger={sim.animationTrigger}
            endRevolutionAnimation={sim.endRevolutionAnimation}
            slicesCount={sim.slicesCount}
            element={sim.element}
            showElement={sim.showElement}
            showRiemann={sim.showRiemann}
            riemannMode={sim.riemannMode}
            riemannSlices={sim.riemannSlices}
            wireframe={sim.wireframe}
            opacity={sim.opacity}
            cameraStateRef={sim.cameraStateRef}
            cameraResetNonce={sim.cameraResetNonce}
            isVisible={isActive}
            isDraftLod={sim.isAdjustingAxis}
          />
        </div>
      </main>

      {/* 4. Panel de Fórmulas y Paso a Paso: abajo en móvil (orden 4), col-span-3/4 con scroll interno en escritorio */}
      <aside className="order-4 w-full md:col-span-12 lg:col-span-4 xl:col-span-3 md:h-full md:max-h-full md:min-h-0 md:overflow-y-auto">
        <IntegralLatex
          steps={sim.integralData.steps}
          hasG={sim.useG}
          fullVolume={sim.integralData.fullVolume}
          currentVolume={sim.currentVolume}
          angleFraction={sim.angleFraction}
          warning={sim.integralData.warning}
        />
      </aside>
    </div>
  );
});

export default SimulatorView;
