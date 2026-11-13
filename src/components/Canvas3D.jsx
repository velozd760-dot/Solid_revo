import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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

const DEFAULT_CAMERA_POSITION = [6, 4.5, 7.5];
const DEFAULT_CAMERA_TARGET = [0, 0, 0];
const DEFAULT_CAMERA_ZOOM = 1;
const DEFAULT_CAMERA_CONFIG = {
  position: DEFAULT_CAMERA_POSITION,
  fov: 45,
  zoom: DEFAULT_CAMERA_ZOOM,
};

const ANIM_CAMERA_2D_POSITION = new THREE.Vector3(0, 0, 10);
const ANIM_CAMERA_3D_POSITION = new THREE.Vector3(...DEFAULT_CAMERA_POSITION);
const ANIM_CAMERA_TARGET = new THREE.Vector3(...DEFAULT_CAMERA_TARGET);
const ANIM_PHASE1_CAMERA_DURATION = 1.2;
const ANIM_PHASE2_SWEEP_DURATION = 2.2;
const ANIM_MIN_SAFE_ANGLE_RAD = 0.01;

function easeInOutCubic(t) {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

/**
 * Detecta viewport móvil/estrecho mediante media query para aplicar optimizaciones
 * de renderizado WebGL sin alterar el comportamiento de escritorio.
 */
function useIsMobileViewport(query = MOBILE_MEDIA_QUERY) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mql = window.matchMedia(query);
    const onChange = (event) => setIsMobile(event.matches);

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query]);

  return isMobile;
}

const GL_CONFIG = {
  powerPreference: 'low-power',
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
};

const LOD_HIGH = Object.freeze({
  solidXSegments: 64,
  solidThetaSegments: 72,
  capsXSegments: 48,
  elementThetaSegments: 56,
  slicesThetaSegments: 32,
});

const LOD_DRAFT = Object.freeze({
  solidXSegments: 24,
  solidThetaSegments: 24,
  capsXSegments: 16,
  elementThetaSegments: 20,
  slicesThetaSegments: 14,
});

/**
 * Libera estrictamente la geometría anterior en GPU cada vez que se recalcula
 * la malla o al desmontar. El material (y su shader GLSL compilado) se conserva
 * vivo durante el arrastre de k y los cambios de eje, liberándose solo al desmontar.
 */
function useDisposableMesh(geometry, materialRef) {
  useEffect(() => {
    return () => {
      if (geometry) {
        geometry.dispose();
      }
    };
  }, [geometry]);

  useEffect(() => {
    const material = materialRef?.current;
    return () => {
      if (!material) return;
      if (Array.isArray(material)) {
        material.forEach((m) => m?.dispose?.());
      } else {
        material.dispose?.();
      }
    };
  }, [materialRef]);

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
  xSegments = LOD_HIGH.solidXSegments,
  thetaSegments = LOD_HIGH.solidThetaSegments,
  capsXSegments = LOD_HIGH.capsXSegments,
}) {
  const solidMaterialRef = useRef(null);
  const capsMaterialRef = useRef(null);

  const solid = useDisposableMesh(
    useMemo(
      () =>
        createSolidGeometry({
          f,
          g,
          a,
          b,
          axis,
          axisOffset,
          angle: angleRad,
          xSegments,
          thetaSegments,
        }),
      [f, g, a, b, axis, axisOffset, angleRad, xSegments, thetaSegments]
    ),
    solidMaterialRef
  );

  const caps = useDisposableMesh(
    useMemo(
      () =>
        createSweepCaps({
          f,
          g,
          a,
          b,
          axis,
          axisOffset,
          angle: angleRad,
          xSegments: capsXSegments,
        }),
      [f, g, a, b, axis, axisOffset, angleRad, capsXSegments]
    ),
    capsMaterialRef
  );

  const alpha = ghost ? Math.min(opacity, 0.16) : opacity;
  const transparent = alpha < 0.99;

  useEffect(() => {
    const mat = solidMaterialRef.current;
    if (mat) {
      mat.needsUpdate = true;
    }
  }, [transparent]);

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
  precomputedSlices,
  angleRad,
  selectedIndex,
  wireframe,
  thetaSegments = LOD_HIGH.slicesThetaSegments,
}) {
  const sliceMaterialRef = useRef(null);

  const slices = useMemo(
    () =>
      precomputedSlices ??
      computeRiemannSlices({ f, g, a, b, axis, axisOffset, count, mode: riemannMode }),
    [precomputedSlices, f, g, a, b, axis, axisOffset, count, riemannMode]
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
          thetaSegments,
        }),
      [slices, f, g, axis, axisOffset, angleRad, selectedIndex, thetaSegments]
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
  thetaSegments = LOD_HIGH.elementThetaSegments,
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
          thetaSegments,
          radialExpand,
        }),
      [f, g, xc, xSample, dx, axis, axisOffset, angleRad, thetaSegments, radialExpand]
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

/**
 * Persistencia y transición suave de la cámara 3D sin bucles useFrame en reposo.
 * - Restaura position, target y zoom desde cameraStateRef al montar OrbitControls.
 * - Guarda las coordenadas actuales al desmontar o cuando cambia OrbitControls.
 * - Ejecuta la transición suave (cubic-out) hacia la cámara por defecto SOLO con "Centrar" o reset explícito.
 */
const CameraRig = memo(function CameraRig({
  controlsRef,
  cameraStateRef,
  cameraResetNonce = 0,
  canRender,
  smoothResetFnRef,
  cancelResetFnRef,
  isRestoringRef,
}) {
  const getThree = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);
  const canRenderRef = useRef(canRender);
  const resetRafRef = useRef(0);
  const prevResetNonceRef = useRef(cameraResetNonce);

  const syncCameraToRef = useCallback(
    (controls) => {
      if (!cameraStateRef) return;
      const { camera } = getThree();
      if (!camera) return;
      const targetVec = controls?.target;
      cameraStateRef.current = {
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: targetVec
          ? [targetVec.x, targetVec.y, targetVec.z]
          : [...DEFAULT_CAMERA_TARGET],
        zoom: camera.zoom,
      };
    },
    [getThree, cameraStateRef]
  );

  const cancelSmoothReset = useCallback(() => {
    if (resetRafRef.current) {
      cancelAnimationFrame(resetRafRef.current);
      resetRafRef.current = 0;
    }
  }, []);

  useEffect(() => {
    canRenderRef.current = canRender;
    if (!canRender) {
      cancelSmoothReset();
    }
  }, [canRender, cancelSmoothReset]);

  useLayoutEffect(() => {
    const { camera } = getThree();
    const controls = controlsRef.current;
    const saved = cameraStateRef?.current;

    if (camera) {
      isRestoringRef.current = true;
      if (saved) {
        const [px, py, pz] = saved.position ?? DEFAULT_CAMERA_POSITION;
        const [tx, ty, tz] = saved.target ?? DEFAULT_CAMERA_TARGET;
        const zoom =
          Number.isFinite(saved.zoom) && saved.zoom > 0 ? saved.zoom : DEFAULT_CAMERA_ZOOM;

        camera.position.set(px, py, pz);
        camera.zoom = zoom;
        camera.updateProjectionMatrix();

        if (controls) {
          const prevDamping = controls.enableDamping;
          controls.enableDamping = false;
          controls.target.set(tx, ty, tz);
          controls.update();
          controls.enableDamping = prevDamping;
        }
      } else if (controls) {
        controls.update();
      }
      isRestoringRef.current = false;
    }

    if (canRenderRef.current) {
      invalidate();
    }

    return () => {
      cancelSmoothReset();
      syncCameraToRef(controls);
    };
  }, [getThree, controlsRef, cameraStateRef, invalidate, syncCameraToRef, cancelSmoothReset, isRestoringRef]);

  const startSmoothReset = useCallback(() => {
    cancelSmoothReset();

    const { camera } = getThree();
    if (!camera) return;

    const controls = controlsRef.current;
    const endPos = new THREE.Vector3(...DEFAULT_CAMERA_POSITION);
    const endTarget = new THREE.Vector3(...DEFAULT_CAMERA_TARGET);
    const endZoom = DEFAULT_CAMERA_ZOOM;

    const startPos = camera.position.clone();
    const startTarget = controls
      ? controls.target.clone()
      : new THREE.Vector3(...DEFAULT_CAMERA_TARGET);
    const startZoom = camera.zoom;

    const applySnap = () => {
      const liveControls = controlsRef.current ?? controls;
      isRestoringRef.current = true;
      camera.position.copy(endPos);
      camera.zoom = endZoom;
      camera.updateProjectionMatrix();
      if (liveControls) {
        const prevDamping = liveControls.enableDamping;
        liveControls.enableDamping = false;
        liveControls.target.copy(endTarget);
        liveControls.update();
        liveControls.enableDamping = prevDamping;
      }
      isRestoringRef.current = false;
      syncCameraToRef(liveControls);
      if (canRenderRef.current) {
        invalidate();
      }
    };

    const posDist = startPos.distanceTo(endPos);
    const targetDist = startTarget.distanceTo(endTarget);
    const zoomDiff = Math.abs(startZoom - endZoom);

    if (!canRenderRef.current || (posDist < 1e-3 && targetDist < 1e-3 && zoomDiff < 1e-3)) {
      applySnap();
      return;
    }

    const durationMs = 380;
    const startTime = performance.now();

    const step = (now) => {
      if (!canRenderRef.current) {
        resetRafRef.current = 0;
        applySnap();
        return;
      }

      const t = Math.min(1, (now - startTime) / durationMs);
      const ease = 1 - Math.pow(1 - t, 3);
      const liveControls = controlsRef.current ?? controls;

      isRestoringRef.current = true;
      camera.position.lerpVectors(startPos, endPos, ease);
      camera.zoom = THREE.MathUtils.lerp(startZoom, endZoom, ease);
      camera.updateProjectionMatrix();

      if (liveControls) {
        const prevDamping = liveControls.enableDamping;
        liveControls.enableDamping = false;
        liveControls.target.lerpVectors(startTarget, endTarget, ease);
        liveControls.update();
        liveControls.enableDamping = prevDamping;
      }
      isRestoringRef.current = false;

      syncCameraToRef(liveControls);
      invalidate();

      if (t < 1) {
        resetRafRef.current = requestAnimationFrame(step);
      } else {
        resetRafRef.current = 0;
      }
    };

    resetRafRef.current = requestAnimationFrame(step);
  }, [getThree, controlsRef, invalidate, syncCameraToRef, cancelSmoothReset, isRestoringRef]);

  useEffect(() => {
    if (smoothResetFnRef) smoothResetFnRef.current = startSmoothReset;
    if (cancelResetFnRef) cancelResetFnRef.current = cancelSmoothReset;
    return () => {
      if (smoothResetFnRef) smoothResetFnRef.current = null;
      if (cancelResetFnRef) cancelResetFnRef.current = null;
    };
  }, [smoothResetFnRef, cancelResetFnRef, startSmoothReset, cancelSmoothReset]);

  useEffect(() => {
    if (cameraResetNonce !== prevResetNonceRef.current) {
      prevResetNonceRef.current = cameraResetNonce;
      startSmoothReset();
    }
  }, [cameraResetNonce, startSmoothReset]);

  return null;
});

/**
 * Orquestador de la animación guiada 2D -> 3D + barrido angular 0° -> 360° en dos fases.
 */
const RevolutionAnimator = memo(function RevolutionAnimator({
  isAnimatingPreset = false,
  animationTrigger = 0,
  endRevolutionAnimation,
  controlsRef,
  cameraStateRef,
  isRestoringRef,
  cancelResetFnRef,
  canRender = true,
  onSequenceActiveChange,
  onAnimatedAngleChange,
  onStopPlaying,
}) {
  const getThree = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);

  const animRef = useRef({
    active: false,
    elapsed: 0,
    firstFrameRendered: false,
    phase2Started: false,
    lastTickMs: 0,
    lastTrigger: 0,
  });

  const applyCameraPose = useCallback(
    (posVec, targetVec, { enableControls, updateStateRef = false } = {}) => {
      const { camera } = getThree();
      const controls = controlsRef.current;
      if (!camera) return;

      isRestoringRef.current = true;
      camera.position.copy(posVec);
      camera.up.set(0, 1, 0);
      camera.zoom = DEFAULT_CAMERA_ZOOM;
      camera.updateProjectionMatrix();
      camera.lookAt(targetVec);

      if (controls) {
        const prevDamping = controls.enableDamping;
        controls.enableDamping = false;
        controls.target.copy(targetVec);
        controls.update();
        controls.enableDamping = prevDamping;
        if (typeof enableControls === 'boolean') {
          controls.enabled = enableControls;
        }
      }
      isRestoringRef.current = false;

      if (updateStateRef && cameraStateRef) {
        cameraStateRef.current = {
          position: [posVec.x, posVec.y, posVec.z],
          target: [targetVec.x, targetVec.y, targetVec.z],
          zoom: DEFAULT_CAMERA_ZOOM,
        };
      }
    },
    [getThree, controlsRef, cameraStateRef, isRestoringRef]
  );

  useEffect(() => {
    if (!isAnimatingPreset) {
      if (animRef.current.active) {
        animRef.current.active = false;
        if (controlsRef.current) {
          controlsRef.current.enabled = Boolean(canRender);
        }
        onSequenceActiveChange?.(false);
        onAnimatedAngleChange?.(null);
      }
      return;
    }

    if (animationTrigger <= 0 || animationTrigger === animRef.current.lastTrigger) {
      return;
    }

    animRef.current = {
      active: true,
      elapsed: 0,
      firstFrameRendered: false,
      phase2Started: false,
      lastTickMs: 0,
      lastTrigger: animationTrigger,
    };

    cancelResetFnRef?.current?.();
    onStopPlaying?.();
    onSequenceActiveChange?.(true);
    onAnimatedAngleChange?.(0);
    applyCameraPose(ANIM_CAMERA_2D_POSITION, ANIM_CAMERA_TARGET, {
      enableControls: false,
      updateStateRef: true,
    });

    if (canRender) {
      invalidate();
    }
  }, [
    isAnimatingPreset,
    animationTrigger,
    canRender,
    controlsRef,
    cancelResetFnRef,
    onStopPlaying,
    onSequenceActiveChange,
    onAnimatedAngleChange,
    applyCameraPose,
    invalidate,
  ]);

  useFrame((state) => {
    const anim = animRef.current;
    if (!anim.active || !isAnimatingPreset) return;

    const { camera } = state;
    const controls = controlsRef.current;

    // Frame inicial (t = 0s): mantiene vista plana 2D perpendicular al XY antes de avanzar
    if (!anim.firstFrameRendered) {
      anim.firstFrameRendered = true;
      anim.lastTickMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
      applyCameraPose(ANIM_CAMERA_2D_POSITION, ANIM_CAMERA_TARGET, {
        enableControls: false,
      });
      return;
    }

    // Reloj real acotado a 0.2s por frame: evita cámara lenta bajo FPS reducidos y saltos tras pausas
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const dt = Math.min(Math.max((now - anim.lastTickMs) / 1000, 0), 0.2);
    anim.lastTickMs = now;
    anim.elapsed += dt;

    if (anim.elapsed < ANIM_PHASE1_CAMERA_DURATION) {
      // Fase 1 (0s - 1.2s): transición suave de cámara 2D -> perspectiva 3D predeterminada
      const t1 = easeInOutCubic(anim.elapsed / ANIM_PHASE1_CAMERA_DURATION);
      isRestoringRef.current = true;
      camera.position.lerpVectors(ANIM_CAMERA_2D_POSITION, ANIM_CAMERA_3D_POSITION, t1);
      camera.lookAt(ANIM_CAMERA_TARGET);
      if (controls) {
        controls.target.copy(ANIM_CAMERA_TARGET);
        controls.enabled = false;
      }
      isRestoringRef.current = false;
      return;
    }

    if (!anim.phase2Started) {
      anim.phase2Started = true;
      applyCameraPose(ANIM_CAMERA_3D_POSITION, ANIM_CAMERA_TARGET, {
        enableControls: false,
      });
    }

    const sweepElapsed = anim.elapsed - ANIM_PHASE1_CAMERA_DURATION;
    const rawT2 = Math.min(1, sweepElapsed / ANIM_PHASE2_SWEEP_DURATION);

    if (rawT2 < 1) {
      // Fase 2 (1.2s - 3.4s): barrido progresivo 0° -> 360° en LOD borrador (24x24)
      const nextAngleDeg = easeInOutCubic(rawT2) * 360;
      onAnimatedAngleChange?.(nextAngleDeg);
      return;
    }

    // Finalización: estabiliza cámara, restaura LOD alto (64x72), reactiva OrbitControls y desbloquea UI
    anim.active = false;
    applyCameraPose(ANIM_CAMERA_3D_POSITION, ANIM_CAMERA_TARGET, {
      enableControls: Boolean(canRender),
      updateStateRef: true,
    });
    onAnimatedAngleChange?.(360, { commitOnly: true });
    onSequenceActiveChange?.(false);
    endRevolutionAnimation?.();
    invalidate();
  });

  return null;
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
  riemannSlices,
  sampleMode,
  wireframe = false,
  opacity = 0.55,
  canRender = true,
  isDraftLod = false,
  enforceMinSafeAngle = false,
}) {
  const invalidate = useThree((state) => state.invalidate);
  const resolvedMode = sampleMode ?? riemannMode ?? 'left';
  const safeElement = element ?? DEFAULT_ELEMENT_3D;
  const rawAngleRad = (angleDeg * Math.PI) / 180;
  const angleRad = enforceMinSafeAngle
    ? Math.max(ANIM_MIN_SAFE_ANGLE_RAD, rawAngleRad)
    : rawAngleRad;
  const lod = isDraftLod ? LOD_DRAFT : LOD_HIGH;
  const bounds = useMemo(
    () => computeSolidBounds({ f, g, a, b, axis, axisOffset }),
    [f, g, a, b, axis, axisOffset]
  );

  // Solicita un nuevo frame bajo demanda únicamente cuando el visor está visible/activo y cambian parámetros
  useEffect(() => {
    if (!canRender) return;
    invalidate();
  }, [
    canRender,
    invalidate,
    f,
    g,
    a,
    b,
    axis,
    axisOffset,
    angleRad,
    slicesCount,
    safeElement.xc,
    safeElement.xSample,
    safeElement.dx,
    safeElement.index,
    showElement,
    showRiemann,
    resolvedMode,
    wireframe,
    opacity,
    isDraftLod,
  ]);

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
          xSegments={lod.solidXSegments}
          thetaSegments={lod.solidThetaSegments}
          capsXSegments={lod.capsXSegments}
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
            precomputedSlices={riemannSlices}
            angleRad={angleRad}
            selectedIndex={safeElement.index}
            wireframe={wireframe}
            thetaSegments={lod.slicesThetaSegments}
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
            thetaSegments={lod.elementThetaSegments}
          />
        )}

        <AxisLine axis={axis} axisOffset={axisOffset} bounds={bounds} />
      </group>
    </>
  );
});

const Canvas3D = memo(function Canvas3D({
  f,
  g,
  a = 0,
  b = 4,
  axis = 'x',
  axisOffset = 0,
  angleDeg = 360,
  setAngleDeg,
  setIsPlaying,
  isAnimatingPreset = false,
  animationTrigger = 0,
  endRevolutionAnimation,
  slicesCount = 20,
  element = DEFAULT_ELEMENT_3D,
  showElement = true,
  showRiemann = false,
  riemannMode = 'left',
  riemannSlices,
  sampleMode,
  wireframe = false,
  opacity = 0.55,
  cameraStateRef,
  cameraResetNonce = 0,
  isVisible = true,
  isDraftLod = false,
}) {
  const controlsRef = useRef(null);
  const r3fRef = useRef(null);
  const smoothResetFnRef = useRef(null);
  const cancelResetFnRef = useRef(null);
  const isRestoringRef = useRef(false);
  const lastParentAngleSyncRef = useRef(0);
  const [isSequenceActive, setIsSequenceActive] = useState(false);
  const [localAngleDeg, setLocalAngleDeg] = useState(null);

  const [isDocVisible, setIsDocVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden
  );

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const handleVisibilityChange = () => {
      setIsDocVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const isMobile = useIsMobileViewport(MOBILE_MEDIA_QUERY);
  const [deviceDpr, setDeviceDpr] = useState(() =>
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncDpr = () => setDeviceDpr(window.devicePixelRatio || 1);
    window.addEventListener('resize', syncDpr);

    let mql = null;
    if (typeof window.matchMedia === 'function') {
      mql = window.matchMedia(`(resolution: ${deviceDpr}dppx)`);
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', syncDpr);
      }
    }

    return () => {
      window.removeEventListener('resize', syncDpr);
      if (mql && typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', syncDpr);
      }
    };
  }, [deviceDpr]);

  const dprRange = useMemo(
    () => [1, Math.max(1, Math.min(deviceDpr, 1.5))],
    [deviceDpr]
  );

  const canRender = Boolean(isVisible && isDocVisible);
  const canRenderRef = useRef(canRender);
  const effectiveAngleDeg = localAngleDeg ?? angleDeg;
  const effectiveDraftLod = Boolean(isMobile || isDraftLod || isSequenceActive);

  useEffect(() => {
    canRenderRef.current = canRender;
    if (canRender) {
      r3fRef.current?.invalidate?.();
    }
  }, [canRender]);

  const handleStopPlaying = useCallback(() => {
    setIsPlaying?.(false);
  }, [setIsPlaying]);

  const handleAnimatedAngleChange = useCallback(
    (deg, { commitOnly = false } = {}) => {
      if (commitOnly) {
        lastParentAngleSyncRef.current = 0;
        setLocalAngleDeg(null);
        if (typeof deg === 'number') {
          setAngleDeg?.(deg);
        }
        return;
      }

      setLocalAngleDeg(deg);
      if (typeof deg !== 'number') return;

      // Throttle de sincronización al árbol padre (~90ms) para evitar re-renders 60Hz en ControlsPanel/2D
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (deg <= 0.01 || now - lastParentAngleSyncRef.current >= 90) {
        lastParentAngleSyncRef.current = now;
        setAngleDeg?.(deg);
      }
    },
    [setAngleDeg]
  );

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
    if (isSequenceActive) return;
    smoothResetFnRef.current?.();
  }, [isSequenceActive]);

  const handleControlsStart = useCallback(() => {
    cancelResetFnRef.current?.();
  }, []);

  const handleControlsChange = useCallback(() => {
    if (isRestoringRef.current) return;

    const ctx = r3fRef.current;
    const controls = controlsRef.current;
    if (cameraStateRef && ctx?.camera) {
      const cam = ctx.camera;
      const target = controls?.target;
      cameraStateRef.current = {
        position: [cam.position.x, cam.position.y, cam.position.z],
        target: target
          ? [target.x, target.y, target.z]
          : [...DEFAULT_CAMERA_TARGET],
        zoom: cam.zoom,
      };
    }

    if (canRenderRef.current) {
      ctx?.invalidate?.();
    }
  }, [cameraStateRef]);

  const handleCreated = useCallback((state) => {
    r3fRef.current = state;
    state.gl.setClearColor(0x000000, 0);
    if (canRenderRef.current) {
      state.invalidate();
    }
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
        frameloop={canRender ? (isSequenceActive ? 'always' : 'demand') : 'never'}
        dpr={dprRange}
        camera={DEFAULT_CAMERA_CONFIG}
        gl={GL_CONFIG}
        onCreated={handleCreated}
      >
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled={canRender && !isSequenceActive}
          enableDamping={true}
          dampingFactor={isMobile ? 0.05 : 0.06}
          rotateSpeed={isMobile ? 0.65 : 1}
          zoomSpeed={isMobile ? 0.7 : 1}
          panSpeed={isMobile ? 0.75 : 1}
          minDistance={1.5}
          maxDistance={40}
          onStart={handleControlsStart}
          onChange={handleControlsChange}
        />
        <CameraRig
          controlsRef={controlsRef}
          cameraStateRef={cameraStateRef}
          cameraResetNonce={cameraResetNonce}
          canRender={canRender}
          smoothResetFnRef={smoothResetFnRef}
          cancelResetFnRef={cancelResetFnRef}
          isRestoringRef={isRestoringRef}
        />
        <RevolutionAnimator
          isAnimatingPreset={isAnimatingPreset}
          animationTrigger={animationTrigger}
          endRevolutionAnimation={endRevolutionAnimation}
          controlsRef={controlsRef}
          cameraStateRef={cameraStateRef}
          isRestoringRef={isRestoringRef}
          cancelResetFnRef={cancelResetFnRef}
          canRender={canRender}
          onSequenceActiveChange={setIsSequenceActive}
          onAnimatedAngleChange={handleAnimatedAngleChange}
          onStopPlaying={handleStopPlaying}
        />
        <Scene
          f={f}
          g={g}
          a={a}
          b={b}
          axis={axis}
          axisOffset={axisOffset}
          angleDeg={effectiveAngleDeg}
          slicesCount={slicesCount}
          element={safeElement}
          showElement={showElement}
          showRiemann={showRiemann}
          riemannMode={riemannMode}
          riemannSlices={riemannSlices}
          sampleMode={sampleMode}
          wireframe={wireframe}
          opacity={opacity}
          canRender={canRender}
          isDraftLod={effectiveDraftLod}
          enforceMinSafeAngle={isSequenceActive}
        />
      </Canvas>
    </div>
  );
});

export default Canvas3D;
