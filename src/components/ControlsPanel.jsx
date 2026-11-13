import React, { memo, startTransition, useCallback, useEffect, useRef, useState, useTransition } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Layers,
  Box,
  Sparkles,
  Eye,
  AlertCircle,
  Scissors,
  TrendingDown,
  SlidersHorizontal,
} from 'lucide-react';
import { GLASS, GLASS_INNER } from './GlassCard';
import { DEFAULT_SIMULATOR_STATE } from '../hooks/useSimulator';

const PRESETS = [
  { label: 'Trompeta: √x', f: 'sqrt(x)', a: '0', b: '4', axis: 'x', offset: 0 },
  { label: 'Paraboloide: x²', f: 'x^2', a: '0', b: '2', axis: 'x', offset: 0 },
  { label: 'Esfera: √(4 − x²)', f: 'sqrt(4 - x^2)', a: '-2', b: '2', axis: 'x', offset: 0 },
  { label: 'Cono: 0.5x', f: '0.5*x', a: '0', b: '4', axis: 'x', offset: 0 },
  { label: 'Onda: cos(x) + 1.2  en [0, π]', f: 'cos(x) + 1.2', a: '0', b: 'pi', axis: 'x', offset: 0 },
  { label: 'Arandelas: f = √x,  g = x²', f: 'sqrt(x)', g: 'x^2', a: '0', b: '1', axis: 'x', offset: 0 },
  { label: 'Arandelas con eje y = −1: f = x, g = x²', f: 'x', g: 'x^2', a: '0', b: '1', axis: 'x', offset: -1 },
  { label: 'Toro (dona): 2 ± √(1 − x²)', f: '2 + sqrt(1 - x^2)', g: '2 - sqrt(1 - x^2)', a: '-1', b: '1', axis: 'x', offset: 0 },
  { label: 'Capas (eje y): f = x²', f: 'x^2', a: '0', b: '2', axis: 'y', offset: 0 },
  { label: 'Capas entre curvas (eje y): f = x, g = x²', f: 'x', g: 'x^2', a: '0', b: '1', axis: 'y', offset: 0 },
];

const PANEL_TABS = [
  { id: 'parameters', label: 'Parámetros', icon: Sliders },
  { id: 'riemann', label: 'Elemento dx', icon: Layers },
  { id: 'display', label: 'Vista', icon: Eye },
];

const inputBase =
  'w-full bg-white border rounded-lg px-3 py-2 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition';
const inputOk = 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20';
const inputBad = 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20';

const Toggle = memo(function Toggle({ checked, onChange, title, subtitle }) {
  return (
    <label className={`${GLASS_INNER} flex items-center justify-between gap-3 p-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition`}>
      <div>
        <span className="text-xs font-semibold text-slate-800 block">{title}</span>
        {subtitle && <span className="text-[11px] text-slate-500">{subtitle}</span>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-blue-600 cursor-pointer shrink-0"
      />
    </label>
  );
});

const Badge = memo(function Badge({ ok }) {
  return ok ? (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
      válida
    </span>
  ) : (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 font-mono">
      error
    </span>
  );
});

const ControlsPanel = memo(function ControlsPanel({
  expression = DEFAULT_SIMULATOR_STATE.expression,
  setExpression,
  useG = DEFAULT_SIMULATOR_STATE.useG,
  setUseG,
  gExpression = DEFAULT_SIMULATOR_STATE.gExpression,
  setGExpression,
  aStr = DEFAULT_SIMULATOR_STATE.aStr,
  setAStr,
  bStr = DEFAULT_SIMULATOR_STATE.bStr,
  setBStr,
  boundsStatus = { aOk: true, bOk: true, message: '' },
  axis = DEFAULT_SIMULATOR_STATE.axis,
  setAxis,
  axisOffset = DEFAULT_SIMULATOR_STATE.axisOffset,
  setAxisOffset,
  angleDeg = DEFAULT_SIMULATOR_STATE.angleDeg,
  setAngleDeg,
  isPlaying = DEFAULT_SIMULATOR_STATE.isPlaying,
  setIsPlaying,
  isAnimatingPreset = false,
  startRevolutionAnimation,
  slicesCount = DEFAULT_SIMULATOR_STATE.slicesCount,
  setSlicesCount,
  showRiemann = DEFAULT_SIMULATOR_STATE.showRiemann,
  setShowRiemann,
  riemannMode = DEFAULT_SIMULATOR_STATE.riemannMode,
  setRiemannMode,
  riemannStats = { vApprox: 0, vExact: 0, relErrorPct: 0, isLinearIntegrand: false },
  showElement = DEFAULT_SIMULATOR_STATE.showElement,
  setShowElement,
  xi = DEFAULT_SIMULATOR_STATE.xi,
  setXi,
  rangeA = 0,
  rangeB = 4,
  wireframe = DEFAULT_SIMULATOR_STATE.wireframe,
  setWireframe,
  opacity = DEFAULT_SIMULATOR_STATE.opacity,
  setOpacity,
  parserStatus = { isValid: true, error: null },
  gStatus = { isValid: true, error: null },
  activeTab: activeTabProp,
  setActiveTab: setActiveTabProp,
  preset: presetProp,
  setPreset: setPresetProp,
  cutAnglePref: cutAnglePrefProp,
  setCutAnglePref: setCutAnglePrefProp,
  onAxisDragChange,
  onResetDefaults,
}) {
  const [localTab, setLocalTab] = useState(DEFAULT_SIMULATOR_STATE.panelTab);
  const [localPreset, setLocalPreset] = useState(DEFAULT_SIMULATOR_STATE.preset);
  const [localCutAnglePref, setLocalCutAnglePref] = useState(DEFAULT_SIMULATOR_STATE.cutAnglePref);

  // Estado local ligero a 60 FPS para botones de eje y slider de desplazamiento k/c
  const [isAxisPending, startAxisTransition] = useTransition();
  const [optimisticAxis, setOptimisticAxis] = useState(null);
  const [dragOffset, setDragOffset] = useState(null);

  const rafRef = useRef(0);
  const idleTimerRef = useRef(null);
  const pendingOffsetRef = useRef(axisOffset);
  const hasPendingOffsetRef = useRef(false);
  const isDragReportedRef = useRef(false);
  const pointerCleanupRef = useRef(null);

  const displayedAxis = isAxisPending && optimisticAxis ? optimisticAxis : axis;
  const displayedOffset = dragOffset ?? axisOffset;

  const activeTab = activeTabProp ?? localTab;
  const setActiveTab = setActiveTabProp ?? setLocalTab;
  const preset = presetProp ?? localPreset;
  const setPreset = setPresetProp ?? setLocalPreset;
  const cutAnglePref = cutAnglePrefProp ?? localCutAnglePref;
  const setCutAnglePref = setCutAnglePrefProp ?? setLocalCutAnglePref;

  const reportAxisDrag = useCallback(
    (active) => {
      if (isDragReportedRef.current === active) return;
      isDragReportedRef.current = active;
      onAxisDragChange?.(active);
    },
    [onAxisDragChange]
  );

  const detachWindowPointerListeners = useCallback(() => {
    if (pointerCleanupRef.current) {
      pointerCleanupRef.current();
      pointerCleanupRef.current = null;
    }
  }, []);

  const finalizeOffsetDrag = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    detachWindowPointerListeners();
    if (hasPendingOffsetRef.current) {
      hasPendingOffsetRef.current = false;
      setAxisOffset?.(pendingOffsetRef.current);
    }
    setDragOffset(null);
    reportAxisDrag(false);
  }, [detachWindowPointerListeners, reportAxisDrag, setAxisOffset]);

  const cancelPendingAxisDrag = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    hasPendingOffsetRef.current = false;
    detachWindowPointerListeners();
    setDragOffset(null);
    setOptimisticAxis(null);
    reportAxisDrag(false);
  }, [detachWindowPointerListeners, reportAxisDrag]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current);
      detachWindowPointerListeners();
    };
  }, [detachWindowPointerListeners]);

  const handleAxisSelect = useCallback(
    (id) => {
      if (id === displayedAxis) return;
      setOptimisticAxis(id);
      startAxisTransition(() => {
        setAxis?.(id);
      });
    },
    [displayedAxis, setAxis]
  );

  const handleOffsetPointerDown = useCallback(() => {
    if (typeof window === 'undefined' || pointerCleanupRef.current) return;
    const onPointerEnd = () => {
      finalizeOffsetDrag();
    };
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);
    pointerCleanupRef.current = () => {
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
    };
  }, [finalizeOffsetDrag]);

  const handleOffsetChange = useCallback(
    (e) => {
      const nextVal = Math.round(parseFloat(e.target.value) * 10) / 10;
      if (!Number.isFinite(nextVal)) return;

      // Actualización inmediata a 60 FPS para el thumb y etiquetas visuales
      setDragOffset(nextVal);
      reportAxisDrag(true);

      pendingOffsetRef.current = nextVal;
      hasPendingOffsetRef.current = true;

      // Emisión throttled a máximo 1 vez por requestAnimationFrame hacia el motor 3D/2D
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0;
          if (!hasPendingOffsetRef.current) return;
          hasPendingOffsetRef.current = false;
          const valToCommit = pendingOffsetRef.current;
          startTransition(() => {
            setAxisOffset?.(valToCommit);
          });
        });
      }

      // Respaldo de estabilización a 150 ms tras inactividad (teclado o pausa prolongada)
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(finalizeOffsetDrag, 150);
    },
    [reportAxisDrag, setAxisOffset, finalizeOffsetDrag]
  );

  const handleResetDefaults = useCallback(() => {
    cancelPendingAxisDrag();
    onResetDefaults?.();
  }, [cancelPendingAxisDrag, onResetDefaults]);

  const applyPreset = useCallback(
    (p) => {
      cancelPendingAxisDrag();
      setPreset(p.label);
      setExpression(p.f);
      setUseG(Boolean(p.g));
      if (p.g) setGExpression(p.g);
      setAStr(p.a);
      setBStr(p.b);
      setAxis(p.axis);
      setAxisOffset(p.offset);
    },
    [cancelPendingAxisDrag, setPreset, setExpression, setUseG, setGExpression, setAStr, setBStr, setAxis, setAxisOffset]
  );

  const handlePresetSelect = useCallback(
    (e) => {
      const p = PRESETS.find((pr) => pr.label === e.target.value);
      if (p) applyPreset(p);
    },
    [applyPreset]
  );

  const diffName = displayedAxis === 'x' ? 'arandela' : 'capa cilíndrica';
  const diffPlural = displayedAxis === 'x' ? 'arandelas' : 'capas';
  const isCrossSectionActive = angleDeg < 359.5;

  const handleToggleCrossSection = useCallback(
    (enabled) => {
      setIsPlaying(false);
      setAngleDeg(enabled ? cutAnglePref : 360);
    },
    [setIsPlaying, setAngleDeg, cutAnglePref]
  );

  const handleSelectCutAngle = useCallback(
    (deg) => {
      setIsPlaying(false);
      setCutAnglePref(deg);
      setAngleDeg(deg);
    },
    [setIsPlaying, setCutAnglePref, setAngleDeg]
  );

  const handleToggleRiemann = useCallback(
    (checked) => {
      setShowRiemann(checked);
      if (checked && !riemannMode) setRiemannMode?.('left');
    },
    [setShowRiemann, riemannMode, setRiemannMode]
  );

  const handlePlayPause = useCallback(() => {
    if (!isPlaying && angleDeg >= 360) setAngleDeg(0);
    setIsPlaying?.(!isPlaying);
  }, [isPlaying, angleDeg, setAngleDeg, setIsPlaying]);

  const handleSetFullSolid = useCallback(() => {
    setIsPlaying?.(false);
    setAngleDeg(360);
  }, [setIsPlaying, setAngleDeg]);

  const handleResetAngle = useCallback(() => {
    setIsPlaying?.(false);
    setAngleDeg(0);
  }, [setIsPlaying, setAngleDeg]);

  const handleAngleSliderChange = useCallback(
    (e) => {
      setIsPlaying?.(false);
      setAngleDeg(parseFloat(e.target.value));
    },
    [setIsPlaying, setAngleDeg]
  );

  return (
    <aside
      translate="no"
      className={`${GLASS} notranslate w-full h-full shrink-0 flex flex-col overflow-hidden text-slate-800 select-none`}
    >
      {/* Header */}
      <div className="p-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm text-slate-800 tracking-tight truncate">Panel de control</h1>
              <p className="text-[11px] text-slate-500 truncate">Define la región, el eje y el giro</p>
            </div>
          </div>

          {onResetDefaults && (
            <button
              type="button"
              onClick={handleResetDefaults}
              title="Restablecer todos los controles y la cámara 3D a valores por defecto"
              className="px-2 py-1 rounded-lg bg-white/90 hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-blue-700 border border-slate-200 text-[11px] font-medium shadow-xs flex items-center gap-1 transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3 text-blue-600" />
              <span>Restablecer</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 mt-3 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 text-[11px] xl:text-xs font-semibold">
          {PANEL_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-1 xl:gap-1.5 py-1.5 px-1 sm:px-1.5 rounded-lg transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer whitespace-nowrap min-w-0 ${
                activeTab === id
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
        {/* Quick Presets */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Ejemplos didácticos
          </label>
          <select
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            value={preset}
            onChange={handlePresetSelect}
          >
            <option value="" disabled>
              Selecciona un ejemplo...
            </option>
            {PRESETS.map((p) => (
              <option key={p.label} value={p.label} className="bg-white text-slate-800">
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {activeTab === 'parameters' && (
          <>
            {/* f(x) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700">
                  {useG ? 'Curva superior' : 'Curva generatriz'}{' '}
                  <span className="text-blue-600 font-mono">f(x)</span>
                </label>
                <Badge ok={parserStatus.isValid} />
              </div>
              <input
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="ej. sqrt(x), x^2, sin(x)"
                spellCheck={false}
                className={`${inputBase} ${parserStatus.isValid ? inputOk : inputBad}`}
              />
              {parserStatus.error && <p className="text-[11px] text-rose-600">{parserStatus.error}</p>}
            </div>

            {/* Region between two curves */}
            <div className="space-y-2">
              <Toggle
                checked={useG}
                onChange={setUseG}
                title="Región entre dos curvas (g(x))"
                subtitle="Método de arandelas: V = π ∫ [R(x)² − r(x)²] dx"
              />
              {useG && (
                <div className="space-y-1.5 border-l-2 border-indigo-400/70 ml-1.5 pl-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">
                      Curva inferior <span className="text-indigo-600 font-mono">g(x)</span>{' '}
                      <span className="text-slate-400 font-normal">(piso)</span>
                    </label>
                    <Badge ok={gStatus.isValid} />
                  </div>
                  <input
                    type="text"
                    value={gExpression}
                    onChange={(e) => setGExpression(e.target.value)}
                    placeholder="ej. x^2, 0.5*x, -1"
                    spellCheck={false}
                    className={`${inputBase} ${gStatus.isValid ? inputOk : inputBad}`}
                  />
                  {gStatus.error && <p className="text-[11px] text-rose-600">{gStatus.error}</p>}
                </div>
              )}
              {!useG && (
                <p className="text-[11px] text-slate-500 px-1">
                  Sin g(x), la región queda entre f(x) y el eje x (g(x) = 0).
                </p>
              )}
            </div>

            {/* Interval Bounds [a, b] */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Límite inf. (a)</label>
                <input
                  type="text"
                  value={aStr}
                  onChange={(e) => setAStr(e.target.value)}
                  spellCheck={false}
                  className={`${inputBase} !py-1.5 !text-xs ${boundsStatus.aOk ? inputOk : inputBad}`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Límite sup. (b)</label>
                <input
                  type="text"
                  value={bStr}
                  onChange={(e) => setBStr(e.target.value)}
                  spellCheck={false}
                  className={`${inputBase} !py-1.5 !text-xs ${boundsStatus.bOk ? inputOk : inputBad}`}
                />
              </div>
              <p className={`col-span-2 text-[11px] flex items-start gap-1 ${boundsStatus.message ? 'text-rose-600' : 'text-slate-500'}`}>
                {boundsStatus.message ? (
                  <>
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> {boundsStatus.message}
                  </>
                ) : (
                  'Acepta números y expresiones: pi, pi/2, 2*pi, sqrt(2)…'
                )}
              </p>
            </div>

            {/* Axis of Revolution */}
            <div className="space-y-2">
              <label className="text-xs text-slate-600 font-medium">Eje de giro / revolución</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'x', label: `Horizontal (y = ${displayedOffset})` },
                  { id: 'y', label: `Vertical (x = ${displayedOffset})` },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleAxisSelect(id)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer ${
                      displayedAxis === id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/25'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-blue-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Desplazamiento del eje ({displayedAxis === 'x' ? 'k' : 'c'})</span>
                  <span className="font-mono text-blue-700 font-semibold tabular-nums">{displayedOffset}</span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.2"
                  value={displayedOffset}
                  onPointerDown={handleOffsetPointerDown}
                  onPointerUp={finalizeOffsetDrag}
                  onPointerCancel={finalizeOffsetDrag}
                  onBlur={finalizeOffsetDrag}
                  onChange={handleOffsetChange}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Method (automatic) */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/80 border border-blue-200/80 text-[11px] text-blue-800">
              <Layers className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-600" />
              <span>
                <b className="text-blue-900">Método:</b>{' '}
                {displayedAxis === 'x'
                  ? 'discos / arandelas (cortes perpendiculares al eje horizontal).'
                  : 'capas cilíndricas (cortes paralelos al eje vertical).'}{' '}
                Se elige automáticamente según el eje.
              </span>
            </div>
          </>
        )}

        {/* Tab 2: Differential element + Riemann */}
        {activeTab === 'riemann' && (
          <div className="space-y-4">
            <Toggle
              checked={showElement}
              onChange={setShowElement}
              title="Mostrar elemento diferencial"
              subtitle={`Rectángulo 2D ⇄ ${diffName} 3D en x = xᵢ`}
            />

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>
                  Posición <span className="font-mono">xᵢ</span> en [a, b]
                </span>
                <span className="font-mono text-amber-600 font-bold tabular-nums">{xi.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min={rangeA}
                max={rangeB}
                step={(rangeB - rangeA) / 400 || 0.01}
                value={xi}
                onChange={(e) => setXi(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                También puedes arrastrar sobre el plano 2D para mover el elemento.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Espesor dx = (b − a) / N · N =</span>
                <span className="font-mono text-blue-700 font-bold tabular-nums">{slicesCount}</span>
              </div>
              <input
                type="range"
                min="4"
                max="120"
                step="2"
                value={slicesCount}
                onChange={(e) => setSlicesCount(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <Toggle
              checked={showRiemann}
              onChange={handleToggleRiemann}
              title="Aproximación de Riemann"
              subtitle={`Mostrar las N ${diffPlural}; altura evaluada en el punto muestra xᵢ*`}
            />

            {/* Selector del punto muestra x_i* (Izquierda / Derecha / Punto Medio) */}
            {showRiemann && (
              <div className={`${GLASS_INNER} p-2.5 space-y-1.5`}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">
                    Punto muestra <span className="font-mono text-blue-700">xᵢ*</span> por subintervalo:
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                    {riemannMode === 'left'
                      ? 'a + i·Δx'
                      : riemannMode === 'right'
                        ? 'a + (i+1)·Δx'
                        : 'a + (i+0.5)·Δx'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'left', label: 'Izquierda' },
                    { id: 'right', label: 'Derecha' },
                    { id: 'midpoint', label: 'Punto Medio' },
                  ].map(({ id, label }) => {
                    const active = riemannMode === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setRiemannMode?.(id)}
                        className={`py-1.5 px-2 rounded-md border text-[11px] font-semibold transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer ${
                          active
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-blue-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comparative Card: Riemann vs Exact Integral */}
            {showRiemann && riemannStats && (
              <div className="rounded-xl p-3 bg-gradient-to-br from-blue-50/90 via-white to-amber-50/80 border border-blue-200/80 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-blue-100 pb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                    Riemann vs. Integral Exacta
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 tabular-nums">
                    N = {slicesCount} {diffPlural}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white rounded-lg p-2 border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">
                      Suma Riemann (V<sub>aprox</sub>)
                    </span>
                    <span className="font-mono font-bold text-blue-700 text-sm tabular-nums">
                      {riemannStats.vApprox.toFixed(4)} <span className="text-[10px] font-normal text-slate-500">u³</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block tabular-nums">
                      ≈ {(riemannStats.vApprox / Math.PI).toFixed(4)}π
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-2 border border-amber-200/80">
                    <span className="text-[10px] text-slate-500 block">
                      Volumen Exacto (V<sub>exacto</sub>)
                    </span>
                    <span className="font-mono font-bold text-amber-600 text-sm tabular-nums">
                      {riemannStats.vExact.toFixed(4)} <span className="text-[10px] font-normal text-slate-500">u³</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block tabular-nums">
                      ≈ {(riemannStats.vExact / Math.PI).toFixed(4)}π
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      Error relativo |V<sub>exacto</sub> − V<sub>aprox</sub>| / V<sub>exacto</sub>:
                    </span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        riemannStats.relErrorPct < 0.5
                          ? 'text-emerald-600'
                          : riemannStats.relErrorPct < 3
                            ? 'text-amber-600'
                            : 'text-rose-600'
                      }`}
                    >
                      {riemannStats.relErrorPct.toFixed(3)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-amber-400 transition-all duration-200"
                      style={{
                        width: `${Math.max(2, Math.min(100, 100 - riemannStats.relErrorPct * 4))}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Al aumentar <b className="text-slate-800">N → ∞</b>, el espesor <b className="text-slate-800">dx → 0</b> y el error relativo converge a <b className="text-amber-700">0.000%</b>.
                  </p>
                  {riemannMode === 'midpoint' && riemannStats.isLinearIntegrand && (
                    <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 leading-relaxed">
                      <b>Nota (Punto Medio):</b> En esta función el integrando es lineal en <i>x</i> (p. ej. <i>R(x)² = x</i>), por lo que en cada subintervalo el exceso de una mitad compensa exactamente el defecto de la otra. Prueba <b>Izquierda</b> o <b>Derecha</b> para observar el error con <i>N</i> finito.
                    </p>
                  )}
                </div>
              </div>
            )}

            {!showRiemann && (
              <p className="text-[11px] text-slate-500">
                Activa la aproximación de Riemann para comparar la suma finita de {diffPlural} frente al volumen exacto.
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Display Settings (Renderizado y Cortes) */}
        {activeTab === 'display' && (
          <div className="space-y-4">
            {/* Cross-Section Toggle (180° / 270°) */}
            <div className={`${GLASS_INNER} space-y-2 p-3`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Scissors className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Corte Transversal (180° / 270°)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Abre el sólido para observar el hueco interior generado por r(x)
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isCrossSectionActive}
                  onChange={(e) => handleToggleCrossSection(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer shrink-0"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[
                  { deg: 180, label: '180° (Mitad)' },
                  { deg: 270, label: '270° (3/4)' },
                  { deg: 360, label: '360° (Cerrado)' },
                ].map(({ deg, label }) => {
                  const active = Math.round(angleDeg) === deg;
                  return (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => handleSelectCutAngle(deg)}
                      className={`py-1.5 px-2 rounded-md border text-[11px] font-mono font-semibold transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer ${
                        active
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-blue-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opacity / Transparency Slider (0.1 to 1.0) */}
            <div className={`${GLASS_INNER} space-y-1.5 p-3`}>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-800">Transparencia del Sólido (Opacidad)</span>
                <span className="font-mono text-blue-700 font-bold tabular-nums">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Ajusta entre 0.1 y 1.0 para que la {diffName} dorada interna{' '}
                <span className="font-mono text-amber-600 font-semibold">dx</span> sea visible incluso con el sólido cerrado.
              </p>
            </div>

            {/* Wireframe Checkbox */}
            <Toggle
              checked={wireframe}
              onChange={setWireframe}
              title="Ver Wireframe / Malla"
              subtitle="Activa la visualización en líneas de la geometría tridimensional"
            />
          </div>
        )}

        {/* Revolution sweep (always accessible) */}
        <div className="pt-3 border-t border-slate-200/80 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">Barrido angular (giro)</span>
            <span className="font-mono font-bold text-blue-700 text-sm tabular-nums">{Math.round(angleDeg)}°</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayPause}
              className="p-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold transition-all duration-150 active:scale-[0.97] transform-gpu shadow-md shadow-amber-500/25 cursor-pointer"
              title={isPlaying ? 'Pausar giro' : 'Reproducir giro'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              type="button"
              onClick={handleSetFullSolid}
              className="p-2 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer"
              title="Sólido completo 360°"
            >
              <Box className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetAngle}
              className="p-2 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 transition-all duration-150 active:scale-[0.97] transform-gpu cursor-pointer"
              title="Reiniciar a 0°"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={angleDeg}
              onChange={handleAngleSliderChange}
              className="flex-1 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Revolución Angular (Disparador de Animación 3D) */}
          <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-700 leading-tight">Revolución Angular</span>
              <span className="text-[11px] text-slate-500 leading-tight">Generación del sólido</span>
            </div>

            <button
              type="button"
              onClick={startRevolutionAnimation}
              disabled={isAnimatingPreset}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                isAnimatingPreset
                  ? 'bg-amber-500 text-slate-950 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              }`}
            >
              {isAnimatingPreset ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Animando...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Animar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
});

export default ControlsPanel;
