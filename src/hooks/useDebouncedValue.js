/**
 * Hook: useDebouncedValue
 * Retrasa la propagación de un objeto de valores primitivos (comparado por contenido).
 * Útil para no lanzar el cálculo simbólico en cada pulsación de tecla.
 */
import { useEffect, useState } from 'react';

export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  let key = '';
  try {
    key = JSON.stringify(value) ?? '';
  } catch {
    key = '';
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if (!key) return;
      try {
        setDebounced(JSON.parse(key));
      } catch {
        // Ignora cadenas JSON corruptas o no válidas
      }
    }, delay);
    return () => clearTimeout(id);
  }, [key, delay]);

  return debounced;
}
