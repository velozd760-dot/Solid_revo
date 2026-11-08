import React, { memo } from 'react';
import ControlsPanel from '../components/ControlsPanel';
import Canvas2D from '../components/Canvas2D';
import Canvas3D from '../components/Canvas3D';
import IntegralLatex from '../components/IntegralLatex';

/**
 * Vista "Simulador": tarjetas blancas con bordes redondeados y sombras limpias
 * que muerden ligeramente el Hero oscuro superior gracias al -mt-8 del contenedor padre.
 */
const SimulatorView = memo(function SimulatorView({ sim }) {
  return (
    <div className="lg:h-[840px] flex flex-col lg:flex-row gap-5">
      {/* Panel lateral izquierdo: controles (ancho fijo estandarizado 360px a 380px) */}
      <div className="w-full lg:w-[370px] xl:w-[380px] shrink-0 h-full">
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
        />
      </div>

      {/* Área derecha: 2D arriba · 3D + fórmulas abajo */}
      <main className="flex-1 min-w-0 flex flex-col gap-5 h-full">
        <div className="h-[300px] lg:h-[42%] min-h-[250px]">
          <Canvas2D
            f={sim.f}
            g={sim.g}
            hasG={sim.useG && sim.gParsed.isValid}
            a={sim.a}
            b={sim.b}
            axis={sim.axis}
            axisOffset={sim.axisOffset}
            element={sim.element}
            showElement={sim.showElement}
            showRiemann={sim.showRiemann}
            riemannMode={sim.riemannMode}
            riemannSlices={sim.riemannSlices}
            slicesCount={sim.slicesCount}
            onElementMove={sim.moveElement}
          />
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-7 h-[380px] lg:h-full min-h-[300px]">
            <Canvas3D
              f={sim.f}
              g={sim.g}
              a={sim.a}
              b={sim.b}
              axis={sim.axis}
              axisOffset={sim.axisOffset}
              angleDeg={sim.angleDeg}
              slicesCount={sim.slicesCount}
              element={sim.element}
              showElement={sim.showElement}
              showRiemann={sim.showRiemann}
              riemannMode={sim.riemannMode}
              riemannSlices={sim.riemannSlices}
              wireframe={sim.wireframe}
              opacity={sim.opacity}
            />
          </div>

          <div className="xl:col-span-5 h-full min-h-[300px]">
            <IntegralLatex
              steps={sim.integralData.steps}
              hasG={sim.useG}
              fullVolume={sim.integralData.fullVolume}
              currentVolume={sim.currentVolume}
              angleFraction={sim.angleFraction}
              warning={sim.integralData.warning}
            />
          </div>
        </div>
      </main>
    </div>
  );
});

export default SimulatorView;
