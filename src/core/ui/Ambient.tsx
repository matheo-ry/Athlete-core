import { PHOTOS } from './photos';
import type { PhotoName } from './photos';

interface AmbientProps {
  photo?: PhotoName;
}

/**
 * El fondo de toda la app (D-prime1-4): una foto diminuta y desenfocada, bañada
 * con los dos colores del coach, con grano y viñeta. Es lo que se ve a través
 * del cristal de las tarjetas. Se pinta una vez (fijo) y respira muy despacio.
 */
export function Ambient({ photo = 'rack' }: AmbientProps) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      <div
        style={{ backgroundImage: `url(${PHOTOS[photo].blur})` }}
        className="light:opacity-[0.16] light:mix-blend-luminosity absolute inset-0 bg-cover bg-center opacity-50 blur-2xl motion-safe:animate-[ambient-breathe_38s_ease-in-out_infinite]"
      />
      <div className="bg-primary light:opacity-[0.16] absolute -top-1/4 -left-1/4 size-[85vmax] rounded-full opacity-[0.22] mix-blend-screen blur-[120px] light:mix-blend-multiply" />
      <div className="bg-accent light:opacity-[0.1] absolute -right-1/3 -bottom-1/3 size-[70vmax] rounded-full opacity-[0.12] mix-blend-screen blur-[140px] light:mix-blend-multiply" />
      {/* Viñeta: los bordes caen a negro (o a perla en claro) y centran la vista. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_20%,transparent_40%,var(--brand-background)_100%)]" />
      <div className="grain absolute inset-0 opacity-[0.16]" />
    </div>
  );
}
