import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeRiemannSlices, evalAt, sampleFunction, sectionAt } from '../math/calculusEngine';
import { MoveHorizontal } from 'lucide-react';
import { GLASS } from './GlassCard';

const COLORS = {
  grid: 'rgba(100, 116, 139, 0.14)',
  axisMain: '#94a3b8',
  text: '#64748b',
  f: '#2563eb', // blue-600 (primario)
  g: '#6366f1', // indigo-500
  axisRev: '#e11d48',
  element: '#f59e0b', // amber-500 (elemento diferencial dx en amarillo/ámbar intenso)
  elementText: '#b45309', // amber-700 (legible sobre claro)
  slice: '#3b82f6',
};

/** Paso "bonito" (1, 2, 5 × 10ⁿ) para la cuadrícula. */
function niceStep(span, targetLines = 7) {
  const safeSpan = Number.isFinite(span) && span > 1e-6 ? span : 1;
  const raw = safeSpan / Math.max(1, targetLines);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const frac = raw / pow;
  const mult = frac < 1.5 ? 1 : frac < 3.5 ? 2 : frac < 7.5 ? 5 : 10;
  return Math.max(1e-6, mult * pow);
}

const decimalsFor = (step) => {
  if (!Number.isFinite(step) || step <= 0) return 0;
  return Math.min(6, Math.max(0, -Math.floor(Math.log10(step) + 1e-9)));
};

const DEFAULT_ELEMENT = { xc: 0, xSample: 0, dx: 0.1, index: 0 };

const Canvas2D = memo(function Canvas2D({
  f,
  g,
  hasG = false,
  a = 0,
  b = 4,
  axis = 'x',
  axisOffset = 0,
  element = DEFAULT_ELEMENT,
  showElement = true,
  showRiemann = false,
  riemannMode = 'left',
  sampleMode,
  slicesCount = 20,
  onElementMove,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const viewRef = useRef(null); // transformaciones actuales (px ↔ x)
  const draggingRef = useRef(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const resolvedMode = sampleMode ?? riemannMode ?? 'left';
  const safeElement = element ?? DEFAULT_ELEMENT;
  const interactive = showElement || showRiemann;

  const safeA = Number.isFinite(a) ? a : 0;
  const safeB = Number.isFinite(b) && b !== safeA ? b : safeA + 1;
  const safeOffset = Number.isFinite(axisOffset) ? axisOffset : 0;

  // Partición de Riemann memoizada: no se recalcula al arrastrar el slider de Posición x_i
  const riemannSlices = useMemo(
    () =>
      showRiemann
        ? computeRiemannSlices({
            f,
            g,
            a: safeA,
            b: safeB,
            axis,
            axisOffset: safeOffset,
            count: slicesCount,
            mode: resolvedMode,
          })
        : [],
    [showRiemann, f, g, safeA, safeB, axis, safeOffset, slicesCount, resolvedMode]
  );

  // Muestreo de curvas y cotas del plano memoizado: evita re-evaluar ~1000 puntos al arrastrar x_i
  const plotData = useMemo(() => {
    const fSamples = sampleFunction(f, safeA, safeB, 241);
    const gSamples = hasG
      ? sampleFunction(g, safeA, safeB, 241)
      : fSamples.map((p) => ({ x: p.x, y: 0, isValid: true }));

    const yCandidates = [0];
    const pushSafeY = (val) => {
      if (Number.isFinite(val) && Math.abs(val) < 1e6) {
        yCandidates.push(val);
      }
    };

    if (axis === 'x') pushSafeY(safeOffset);

    for (const p of fSamples) {
      if (p.isValid) pushSafeY(p.y);
    }
    for (const p of gSamples) {
      if (p.isValid) pushSafeY(p.y);
    }
    for (const xEnd of [safeA, safeB]) {
      pushSafeY(evalAt(f, xEnd));
      if (hasG) {
        pushSafeY(evalAt(g, xEnd));
      }
    }
    for (const sl of riemannSlices) {
      if (sl.valid) {
        pushSafeY(sl.lo);
        pushSafeY(sl.hi);
      }
    }

    let minYData = Math.min(...yCandidates);
    let maxYData = Math.max(...yCandidates);
    if (!Number.isFinite(minYData) || !Number.isFinite(maxYData)) {
      minYData = -1;
      maxYData = 2;
    }
    if (Math.abs(maxYData - minYData) < 1e-6) {
      minYData -= 1;
      maxYData += 1;
    }

    const xCandidates = [safeA, safeB, 0, ...(axis === 'y' ? [safeOffset] : [])];
    const dataSpanX = Math.max(1e-3, Math.max(...xCandidates) - Math.min(...xCandidates));
    const padX = dataSpanX * 0.08 + 0.15;
    const minX = Math.min(...xCandidates) - padX;
    const maxX = Math.max(...xCandidates) + padX;
    const spanX = Math.max(0.5, maxX - minX);

    const dataSpanY = Math.max(1e-3, maxYData - minYData);
    const padY = Math.max(0.15, dataSpanY * 0.15);
    const yMin = minYData - padY;
    const yMax = maxYData + padY;
    const spanY = Math.max(0.5, yMax - yMin);

    const fCurveSamples = sampleFunction(f, minX, maxX, 260);
    const gCurveSamples = hasG ? sampleFunction(g, minX, maxX, 260) : [];

    return {
      fSamples,
      gSamples,
      minYData,
      maxYData,
      minX,
      maxX,
      spanX,
      yMin,
      yMax,
      spanY,
      fCurveSamples,
      gCurveSamples,
    };
  }, [f, g, hasG, safeA, safeB, axis, safeOffset, riemannSlices]);

  // Redibuja cuando cambia el tamaño del contenedor (sin bucle de re-render si w/h no cambian)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const updateSize = () => {
      const nextW = el.clientWidth;
      const nextH = el.clientHeight;
      setSize((prev) => (prev.w === nextW && prev.h === nextH ? prev : { w: nextW, h: nextH }));
    };
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    updateSize();
    return () => ro.disconnect();
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0 || size.h === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = size.w;
    const height = size.h;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);

    const {
      fSamples,
      gSamples,
      minYData,
      maxYData,
      minX,
      maxX,
      spanX,
      yMin,
      yMax,
      spanY,
      fCurveSamples,
      gCurveSamples,
    } = plotData;

    const marginX = 48;
    const marginTop = 40;
    const marginBottom = 38;
    const plotWidth = Math.max(40, width - 2 * marginX);
    const plotHeight = Math.max(40, height - marginTop - marginBottom);

    const toSX = (x) => marginX + ((x - minX) / spanX) * plotWidth;
    const toSY = (y) => marginTop + plotHeight - ((y - yMin) / spanY) * plotHeight;
    const clampSY = (sy) => Math.max(marginTop + 10, Math.min(height - marginBottom - 6, sy));
    viewRef.current = { marginX, plotWidth, minX, spanX };

    ctx.font = '10px monospace';

    // ---- Cuadrícula (con contador finito de seguridad) -----------------------
    ctx.strokeStyle = COLORS.grid;
    ctx.fillStyle = COLORS.text;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    const stepX = niceStep(spanX, 8);
    const decX = decimalsFor(stepX);
    ctx.textAlign = 'center';
    const startX = Math.ceil(minX / stepX) * stepX;
    for (let i = 0; i < 40; i++) {
      const gx = startX + i * stepX;
      if (gx > maxX + 1e-9) break;
      const sx = toSX(gx);
      ctx.beginPath();
      ctx.moveTo(sx, marginTop);
      ctx.lineTo(sx, height - marginBottom);
      ctx.stroke();
      ctx.fillText(gx.toFixed(decX), sx, height - marginBottom + 14);
    }

    const stepY = niceStep(spanY, 6);
    const decY = decimalsFor(stepY);
    ctx.textAlign = 'right';
    const startY = Math.ceil(yMin / stepY) * stepY;
    for (let i = 0; i < 40; i++) {
      const gy = startY + i * stepY;
      if (gy > yMax + 1e-9) break;
      const sy = toSY(gy);
      ctx.beginPath();
      ctx.moveTo(marginX, sy);
      ctx.lineTo(width - marginX, sy);
      ctx.stroke();
      ctx.fillText(gy.toFixed(decY), marginX - 6, sy + 3);
    }

    // ---- Ejes cartesianos --------------------------------------------------
    ctx.strokeStyle = COLORS.axisMain;
    ctx.lineWidth = 1.5;
    if (yMin <= 0 && yMax >= 0) {
      ctx.beginPath();
      ctx.moveTo(marginX, toSY(0));
      ctx.lineTo(width - marginX, toSY(0));
      ctx.stroke();
    }
    if (minX <= 0 && maxX >= 0) {
      ctx.beginPath();
      ctx.moveTo(toSX(0), marginTop);
      ctx.lineTo(toSX(0), height - marginBottom);
      ctx.stroke();
    }

    // ---- Región sombreada entre g(x) y f(x) en [a, b] -----------------------
    ctx.save();
    ctx.beginPath();
    fSamples.forEach((p, i) => {
      const sx = toSX(p.x);
      const sy = toSY(p.y);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    for (let i = gSamples.length - 1; i >= 0; i--) {
      ctx.lineTo(toSX(gSamples[i].x), toSY(gSamples[i].y));
    }
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, toSY(maxYData), 0, toSY(minYData));
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.28)');
    gradient.addColorStop(1, 'rgba(96, 165, 250, 0.10)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    // ---- Rectángulos (Riemann o elemento diferencial) ------------------------
    const drawSliceRect = (xc, xSample, dx, selected) => {
      const s = sectionAt({ f, g, x: xSample, axis, axisOffset });
      if (!s.valid) return null;
      const x0 = toSX(xc - dx / 2);
      const x1 = toSX(xc + dx / 2);
      const w = Math.max(1.5, x1 - x0);
      const yTop = toSY(s.hi);
      const yBot = toSY(s.lo);
      const hPx = Math.max(1, yBot - yTop);

      ctx.fillStyle = selected ? 'rgba(251, 191, 36, 0.62)' : 'rgba(59, 130, 246, 0.22)';
      ctx.strokeStyle = selected ? COLORS.element : COLORS.slice;
      ctx.lineWidth = selected ? 2 : 1;
      ctx.fillRect(x0, yTop, w, hPx);
      ctx.strokeRect(x0, yTop, w, hPx);

      // Punto muestra x_i* sobre la curva superior (muestra claramente izquierda / derecha / punto medio)
      if (showRiemann) {
        const sxSample = toSX(xSample);
        ctx.beginPath();
        ctx.arc(sxSample, toSY(s.f), selected ? 3.2 : 2.2, 0, Math.PI * 2);
        ctx.fillStyle = selected ? COLORS.elementText : COLORS.f;
        ctx.fill();
      }
      return s;
    };

    if (showRiemann) {
      for (const sl of riemannSlices) {
        if (sl.index === safeElement.index) continue;
        drawSliceRect(sl.xc, sl.xSample, sl.dx, false);
      }
    }

    // ---- Curvas f(x) y g(x) acotadas a la ventana visible -------------------
    ctx.save();
    ctx.beginPath();
    ctx.rect(marginX, marginTop, plotWidth, plotHeight);
    ctx.clip();

    const plotCurveSamples = (samples, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      let started = false;
      samples.forEach((p) => {
        if (!p.isValid) {
          started = false;
          return;
        }
        const sx = toSX(p.x);
        const sy = toSY(p.y);
        if (!started) {
          ctx.moveTo(sx, sy);
          started = true;
        } else ctx.lineTo(sx, sy);
      });
      ctx.stroke();
    };
    plotCurveSamples(fCurveSamples, COLORS.f);
    if (hasG) plotCurveSamples(gCurveSamples, COLORS.g);
    ctx.restore();

    // Etiquetas de f(x) y g(x) dentro del área visible
    const drawCurveLabel = (fn, color, label, dyOffset = -8) => {
      const yb = evalAt(fn, safeB);
      if (Number.isFinite(yb)) {
        ctx.fillStyle = color;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        const lx = Math.min(toSX(safeB) + 6, width - marginX - 34);
        const ly = clampSY(toSY(yb) + dyOffset);
        ctx.fillText(label, lx, ly);
      }
    };
    drawCurveLabel(f, COLORS.f, 'f(x)', -7);
    if (hasG) drawCurveLabel(g, COLORS.g, 'g(x)', 12);

    // ---- Elemento diferencial + radios ----------------------------------------
    if (showElement || showRiemann) {
      const xEval = safeElement.xSample ?? safeElement.xc;
      const s = drawSliceRect(safeElement.xc, xEval, safeElement.dx, true);
      const sxc = toSX(safeElement.xc);

      if (s && s.valid) {
        ctx.lineWidth = 2;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        if (axis === 'x') {
          let farEdge;
          let nearEdge = null;
          if (safeOffset <= s.lo) {
            farEdge = s.hi;
            nearEdge = s.lo;
          } else if (safeOffset >= s.hi) {
            farEdge = s.lo;
            nearEdge = s.hi;
          } else {
            farEdge = s.hi - safeOffset >= safeOffset - s.lo ? s.hi : s.lo;
          }
          ctx.strokeStyle = COLORS.element;
          ctx.fillStyle = COLORS.elementText;
          ctx.beginPath();
          ctx.moveTo(sxc - 5, toSY(safeOffset));
          ctx.lineTo(sxc - 5, toSY(farEdge));
          ctx.stroke();
          ctx.fillText(
            `R = ${s.R.toFixed(2)}`,
            Math.min(sxc + 8, width - marginX - 58),
            clampSY((toSY(safeOffset) + toSY(farEdge)) / 2)
          );
          if (nearEdge !== null && s.r > 1e-9) {
            ctx.strokeStyle = '#d97706';
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.moveTo(sxc + 5, toSY(safeOffset));
            ctx.lineTo(sxc + 5, toSY(nearEdge));
            ctx.stroke();
            ctx.fillText(
              `r = ${s.r.toFixed(2)}`,
              Math.min(sxc + 8, width - marginX - 58),
              clampSY((toSY(safeOffset) + toSY(nearEdge)) / 2 + 14)
            );
          }
        } else {
          const ym = (s.lo + s.hi) / 2;
          ctx.strokeStyle = COLORS.element;
          ctx.fillStyle = COLORS.elementText;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(toSX(safeOffset), toSY(ym));
          ctx.lineTo(sxc, toSY(ym));
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.textAlign = 'center';
          ctx.fillText(`ρ = ${s.radius.toFixed(2)}`, (toSX(safeOffset) + sxc) / 2, clampSY(toSY(ym) - 7));
          ctx.textAlign = 'left';
          ctx.fillText(
            `h = ${s.height.toFixed(2)}`,
            Math.min(sxc + 10, width - marginX - 58),
            clampSY(toSY(ym) + 4)
          );
        }
      }
    }

    // ---- Límites a, b y cursor arrastrable --------------------------------------
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = COLORS.f;
    ctx.fillStyle = COLORS.f;
    ctx.lineWidth = 1.2;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    [safeA, safeB].forEach((val, idx) => {
      const sx = toSX(val);
      ctx.beginPath();
      ctx.moveTo(sx, marginTop);
      ctx.lineTo(sx, height - marginBottom);
      ctx.stroke();
      ctx.fillText(idx === 0 ? `a = ${+val.toFixed(3)}` : `b = ${+val.toFixed(3)}`, sx, height - marginBottom + 28);
    });
    ctx.setLineDash([]);

    if (showElement || showRiemann) {
      const xEval = safeElement.xSample ?? safeElement.xc;
      const sx = toSX(xEval);
      const base = height - marginBottom;
      ctx.fillStyle = COLORS.element;
      ctx.strokeStyle = COLORS.element;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, marginTop);
      ctx.lineTo(sx, base);
      ctx.stroke();
      // tirador triangular
      ctx.beginPath();
      ctx.moveTo(sx, base - 2);
      ctx.lineTo(sx - 7, base + 10);
      ctx.lineTo(sx + 7, base + 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = COLORS.elementText;
      ctx.textAlign = 'center';
      const labelPrefix = showRiemann ? 'xᵢ*' : 'x';
      ctx.fillText(`${labelPrefix} = ${Number(xEval || 0).toFixed(2)}`, sx, marginTop - 8 + (axis === 'y' ? 14 : 0));
    }

    // ---- Eje de revolución (dibujado al final para quedar siempre en primer plano) ----
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = COLORS.axisRev;
    ctx.fillStyle = COLORS.axisRev;
    ctx.lineWidth = 2;
    ctx.font = 'bold 11px monospace';
    ctx.beginPath();
    if (axis === 'x') {
      const sy = toSY(safeOffset);
      ctx.moveTo(marginX, sy);
      ctx.lineTo(width - marginX, sy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = 'left';
      const labelText = `Eje de giro: y = ${safeOffset}`;
      const labelY = clampSY(sy - 7);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.strokeText(labelText, marginX + 8, labelY);
      ctx.fillText(labelText, marginX + 8, labelY);
    } else {
      const sx = toSX(safeOffset);
      ctx.moveTo(sx, marginTop);
      ctx.lineTo(sx, height - marginBottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = 'center';
      const labelText = `Eje de giro: x = ${safeOffset}`;
      const labelY = marginTop - 8;
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.strokeText(labelText, sx, labelY);
      ctx.fillText(labelText, sx, labelY);
    }
    ctx.restore();
  }, [
    f,
    g,
    hasG,
    safeA,
    safeB,
    axis,
    safeOffset,
     axisOffset,
    safeElement,
    showElement,
    showRiemann,
    riemannSlices,
    plotData,
    size,
  ]);

  // ---- Interacción: arrastrar para mover el elemento diferencial -------------------
  const moveFromPointer = useCallback(
    (e) => {
      const view = viewRef.current;
      const canvas = canvasRef.current;
      if (!view || !canvas || !onElementMove) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const x = view.minX + ((px - view.marginX) / view.plotWidth) * view.spanX;
      onElementMove(x);
    },
    [onElementMove]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (!interactive) return;
      draggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      moveFromPointer(e);
    },
    [interactive, moveFromPointer]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (draggingRef.current) moveFromPointer(e);
    },
    [moveFromPointer]
  );

  const handlePointerUp = useCallback((e) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const handleSliderChange = useCallback(
    (e) => {
      onElementMove?.(parseFloat(e.target.value));
    },
    [onElementMove]
  );

  return (
    <div className={`${GLASS} relative w-full h-full flex flex-col overflow-hidden`}>
      <div className="absolute top-2.5 left-3 z-0 flex items-center gap-2 pointer-events-none">
        <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
          Plano 2D: Región Generatriz R
        </span>
      </div>

      <div ref={wrapRef} className="relative z-10 flex-1 min-h-0">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 z-10 w-full h-full block touch-none ${interactive ? 'cursor-ew-resize' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>

      {interactive && (
        <div className="flex items-center gap-3 px-3 py-1.5 border-t border-slate-200/80 bg-amber-50/50 text-[11px]">
          <MoveHorizontal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-slate-700 shrink-0">
            Posición del elemento <span className="font-mono text-amber-700 font-bold">x<sub>i</sub></span>
          </span>
          <input
            type="range"
            min={a}
            max={b}
            step={(b - a) / 400 || 0.01}
            value={safeElement.xc}
            onChange={handleSliderChange}
            className="flex-1 accent-amber-500 cursor-pointer"
          />
          <span className="font-mono text-amber-700 font-bold w-14 text-right shrink-0 tabular-nums">
            {Number(safeElement.xSample ?? safeElement.xc ?? 0).toFixed(3)}
          </span>
        </div>
      )}
    </div>
  );
});

export default Canvas2D;
