import type { CSSProperties } from 'react';

/**
 * Retraso de la entrada (`animate-enter`) para escalonar los bloques de una
 * pantalla: el primero a 0 ms, el siguiente a 80 ms…
 */
export function enterDelay(ms: number): CSSProperties {
  // Las variables CSS no están en el tipo de `style`: se declaran así.
  return { '--enter-delay': `${String(ms)}ms` } as CSSProperties;
}
