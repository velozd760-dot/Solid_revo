/**
 * Hook: useDebouncedValue
 * Retrasa la propagación de un objeto de valores primitivos (comparado por contenido).
 * Útil para no lanzar el cálculo simbólico ni KaTeX en cada pulsación de tecla o arrastre activo.
 */
import { useEffect, useState } from 'react';

export function useDebouncedValue(value, delay = 300, paused = false) {
  const [debounced, setDebounced] = useState(value);
  let key = '';
  try {
    key = JSON.stringify(value) ?? '';
  } catch {
    key = '';
  }

  useEffect(() => {
    if (paused || !key) return undefined;
    const id = setTimeout(() => {
      try {
        setDebounced(JSON.parse(key));
      } catch {
        // Ignora cadenas JSON corruptas o no válidas
      }
    }, delay);
    return () => clearTimeout(id);
  }, [key, delay, paused]);

  return debounced;
}
