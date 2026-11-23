import { Outlet } from 'react-router';

import { cn } from '@/core/lib';

import { BrandMark } from '../BrandMark';
import { ShellDock } from '../ShellDock';
import { useImmersive } from '../useImmersive';
import { useShellNav } from '../useShellNav';

/**
 * Carcasa del perfil CLIENTE: pensada para móvil y para usarse en mitad de un
 * entreno (ARQUITECTURA §7). Sin barra de título: la marca del coach flota
 * arriba como una píldora y cada pantalla pone su titular grande. Abajo, la
 * barra de navegación flotante (D-prime1-6). El idioma está en el Perfil.
 * Mientras se entrena (pantalla `immersive`), sin marca ni barra (D-prime2-1).
 */
export function ClientLayout() {
  const items = useShellNav('client');
  const immersive = useImmersive();

  return (
    <div className="relative flex flex-1 flex-col">
      {immersive ? null : (
        <header className="relative z-10 mx-auto flex w-full max-w-xl items-center justify-between px-5 pt-[calc(var(--safe-top)+1rem)]">
          <BrandMark variant="chip" />
        </header>
      )}
      {/* Deja sitio a la barra flotante y a la de gestos del móvil. */}
      <main
        className={cn(
          'relative mx-auto w-full max-w-xl flex-1 px-5',
          immersive
            ? 'pt-[calc(var(--safe-top)+1rem)] pb-[calc(2rem+var(--safe-bottom))]'
            : 'pt-8 pb-[var(--dock-space)]',
        )}
      >
        <Outlet />
      </main>
      {immersive ? null : <ShellDock items={items} />}
    </div>
  );
}
