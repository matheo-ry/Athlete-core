import { useCallback, useLayoutEffect, useState } from 'react';

/**
 * Ancho real de un elemento en píxeles, actualizado al cambiar de tamaño.
 * Usa una ref de función para medir también un elemento que aparece más tarde
 * (por ejemplo, cuando una gráfica pasa de "sin datos" a tener puntos).
 */
export function useElementWidth<T extends HTMLElement>(fallback: number) {
  const [element, setElement] = useState<T | null>(null);
  const [width, setWidth] = useState(fallback);

  const ref = useCallback((node: T | null) => setElement(node), []);

  useLayoutEffect(() => {
    if (element === null) return undefined;
    const measure = () => {
      const measured = element.getBoundingClientRect().width;
      if (measured > 0) setWidth(Math.round(measured));
    };
    measure();
    // En los tests (jsdom) no existe ResizeObserver: se queda el ancho de reserva.
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [ref, width] as const;
}
