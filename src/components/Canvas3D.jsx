import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  computeSolidBounds,
  createElementGeometry,
  createSlicesGeometry,
  createSolidGeometry,
  createSweepCaps,
} from '../math/geometryGenerator';
import { computeRiemannSlices } from '../math/calculusEngine';
import { Rotate3D, Compass, Camera } from 'lucide-react';
import { GLASS } from './GlassCard';

const COLORS = {
  solid: '#3b82f6', // blue-500
  cap: '#1d4ed8', // blue-700
  slice: '#60a5fa', // blue-400
  element: '#fbbf24', // amber-400 (arandela / capa cilíndrica dx en amarillo/ámbar intenso)
  axis: '#e11d48',
};

const CAMERA_CONFIG = { position: [6, 4.5, 7.5], fov: 45 };
const GL_CONFIG = { antialias: true, alpha: true, preserveDrawingBuffer: true };

/**
 * Libera la memoria de la geometría y del material de una malla Three.js
 * cuando se regenera la geometría o se desmonta el componente.
 */
function useDisposableMesh(geometry, materialRef) {
  useEffect(() => {
    const material = materialRef?.current;
    return () => {
      if (geometry) {
        geometry.dispose();
      }
      if (material) {
        if (Array.isArray(material)) {
          material.forEach((m) => m?.dispose?.());
        } else {
          material.dispose?.();
        }
      }
    };
  }, [geometry, materialRef]);

  return geometry;
}

/** Sólido completo (con hueco interior si hay g(x) o el eje no toca la región). */
const RevolutionSolid = memo(function RevolutionSolid({
  f,
  g,
  a,
  b,
  axis,
  axisOffset,
  angleRad,
  wireframe,
  opacity,
  ghost,
}) {
  const solidMaterialRef = useRef(null);
  const capsMaterialRef = useRef(null);

  const solid = useDisposableMesh(
    useMemo(
      () => createSolidGeometry({ f, g, a, b, axis, axisOffset, angle: angleRad }),
      [f, g, a, b, axis, axisOffset, angleRad]
    ),
    solidMaterialRef
  );

  const caps = useDisposableMesh(
    useMemo(
      () => createSweepCaps({ f, g, a, b, axis, axisOffset, angle: angleRad }),
      [f, g, a, b, axis, axisOffset, angleRad]
    ),
    capsMaterialRef
  );

  const alpha = ghost ? Math.min(opacity, 0.16) : opacity;
  const transparent = alpha < 0.99;

  return (
    <group>
      {solid && (
        <mesh geometry={solid} renderOrder={2}>
          <meshPhysicalMaterial
            ref={solidMaterialRef}
            color={COLORS.solid}
            roughness={0.3}
            metalness={0.1}
            clearcoat={0.3}
            opacity={alpha}
            transparent={transparent}
            depthWrite={!transparent}
            wireframe={wireframe}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {caps && (
        <mesh geometry={caps} renderOrder={2}>
          <meshStandardMaterial
            ref={capsMaterialRef}
            color={COLORS.cap}
            roughness={0.45}
            opacity={Math.min(1, alpha + 0.1)}
            transparent
            depthWrite={false}
            wireframe={wireframe}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
});

/** Suma de Riemann: N arandelas / capas fusionadas en una sola malla. */
const RiemannSlices = memo(function RiemannSlices({
  f,
  g,
  a,
  b,
  axis,
  axisOffset,
  count,
  riemannMode = 'left',
  angleRad,
  selectedIndex,
  wireframe,
}) {
  const sliceMaterialRef = useRef(null);

  const slices = useMemo(
    () => computeRiemannSlices({ f, g, a, b, axis, axisOffset, count, mode: riemannMode }),
    [f, g, a, b, axis, axisOffset, count, riemannMode]
  );

  const geometry = useDisposableMesh(
    useMemo(
      () =>
        createSlicesGeometry({
          slices,
          f,
          g,
          axis,
          axisOffset,
          angle: angleRad,
          excludeIndex: selectedIndex,
        }),
      [slices, f, g, axis, axisOffset, angleRad, selectedIndex]
    ),
    sliceMaterialRef
  );

  return geometry ? (
    <mesh geometry={geometry} renderOrder={1}>
      <meshStandardMaterial
        ref={sliceMaterialRef}
        color={COLORS.slice}
        roughness={0.35}
        opacity={0.55}
        transparent
        depthWrite={false}
        wireframe={wireframe}
        side={THREE.DoubleSide}
      />
    </mesh>
  ) : null;
});

/** Elemento diferencial sincronizado con el rectángulo del plano 2D (con offset anti z-fighting). */
const DifferentialElement = memo(function DifferentialElement({
  f,
  g,
  xc,
  xSample = xc,
  dx,
  axis,
  axisOffset,
  angleRad,
  radialExpand = 0.004,
}) {
  const elementMaterialRef = useRef(null);

  const geometry = useDisposableMesh(
    useMemo(
      () =>
        createElementGeometry({
          f,
          g,
          xc,
          xSample,
          dx,
          axis,
          axisOffset,
          angle: angleRad,
          radialExpand,
        }),
      [f, g, xc, xSample, dx, axis, axisOffset, angleRad, radialExpand]
    ),
    elementMaterialRef
  );

  return geometry ? (
    <mesh geometry={geometry} renderOrder={3}>
      <meshStandardMaterial
        ref={elementMaterialRef}
        color={COLORS.element}
        emissive="#f59e0b"
        emissiveIntensity={0.5}
        roughness={0.25}
        opacity={0.94}
        transparent
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
        side={THREE.DoubleSide}
      />
    </mesh>
  ) : null;
});

/** Eje de revolución (línea brillante). */
const AxisLine = memo(function AxisLine({ axis, axisOffset, bounds }) {
  const points = useMemo(() => {
    const { center, size } = bounds;
    const pad = Math.max(...size) * 0.25;

    return axis === 'x'
      ? [
          [center[0] - size[0] / 2 - pad, axisOffset, 0],
          [center[0] + size[0] / 2 + pad, axisOffset, 0],
        ]
      : [
          [axisOffset, center[1] - size[1] / 2 - pad, 0],
          [axisOffset, center[1] + size[1] / 2 + pad, 0],
        ];
  }, [axis, axisOffset, bounds]);

  return <Line points={points} color={COLORS.axis} lineWidth={2.5} />;
});

const DEFAULT_ELEMENT_3D = { xc: 0, xSample: 0, dx: 0.1, index: 0 };

const Scene = memo(function Scene({
  f,
  g,
  a = 0,
  b = 4,
  axis = 'x',
  axisOffset = 0,
  angleDeg = 360,
  slicesCount = 20,
  element = DEFAULT_ELEMENT_3D,
  showElement = true,
  showRiemann = false,
  riemannMode = 'left',
  sampleMode,
  wireframe = false,
  opacity = 0.55,
}) {
  const resolvedMode = sampleMode ?? riemannMode ?? 'left';
  const safeElement = element ?? DEFAULT_ELEMENT_3D;
  const angleRad = (angleDeg * Math.PI) / 180;
  const bounds = useMemo(
    () => computeSolidBounds({ f, g, a, b, axis, axisOffset }),
    [f, g, a, b, axis, axisOffset]
  );

  // Normaliza el tamaño del sólido para que siempre quepa en la vista (memoizado)
  const { scale, position, floorY } = useMemo(() => {
    const extent = Math.max(...bounds.size, 1e-3);
    const sc = Math.min(20, Math.max(0.02, 5 / extent));
    const pos = bounds.center.map((c) => -c * sc);
    const flY = -(bounds.size[1] / 2) * sc - 0.02;
    return { scale: sc, position: pos, floorY: flY };
  }, [bounds]);

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[10, 15, 10]} intensity={1.3} />
      <directionalLight position={[-10, -10, -5]} intensity={0.45} color="#93c5fd" />
      <pointLight position={[0, 8, 0]} intensity={0.5} />

      <Grid
        position={[0, floorY, 0]}
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#cbd5e1"
        sectionSize={2}
        sectionThickness={1.2}
        sectionColor="#94a3b8"
        fadeDistance={25}
        fadeStrength={1}
      />

      <group position={position} scale={scale}>
        <RevolutionSolid
          f={f}
          g={g}
          a={a}
          b={b}
          axis={axis}
          axisOffset={axisOffset}
          angleRad={angleRad}
          wireframe={wireframe}
          opacity={opacity}
          ghost={showRiemann}
        />

        {showRiemann && (
          <RiemannSlices
            f={f}
            g={g}
            a={a}
            b={b}
            axis={axis}
            axisOffset={axisOffset}
            count={slicesCount}
            riemannMode={resolvedMode}
            angleRad={angleRad}
            selectedIndex={safeElement.index}
            wireframe={wireframe}
          />
        )}

        {(showElement || showRiemann) && (
          <DifferentialElement
            f={f}
            g={g}
            xc={safeElement.xc}
            xSample={safeElement.xSample ?? safeElement.xc}
            dx={safeElement.dx}
            axis={axis}
            axisOffset={axisOffset}
            angleRad={angleRad}
            radialExpand={showRiemann ? 0.005 : 0.002}
          />
        )}

        <AxisLine axis={axis} axisOffset={axisOffset} bounds={bounds} />
      </group>
    </>
  );
});

const Canvas3D = memo(function Canvas3D(props) {
  const controlsRef = useRef(null);
  const r3fRef = useRef(null);
  const { axis = 'x', element = DEFAULT_ELEMENT_3D, showElement = true, showRiemann = false } = props;
  const safeElement = element ?? DEFAULT_ELEMENT_3D;
  const elementLabel = axis === 'x' ? 'Arandela dx' : 'Capa cilíndrica dx';

  // Limpieza global de escena y listas de renderizado al desmontar el visor 3D
  useEffect(() => {
    return () => {
      const ctx = r3fRef.current;
      if (!ctx) return;
      ctx.scene?.traverse((obj) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m?.dispose?.());
          } else {
            obj.material.dispose?.();
          }
        }
      });
      ctx.gl?.renderLists?.dispose?.();
    };
  }, []);

  const handleExportPng = useCallback(() => {
    const ctx = r3fRef.current;
    if (!ctx) return;
    const { gl, scene, camera } = ctx;
    gl.render(scene, camera);

    // El visor es transparente: se compone sobre un fondo claro limpio para una captura nítida
    const src = gl.domElement;
    const out = document.createElement('canvas');
    out.width = src.width;
    out.height = src.height;
    const c2d = out.getContext('2d');
    c2d.fillStyle = '#f8fafc';
    c2d.fillRect(0, 0, out.width, out.height);
    c2d.drawImage(src, 0, 0);

    const dataUrl = out.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `solido-revolucion-3d-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleResetCamera = useCallback(() => {
    controlsRef.current?.reset();
  }, []);

  const handleCreated = useCallback((state) => {
    r3fRef.current = state;
    state.gl.setClearColor(0x000000, 0);
  }, []);

  return (
    <div className={`${GLASS} relative w-full h-full overflow-hidden`}>
      {/* 3D Header Badge */}
      <div className="absolute top-2.5 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shadow-sm flex items-center gap-1.5">
          <Rotate3D className="w-3.5 h-3.5 text-blue-600" /> Visor WebGL 3D
        </span>
      </div>

      {/* Top-right Action Buttons: Export PNG & Camera Reset */}
      <div className="absolute top-2.5 right-3 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleExportPng}
          className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer"
          title="Exportar captura limpia del visor 3D en formato PNG"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden sm:inline">Exportar captura PNG</span>
        </button>
        <button
          type="button"
          onClick={handleResetCamera}
          className="px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-blue-50 text-slate-700 border border-slate-200 text-xs shadow-sm flex items-center gap-1 transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer"
          title="Restablecer posición de cámara"
        >
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[11px] font-medium hidden sm:inline">Centrar</span>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2.5 left-3 z-10 flex flex-wrap items-center gap-3 pointer-events-none text-[10px] font-medium text-slate-700 px-2.5 py-1 rounded-lg bg-white/85 border border-slate-200/80 shadow-sm">
        <span className="flex items-center gap-1">
          <i className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.solid }} /> Sólido
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block w-2.5 h-0.5" style={{ background: COLORS.axis }} /> Eje de giro
        </span>
        {(showElement || showRiemann) && (
          <span className="flex items-center gap-1 tabular-nums">
            <i className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.element }} />
            {elementLabel} · x = {Number(safeElement.xSample ?? safeElement.xc ?? 0).toFixed(2)}
          </span>
        )}
      </div>

      <Canvas
        camera={CAMERA_CONFIG}
        gl={GL_CONFIG}
        onCreated={handleCreated}
      >
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={1.5}
          maxDistance={40}
        />
        <Scene {...props} />
      </Canvas>
    </div>
  );
});

export default Canvas3D;
