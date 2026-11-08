/**
 * Geometry Generator for Solids of Revolution (Three.js)
 *
 * Toda la geometría se obtiene girando polilíneas del plano (x, y) alrededor del eje:
 *   axis = 'x' → eje horizontal y = k :  (x, y) → (x, k + r·cosθ, r·sinθ),  r = y − k
 *   axis = 'y' → eje vertical   x = c :  (x, y) → (c + r·cosθ, y, r·sinθ),  r = x − c
 *
 * Con la región acotada por f(x) y g(x) en [a, b], su frontera son 4 polilíneas
 * (curva f, curva g, segmento izquierdo x = a y segmento derecho x = b). Al girarlas
 * se obtiene el sólido con hueco interior (arandelas) o las paredes de las capas, de modo
 * que el sólido completo y el elemento diferencial comparten exactamente la misma
 * parametrización (R(x) exterior, r(x) interior).
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { evalAt, sectionAt } from './calculusEngine';

const TWO_PI = Math.PI * 2;

/** Gira un punto del plano (x, y) un ángulo theta alrededor del eje. */
export function rotatePoint(x, y, axis, offset, theta) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  if (axis === 'x') {
    const r = y - offset;
    return [x, offset + r * c, r * s];
  }
  const r = x - offset;
  return [offset + r * c, y, r * s];
}

const radiusOf = (p, axis, offset) => (axis === 'x' ? p.y - offset : p.x - offset);

/**
 * Superficie de revolución de una polilínea.
 * @param {{x:number,y:number}[]} points
 * @returns {THREE.BufferGeometry|null}
 */
export function createRevolvedPolyline({
  points,
  axis,
  axisOffset,
  angle = TWO_PI,
  thetaSegments = 64,
}) {
  if (!points || points.length < 2) return null;

  // Descarta curvas degeneradas (colapsadas sobre el eje o de longitud nula)
  const maxR = Math.max(...points.map((p) => Math.abs(radiusOf(p, axis, axisOffset))));
  const first = points[0];
  const last = points[points.length - 1];
  const spanSq = (first.x - last.x) ** 2 + (first.y - last.y) ** 2;
  const isLine = points.length === 2;
  if (maxR < 1e-9 || (isLine && spanSq < 1e-18)) return null;

  const sweep = Math.max(0.001, Math.min(TWO_PI, angle));
  const positions = [];
  const indices = [];
  const stride = thetaSegments + 1;

  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j <= thetaSegments; j++) {
      const theta = (j / thetaSegments) * sweep;
      positions.push(...rotatePoint(points[i].x, points[i].y, axis, axisOffset, theta));
    }
  }

  for (let i = 0; i < points.length - 1; i++) {
    for (let j = 0; j < thetaSegments; j++) {
      const p1 = i * stride + j;
      const p2 = p1 + 1;
      const p3 = (i + 1) * stride + j;
      const p4 = p3 + 1;
      indices.push(p1, p2, p3, p2, p4, p3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Muestrea una curva y = fn(x); los puntos fuera de dominio heredan el valor previo. */
function sampleCurve(fn, a, b, segments) {
  const pts = [];
  let prev = 0;
  for (let i = 0; i <= segments; i++) {
    const x = a + ((b - a) * i) / segments;
    const y = evalAt(fn, x);
    prev = Number.isNaN(y) ? prev : y;
    pts.push({ x, y: prev });
  }
  return pts;
}

const mergeOrNull = (geoms) => {
  const valid = geoms.filter(Boolean);
  if (valid.length === 0) return null;
  return valid.length === 1 ? valid[0] : mergeGeometries(valid, false);
};

/**
 * Sólido de revolución completo de la región entre g(x) y f(x) (g = 0 si no hay 2ª curva).
 * @returns {THREE.BufferGeometry|null}
 */
export function createSolidGeometry({
  f,
  g,
  a,
  b,
  axis,
  axisOffset,
  angle = TWO_PI,
  xSegments = 64,
  thetaSegments = 72,
}) {
  const fCurve = sampleCurve(f, a, b, xSegments);
  const gCurve = sampleCurve(g, a, b, xSegments);
  const left = [
    { x: a, y: gCurve[0].y },
    { x: a, y: fCurve[0].y },
  ];
  const right = [
    { x: b, y: gCurve[xSegments].y },
    { x: b, y: fCurve[xSegments].y },
  ];

  const make = (points) =>
    createRevolvedPolyline({ points, axis, axisOffset, angle, thetaSegments });

  return mergeOrNull([make(fCurve), make(gCurve), make(left), make(right)]);
}

/**
 * Caras planas de la sección en θ = 0 y θ = ángulo (solo si el giro es parcial)
 * para que el sólido parcial se vea "cerrado".
 */
export function createSweepCaps({ f, g, a, b, axis, axisOffset, angle, xSegments = 48 }) {
  if (angle >= TWO_PI - 0.02) return null;

  const fCurve = sampleCurve(f, a, b, xSegments);
  const gCurve = sampleCurve(g, a, b, xSegments);

  const faceAt = (theta) => {
    const positions = [];
    const indices = [];
    for (let i = 0; i <= xSegments; i++) {
      positions.push(...rotatePoint(gCurve[i].x, gCurve[i].y, axis, axisOffset, theta));
      positions.push(...rotatePoint(fCurve[i].x, fCurve[i].y, axis, axisOffset, theta));
    }
    for (let i = 0; i < xSegments; i++) {
      const p1 = i * 2;
      indices.push(p1, p1 + 1, p1 + 2, p1 + 1, p1 + 3, p1 + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  };

  return mergeOrNull([faceAt(0), faceAt(Math.max(0.001, angle))]);
}

/**
 * Elemento diferencial: rectángulo [xc − dx/2, xc + dx/2] × [lo(xSample), hi(xSample)] girado.
 *  - eje horizontal → arandela (disco con hueco) delgada de espesor dx
 *  - eje vertical   → capa cilíndrica hueca de espesor dx
 * `radialExpand` aplica un micro-offset geométrico opcional para evitar z-fighting.
 */
export function createElementGeometry({
  f,
  g,
  xc,
  xSample = xc,
  dx,
  axis,
  axisOffset,
  angle = TWO_PI,
  thetaSegments = 56,
  radialExpand = 0,
}) {
  const s = sectionAt({ f, g, x: xSample, axis, axisOffset });
  if (!s.valid) return null;

  const eps = radialExpand || 0;
  const x0 = xc - dx / 2 - eps * 0.2;
  const x1 = xc + dx / 2 + eps * 0.2;
  const lo = s.lo - eps;
  const hi = s.hi + eps;

  const edges = [
    [{ x: x0, y: lo }, { x: x1, y: lo }],
    [{ x: x0, y: hi }, { x: x1, y: hi }],
    [{ x: x0, y: lo }, { x: x0, y: hi }],
    [{ x: x1, y: lo }, { x: x1, y: hi }],
  ];

  return mergeOrNull(
    edges.map((points) =>
      createRevolvedPolyline({ points, axis, axisOffset, angle, thetaSegments })
    )
  );
}

/**
 * Todos los elementos de la suma de Riemann fusionados en una sola malla,
 * excluyendo el elemento seleccionado (se dibuja aparte, resaltado).
 */
export function createSlicesGeometry({
  slices,
  f,
  g,
  axis,
  axisOffset,
  angle = TWO_PI,
  excludeIndex = -1,
  thetaSegments = 32,
}) {
  const geoms = slices
    .filter((s) => s.index !== excludeIndex)
    .map((s) =>
      createElementGeometry({
        f,
        g,
        xc: s.xc,
        xSample: s.xSample ?? s.xc,
        dx: s.dx,
        axis,
        axisOffset,
        angle,
        thetaSegments,
      })
    );
  return mergeOrNull(geoms);
}

/**
 * Caja envolvente aproximada del sólido completo (para centrar y escalar la cámara).
 */
export function computeSolidBounds({ f, g, a, b, axis, axisOffset, samples = 120 }) {
  let minY = Infinity;
  let maxY = -Infinity;
  let maxR = 0;

  for (let i = 0; i <= samples; i++) {
    const x = a + ((b - a) * i) / samples;
    const fv = evalAt(f, x);
    const gv = evalAt(g, x);
    for (const y of [fv, gv]) {
      if (Number.isNaN(y)) continue;
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      maxR = Math.max(maxR, Math.abs(axis === 'x' ? y - axisOffset : x - axisOffset));
    }
  }

  if (!Number.isFinite(minY)) {
    minY = -1;
    maxY = 1;
  }

  if (axis === 'x') {
    maxR = Math.max(maxR, 1e-3);
    return {
      center: [(a + b) / 2, axisOffset, 0],
      size: [b - a, 2 * maxR, 2 * maxR],
    };
  }

  // Eje vertical: el radio máximo viene de |x − c| en los extremos del intervalo
  maxR = Math.max(maxR, Math.abs(a - axisOffset), Math.abs(b - axisOffset), 1e-3);
  return {
    center: [axisOffset, (minY + maxY) / 2, 0],
    size: [2 * maxR, Math.max(maxY - minY, 1e-3), 2 * maxR],
  };
}
