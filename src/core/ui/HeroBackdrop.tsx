import { cn } from '../lib';

import { Photo } from './Photo';
import type { PhotoName } from './photos';

interface HeroBackdropProps {
  photo: PhotoName;
  /**
   * Alto de la foto: `tall` (por defecto) casi toda la pantalla del móvil,
   * `short` una cabecera, `screen` la pantalla entera.
   */
  size?: 'tall' | 'short' | 'screen';
}

const SIZES: Record<NonNullable<HeroBackdropProps['size']>, string> = {
  tall: 'h-[78svh] max-h-[760px]',
  short: 'h-[62svh] md:h-[560px]',
  screen: 'h-svh',
};

/**
 * La foto de cabecera de una pantalla (D-prime1-3): fija detrás del contenido,
 * a todo el ancho, y se funde con el fondo por abajo. Al desplazar, el
 * contenido pasa por encima y la foto se aleja despacio. Va FUERA de cualquier
 * bloque animado: un `transform` en un padre rompería el `fixed`.
 */
export function HeroBackdrop({ photo, size = 'tall' }: HeroBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 -z-10 overflow-hidden',
        '[mask-image:linear-gradient(180deg,#000_62%,transparent)]',
        SIZES[size],
      )}
    >
      <div className="hero-drift absolute inset-0 origin-top">
        <Photo name={photo} priority />
        <div className="scrim-side absolute inset-0 hidden md:block" />
      </div>
    </div>
  );
}
