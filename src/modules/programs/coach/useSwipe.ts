import { useRef } from 'react';
import type { TouchEvent } from 'react';

/** Cuánto hay que mover el dedo, en píxeles, para que cuente como deslizar. */
const MIN_DISTANCE = 60;

interface Swipe {
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Deslizar con el dedo hacia los lados (D-106): a la izquierda, el siguiente;
 * a la derecha, el anterior. Solo cuenta un gesto claramente horizontal, para
 * no estorbar al bajar por la pantalla.
 */
export function useSwipe({ onPrevious, onNext }: Swipe) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (event: TouchEvent) => {
      const touch = event.touches[0];
      start.current = touch === undefined ? null : { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      const from = start.current;
      start.current = null;
      if (touch === undefined || from === null) {
        return;
      }
      const dx = touch.clientX - from.x;
      const dy = touch.clientY - from.y;
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 2) {
        return;
      }
      if (dx < 0) {
        onNext();
      } else {
        onPrevious();
      }
    },
  };
}
