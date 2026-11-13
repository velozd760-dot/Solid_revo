import test from 'node:test';
import assert from 'node:assert/strict';
import { computeVolume, computeRiemannSlices } from './calculusEngine';
import { createSolidGeometry, computeSolidBounds } from './geometryGenerator';

test('computeVolume calculates exact cylinder/cone volume for y = x on [0, 2] around x-axis', () => {
  const { fullVolume, invalidFraction } = computeVolume({
    f: (x) => x,
    g: () => 0,
    a: 0,
    b: 2,
    axis: 'x',
    axisOffset: 0,
  });
  // Cone r=2, h=2 => V = (1/3) * pi * r^2 * h = 8*pi/3
  const expected = (8 * Math.PI) / 3;
  assert.equal(invalidFraction, 0);
  assert.ok(Math.abs(fullVolume - expected) < 1e-4, `Expected ~${expected}, got ${fullVolume}`);
});

test('computeRiemannSlices converges toward exact integral as count grows', () => {
  const f = (x) => Math.sqrt(Math.max(0, x));
  const slicesLow = computeRiemannSlices({ f, a: 0, b: 4, axis: 'x', count: 8, mode: 'left' });
  const slicesMid = computeRiemannSlices({ f, a: 0, b: 4, axis: 'x', count: 32, mode: 'midpoint' });

  const sumLow = slicesLow.reduce((acc, s) => acc + s.volume, 0);
  const sumMid = slicesMid.reduce((acc, s) => acc + s.volume, 0);
  const exact = 8 * Math.PI; // pi * int_0^4 x dx = 8*pi

  assert.equal(slicesLow.length, 8);
  assert.ok(Math.abs(sumMid - exact) < 1e-4, `Midpoint should be exact for linear R^2: ${sumMid}`);
  assert.ok(Math.abs(sumLow - exact) > 0.1);
});

test('mobile LOD geometry significantly reduces vertex count compared to desktop high LOD', () => {
  const params = {
    f: (x) => 1 + 0.5 * Math.sin(x),
    g: () => 0,
    a: 0,
    b: Math.PI,
    axis: 'x',
    axisOffset: 0,
    angle: Math.PI * 2,
  };

  const desktopGeo = createSolidGeometry({ ...params, xSegments: 64, thetaSegments: 72 });
  const mobileGeo = createSolidGeometry({ ...params, xSegments: 36, thetaSegments: 36 });

  assert.ok(desktopGeo && mobileGeo, 'Both geometries must build cleanly');

  const desktopVerts = desktopGeo.getAttribute('position').count;
  const mobileVerts = mobileGeo.getAttribute('position').count;

  assert.ok(mobileVerts < desktopVerts * 0.4, `Expected mobileVerts (${mobileVerts}) < 40% of desktopVerts (${desktopVerts})`);

  desktopGeo.dispose();
  mobileGeo.dispose();
});

test('computeSolidBounds returns finite center and dimensions', () => {
  const bounds = computeSolidBounds({
    f: (x) => x * x,
    g: () => 0,
    a: 0,
    b: 2,
    axis: 'y',
    axisOffset: 0,
  });
  assert.deepEqual(bounds.center, [0, 2, 0]);
  assert.equal(bounds.size[0], 4);
  assert.equal(bounds.size[1], 4);
});
