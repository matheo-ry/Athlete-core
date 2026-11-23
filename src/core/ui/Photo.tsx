import { cn } from '../lib';

import { PHOTOS } from './photos';
import type { PhotoName } from './photos';

interface PhotoProps {
  name: PhotoName;
  className?: string;
  /**
   * Velo para que el texto blanco se lea encima: `bottom` oscurece la parte de
   * abajo (texto al pie), `full` toda la foto y `none`, nada.
   */
  scrim?: 'bottom' | 'full' | 'none';
  /** Carga la foto cuanto antes: solo para la que se ve al abrir la pantalla. */
  priority?: boolean;
}

/**
 * Una foto de la app a toda la superficie de su contenedor (que debe tener
 * `position`). Lleva el tono del color del coach, un velo y grano de película.
 * Es decoración: `alt` vacío y oculta a los lectores de pantalla.
 */
export function Photo({ name, className, scrim = 'bottom', priority = false }: PhotoProps) {
  const photo = PHOTOS[name];

  return (
    <div aria-hidden="true" className={cn('absolute inset-0 overflow-hidden', className)}>
      <img
        src={photo.src}
        alt=""
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        style={{ objectPosition: photo.focus, backgroundImage: `url(${photo.blur})` }}
        className="size-full bg-cover bg-center object-cover"
      />
      {/* El color del coach tiñe el blanco y negro. */}
      <div className="bg-primary absolute inset-0 opacity-35 mix-blend-color" />
      <div className="bg-primary absolute inset-0 opacity-10 mix-blend-soft-light" />
      {scrim === 'none' ? null : (
        <div
          className={cn('absolute inset-0', scrim === 'bottom' ? 'scrim-bottom' : 'bg-scrim/60')}
        />
      )}
      <div className="grain absolute inset-0 opacity-[0.22]" />
    </div>
  );
}
