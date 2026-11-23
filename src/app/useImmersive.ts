import { useMatches } from 'react-router';

function isImmersiveHandle(handle: unknown): boolean {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    'immersive' in handle &&
    handle.immersive === true
  );
}

/**
 * Si la pantalla abierta es "a pantalla completa" (D-prime2-1): la carcasa
 * oculta entonces la barra de navegación y la marca. Lo marca el módulo en su
 * manifest (`immersive`) y `router.tsx` lo pasa como `handle` de la ruta.
 */
export function useImmersive(): boolean {
  return useMatches().some((match) => isImmersiveHandle(match.handle));
}
