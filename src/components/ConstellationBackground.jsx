import React, { memo, useEffect, useRef } from 'react';

const NODE_COLORS = [
  { rgb: '255, 255, 255', hex: '#ffffff' },   // Blanco brillante
  { rgb: '224, 242, 254', hex: '#e0f2fe' },   // Blanco hielo (#E0F2FE)
  { rgb: '103, 232, 249', hex: '#67e8f9' },   // Cian luminoso (#67E8F9)
  { rgb: '56, 189, 248', hex: '#38BDF8' },    // Cian cielo (#38BDF8)
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Genera nodos distribuidos de forma uniforme mediante cuadrícula estratificada con jitter
 * para formar constelaciones geométricas visibles en toda la pantalla sin zonas vacías.
 */
function createBaseParticles(width, height) {
  const area = width * height;
  const count = clamp(Math.round(area / 12000), 54, 118);
  const cols = Math.max(4, Math.round(Math.sqrt((count * width) / Math.max(1, height))));
  const rows = Math.max(3, Math.ceil(count / cols));
  const cellW = width / cols;
  const cellH = height / rows;
  const particles = [];

  for (let r = 0; r < rows && particles.length < count; r++) {
    for (let c = 0; c < cols && particles.length < count; c++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 14 + Math.random() * 18; // px/segundo (flujo fluido y perceptible desde el montaje)
      const idx = particles.length;
      const palette = NODE_COLORS[idx % NODE_COLORS.length];
      const isMajorStar = idx % 5 === 0;

      particles.push({
        x: (c + 0.15 + Math.random() * 0.7) * cellW,
        y: (r + 0.15 + Math.random() * 0.7) * cellH,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: isMajorStar ? 2.2 + Math.random() * 0.8 : 1.4 + Math.random() * 1.1,
        colorRgb: palette.rgb,
        baseAlpha: isMajorStar ? 0.78 + Math.random() * 0.2 : 0.56 + Math.random() * 0.34,
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.9 + Math.random() * 1.3,
        isMajorStar,
      });
    }
  }

  return particles;
}

/**
 * Estrellas de profundidad sutiles (no forman aristas) para dar atmósfera estelar al fondo.
 */
function createAmbientStars(width, height) {
  const count = clamp(Math.round((width * height) / 42000), 16, 36);
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      radius: 0.7 + Math.random() * 0.7,
      alpha: 0.28 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.7 + Math.random() * 1.1,
    });
  }
  return stars;
}

/**
 * Crea un brote orgánico de nodos temporales ("Enredadera" / red neuronal)
 * con crecimiento escalonado por generaciones, enlaces cruzados y desvanecimiento fluido.
 */
function createVineBurst(originX, originY, now) {
  const nodes = [];
  const edges = [];

  // Nodo raíz brillante en las coordenadas de origen
  nodes.push({
    index: 0,
    parentIndex: -1,
    targetX: originX,
    targetY: originY,
    x: originX,
    y: originY,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    delay: 0,
    growDur: 0.14,
    radius: 3.1,
    colorRgb: '255, 255, 255',
  });

  const branchCount = 4 + Math.floor(Math.random() * 2); // 4 a 5 ramas primarias
  const baseAngleOffset = Math.random() * Math.PI * 2;

  for (let b = 0; b < branchCount; b++) {
    const angle1 =
      baseAngleOffset + (b * Math.PI * 2) / branchCount + (Math.random() - 0.5) * 0.42;
    const len1 = 44 + Math.random() * 34;
    const x1 = originX + Math.cos(angle1) * len1;
    const y1 = originY + Math.sin(angle1) * len1;
    const idx1 = nodes.length;
    const col1 = NODE_COLORS[b % NODE_COLORS.length];

    nodes.push({
      index: idx1,
      parentIndex: 0,
      targetX: x1,
      targetY: y1,
      x: originX,
      y: originY,
      vx: Math.cos(angle1) * 5,
      vy: Math.sin(angle1) * 5,
      delay: 0.025 + b * 0.022,
      growDur: 0.28 + Math.random() * 0.1,
      radius: 2.3 + Math.random() * 0.6,
      colorRgb: col1.rgb,
    });
    edges.push({ from: 0, to: idx1 });

    // 2 sub-ramas secundarias por cada rama primaria
    for (let s = 0; s < 2; s++) {
      const sign = s === 0 ? -1 : 1;
      const angle2 = angle1 + sign * (0.36 + Math.random() * 0.34);
      const len2 = 36 + Math.random() * 32;
      const x2 = x1 + Math.cos(angle2) * len2;
      const y2 = y1 + Math.sin(angle2) * len2;
      const idx2 = nodes.length;
      const col2 = NODE_COLORS[(b + s + 1) % NODE_COLORS.length];
      const delay2 = 0.16 + Math.random() * 0.08;

      nodes.push({
        index: idx2,
        parentIndex: idx1,
        targetX: x2,
        targetY: y2,
        x: x1,
        y: y1,
        vx: Math.cos(angle2) * 6,
        vy: Math.sin(angle2) * 6,
        delay: delay2,
        growDur: 0.32 + Math.random() * 0.12,
        radius: 1.85 + Math.random() * 0.45,
        colorRgb: col2.rgb,
      });
      edges.push({ from: idx1, to: idx2 });

      // Brote terciario ocasional para textura orgánica de enredadera
      if (Math.random() > 0.4) {
        const angle3 = angle2 + (Math.random() - 0.5) * 0.68;
        const len3 = 26 + Math.random() * 24;
        const x3 = x2 + Math.cos(angle3) * len3;
        const y3 = y2 + Math.sin(angle3) * len3;
        const idx3 = nodes.length;
        const delay3 = delay2 + 0.15 + Math.random() * 0.08;

        nodes.push({
          index: idx3,
          parentIndex: idx2,
          targetX: x3,
          targetY: y3,
          x: x2,
          y: y2,
          vx: Math.cos(angle3) * 5,
          vy: Math.sin(angle3) * 5,
          delay: delay3,
          growDur: 0.28,
          radius: 1.5 + Math.random() * 0.35,
          colorRgb: '186, 230, 253',
        });
        edges.push({ from: idx2, to: idx3 });
      }
    }
  }

  // Enlaces geométricos cruzados entre nodos cercanos del mismo brote
  const crossEdges = [];
  for (let i = 1; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[j].parentIndex === i || nodes[i].parentIndex === j) continue;
      const dist = Math.hypot(
        nodes[i].targetX - nodes[j].targetX,
        nodes[i].targetY - nodes[j].targetY
      );
      if (dist < 88) {
        crossEdges.push({
          from: i,
          to: j,
          delay: Math.max(nodes[i].delay, nodes[j].delay) + 0.14,
        });
      }
    }
  }

  return {
    createdAt: now,
    originX,
    originY,
    maxLife: 3.6, // segundos hasta desvanecerse suavemente
    nodes,
    edges,
    crossEdges,
  };
}

/**
 * Fondo interactivo de Constelaciones sobre Canvas 2D a 60 FPS.
 * - Arranca automáticamente su loop de animación y siembra una semilla inicial al montar
 *   (tanto en carga inicial como al volver desde Teoría, Simulador o Desafíos).
 * - Interacción "Enredadera" al hacer clic con limpieza estricta de RAF y listeners al desmontar.
 */
const ConstellationBackground = memo(function ConstellationBackground() {
  const canvasRef = useRef(null);
  const animationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    let disposed = false;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let ambientStars = [];
    let hasAutoSeeded = false;
    const bursts = [];

    let lastTime = performance.now() / 1000;

    const renderScene = (nowMs, advanceMotion = true) => {
      if (disposed || width <= 1 || height <= 1) return;

      const now = nowMs / 1000;
      const dt = advanceMotion ? clamp(now - lastTime, 0.001, 0.05) : 0;
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      const maxConnDist = width < 640 ? 128 : 168;
      const margin = 36;

      // 0. Estrellas lejanas de fondo
      for (let i = 0; i < ambientStars.length; i++) {
        const s = ambientStars[i];
        if (advanceMotion) {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          if (s.x < -margin) s.x = width + margin;
          else if (s.x > width + margin) s.x = -margin;
          if (s.y < -margin) s.y = height + margin;
          else if (s.y > height + margin) s.y = -margin;
        }
        const tw = 0.72 + 0.28 * Math.sin(now * s.twinkleSpeed + s.phase);
        ctx.fillStyle = `rgba(224, 242, 254, ${(s.alpha * tw).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 1. Actualizar posiciones de nodos base de constelación
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (advanceMotion) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          if (p.x < -margin) p.x = width + margin;
          else if (p.x > width + margin) p.x = -margin;
          if (p.y < -margin) p.y = height + margin;
          else if (p.y > height + margin) p.y = -margin;
        }
      }

      // 2. Líneas geométricas nítidas entre nodos cercanos
      ctx.lineWidth = 0.95;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (Math.abs(dx) > maxConnDist || Math.abs(dy) > maxConnDist) continue;
          const dist = Math.hypot(dx, dy);
          if (dist < maxConnDist) {
            const ratio = 1 - dist / maxConnDist;
            const alpha = Math.pow(ratio, 1.15) * 0.46;
            ctx.strokeStyle =
              ratio > 0.55
                ? `rgba(224, 242, 254, ${alpha.toFixed(3)})`
                : `rgba(125, 211, 252, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // 3. Dibujar nodos luminosos de las constelaciones (halo + núcleo brillante)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const twinkle = 0.78 + 0.22 * Math.sin(now * p.twinkleSpeed + p.phase);
        const alpha = p.baseAlpha * twinkle;

        ctx.fillStyle = `rgba(186, 230, 253, ${(alpha * (p.isMajorStar ? 0.28 : 0.2)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (p.isMajorStar ? 3.1 : 2.5), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${p.colorRgb}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        if (p.isMajorStar) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 1.15).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.52, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Actualizar y dibujar brotes interactivos "Enredadera" (pulso inicial + clics)
      for (let bIdx = bursts.length - 1; bIdx >= 0; bIdx--) {
        const burst = bursts[bIdx];
        const age = Math.max(0, now - burst.createdAt);
        if (age >= burst.maxLife) {
          bursts.splice(bIdx, 1);
          continue;
        }

        const fadeOut =
          age > burst.maxLife - 1.35
            ? clamp((burst.maxLife - age) / 1.35, 0, 1)
            : 1;
        const globalAlpha = easeOutCubic(fadeOut);

        // Onda / pulso concéntrico inicial
        if (age < 0.85) {
          const pulseP = easeOutCubic(age / 0.85);
          const ringRadius = 6 + pulseP * 68;
          const ringAlpha = (1 - pulseP) * 0.62;
          ctx.lineWidth = 1.35;
          ctx.strokeStyle = `rgba(224, 242, 254, ${ringAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(burst.originX, burst.originY, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        const vineNodes = burst.nodes;
        for (let n = 0; n < vineNodes.length; n++) {
          const node = vineNodes[n];
          if (age < node.delay) {
            node.visible = false;
            node.progress = 0;
            continue;
          }
          node.visible = true;
          const rawP = clamp((age - node.delay) / node.growDur, 0, 1);
          node.progress = easeOutCubic(rawP);

          const drift = Math.max(0, age - node.delay) * 0.75;
          if (node.parentIndex >= 0) {
            const parent = vineNodes[node.parentIndex];
            const tx = node.targetX + node.vx * drift;
            const ty = node.targetY + node.vy * drift;
            node.x = parent.x + (tx - parent.x) * node.progress;
            node.y = parent.y + (ty - parent.y) * node.progress;
          } else {
            node.x = node.targetX + node.vx * drift * 0.4;
            node.y = node.targetY + node.vy * drift * 0.4;
          }
        }

        // Hilos principales de la ramificación
        ctx.lineWidth = 1.15;
        for (let e = 0; e < burst.edges.length; e++) {
          const edge = burst.edges[e];
          const from = vineNodes[edge.from];
          const to = vineNodes[edge.to];
          if (!from.visible || !to.visible) continue;

          ctx.strokeStyle = `rgba(224, 242, 254, ${(0.76 * globalAlpha).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }

        // Hilos cruzados entre nodos cercanos de la red temporal
        ctx.lineWidth = 0.8;
        for (let c = 0; c < burst.crossEdges.length; c++) {
          const ce = burst.crossEdges[c];
          if (age < ce.delay) continue;
          const from = vineNodes[ce.from];
          const to = vineNodes[ce.to];
          if (!from.visible || !to.visible) continue;

          const appear = clamp((age - ce.delay) / 0.25, 0, 1);
          ctx.strokeStyle = `rgba(125, 211, 252, ${(0.52 * appear * globalAlpha).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }

        // Conexiones con nodos cercanos de la constelación base
        ctx.lineWidth = 0.75;
        for (let n = 0; n < vineNodes.length; n++) {
          const vn = vineNodes[n];
          if (!vn.visible || vn.progress < 0.35) continue;
          for (let p = 0; p < particles.length; p++) {
            const bp = particles[p];
            const dist = Math.hypot(vn.x - bp.x, vn.y - bp.y);
            if (dist < 145) {
              const alpha = (1 - dist / 145) * 0.44 * globalAlpha * vn.progress;
              ctx.strokeStyle = `rgba(224, 242, 254, ${alpha.toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(vn.x, vn.y);
              ctx.lineTo(bp.x, bp.y);
              ctx.stroke();
            }
          }
        }

        // Nodos brillantes de la enredadera
        for (let n = 0; n < vineNodes.length; n++) {
          const vn = vineNodes[n];
          if (!vn.visible) continue;
          const alpha = (0.55 + 0.45 * vn.progress) * globalAlpha;

          ctx.fillStyle = `rgba(125, 211, 252, ${(alpha * 0.34).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(vn.x, vn.y, vn.radius * 2.7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(${vn.colorRgb}, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(vn.x, vn.y, vn.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const spawnInitialPulse = (nowMs) => {
      if (hasAutoSeeded || width <= 1 || height <= 1) return;
      hasAutoSeeded = true;
      const now = nowMs / 1000;
      bursts.push(createVineBurst(width * 0.5, height * 0.42, now));
    };

    const initOrResize = () => {
      if (disposed) return;
      const rect = canvas.getBoundingClientRect();
      const rawW = rect.width > 1 ? rect.width : window.innerWidth;
      const rawH = rect.height > 1 ? rect.height : window.innerHeight;
      const nextW = Math.max(1, Math.floor(rawW));
      const nextH = Math.max(1, Math.floor(rawH));
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);

      const dimsUnchanged =
        nextW === width && nextH === height && nextDpr === dpr && particles.length > 0;
      if (dimsUnchanged) return;

      const hadValidSize = width > 1 && height > 1 && particles.length > 0;
      const scaleX = hadValidSize ? nextW / width : 1;
      const scaleY = hadValidSize ? nextH / height : 1;

      width = nextW;
      height = nextH;
      dpr = nextDpr;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!hadValidSize) {
        particles = createBaseParticles(width, height);
        ambientStars = createAmbientStars(width, height);
      } else {
        for (let i = 0; i < particles.length; i++) {
          particles[i].x *= scaleX;
          particles[i].y *= scaleY;
        }
        for (let i = 0; i < ambientStars.length; i++) {
          ambientStars[i].x *= scaleX;
          ambientStars[i].y *= scaleY;
        }
      }

      const nowMs = performance.now();
      spawnInitialPulse(nowMs);
      renderScene(nowMs, false);
    };

    const startAnimationLoop = () => {
      if (disposed || animationRef.current || document.hidden) return;
      lastTime = performance.now() / 1000;
      const animate = () => {
        if (disposed) {
          animationRef.current = 0;
          return;
        }
        renderScene(performance.now(), true);
        if (!disposed && !document.hidden) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          animationRef.current = 0;
        }
      };
      animationRef.current = requestAnimationFrame(animate);
    };

    const handleClick = (e) => {
      if (disposed) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      const now = performance.now() / 1000;
      if (bursts.length >= 8) {
        bursts.shift();
      }
      bursts.push(createVineBurst(x, y, now));
      startAnimationLoop();
    };

    const handleVisibilityChange = () => {
      if (disposed) return;
      if (document.hidden) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = 0;
        }
      } else {
        lastTime = performance.now() / 1000;
        renderScene(performance.now(), false);
        startAnimationLoop();
      }
    };

    // Inicialización automática inmediata al montar la vista
    initOrResize();
    startAnimationLoop();

    const ro = new ResizeObserver(initOrResize);
    ro.observe(canvas);
    window.addEventListener('resize', initOrResize, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
      ro.disconnect();
      window.removeEventListener('resize', initOrResize);
      window.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
});

export default ConstellationBackground;
