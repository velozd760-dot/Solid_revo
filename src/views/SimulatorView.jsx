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
    <div className="h-[calc(100vh-80px)] w-full overflow-hidden p-4 grid grid-cols-12 gap-4">
      {/* COLUMNA 1: Panel de Control (col-span-3 en escritorio) con scroll interno */}
      <div className="col-span-12 lg:col-span-3 h-full max-h-full min-h-0 overflow-y-auto">
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

      {/* COLUMNA CENTRAL: Visores 2D y 3D apilados verticalmente (h-1/2 cada uno) */}
      <main className="col-span-12 lg:col-span-5 xl:col-span-6 h-full max-h-full min-h-0 flex flex-col gap-4 overflow-hidden">
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

      {/* COLUMNA DERECHA: Panel de Fórmulas y Paso a Paso con scroll interno */}
      <aside className="col-span-12 lg:col-span-4 xl:col-span-3 h-full max-h-full min-h-0 overflow-y-auto">
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
