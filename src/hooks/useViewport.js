import { useEffect, useState } from 'react';

export const MOBILE_BREAKPOINT_QUERY =
  '(max-width: 767px), ((max-width: 1023px) and (max-height: 540px))';

/**
 * Detecta renderizadores WebGL por software (SwiftShader, llvmpipe, WARP)
 * para limitar el costo de pixelRatio/antialiasing sin alterar la escena.
 */
export function detectSoftwareWebGL() {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

/**
 * Hook reactivo para detectar viewport móvil/estrecho mediante MediaQueryList.
 * Permite montar una sola instancia de Canvas3D/Canvas2D según el tamaño de pantalla.
 */
export function useIsMobileViewport(query = MOBILE_BREAKPOINT_QUERY) {
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

/**
 * Sincroniza DPR, orientación (portrait/landscape) y dimensiones del viewport móvil,
 * escuchando `resize`, `orientationchange` y `visualViewport`.
 */
export function useViewportMetrics() {
  const isMobile = useIsMobileViewport(MOBILE_BREAKPOINT_QUERY);

  const [metrics, setMetrics] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1280, height: 800, dpr: 1, isPortrait: false };
    }
    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 800;
    return {
      width,
      height,
      dpr: window.devicePixelRatio || 1,
      isPortrait: height >= width,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let orientationTimer = null;
    const sync = () => {
      const width = window.visualViewport?.width || window.innerWidth || 1280;
      const height = window.visualViewport?.height || window.innerHeight || 800;
      const dpr = window.devicePixelRatio || 1;
      const isPortrait = height >= width;

      setMetrics((prev) =>
        prev.width === width &&
        prev.height === height &&
        prev.dpr === dpr &&
        prev.isPortrait === isPortrait
          ? prev
          : { width, height, dpr, isPortrait }
      );
    };

    const handleOrientationChange = () => {
      sync();
      if (orientationTimer) clearTimeout(orientationTimer);
      // Mobile Safari/Chrome actualizan visualViewport unos milisegundos después de rotar
      orientationTimer = setTimeout(sync, 140);
    };

    window.addEventListener('resize', sync, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });
    window.visualViewport?.addEventListener('resize', sync, { passive: true });

    return () => {
      if (orientationTimer) clearTimeout(orientationTimer);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.visualViewport?.removeEventListener('resize', sync);
    };
  }, []);

  return {
    isMobile,
    ...metrics,
  };
}
