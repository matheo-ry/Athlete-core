import { Outlet, useLocation } from 'react-router';

import { LanguageSwitcher } from '@/core/i18n';

import { BottomNav } from '../BottomNav';
import { BrandMark } from '../BrandMark';
import { useShellNav } from '../useShellNav';

/**
 * Carcasa del perfil CLIENTE: pensada para móvil y para usarse en mitad de un
 * entreno. Barra inferior flotante siempre, contenido en una columna
 * (ARQUITECTURA §7).
 */
export function ClientLayout() {
  const items = useShellNav('client');
  const { pathname } = useLocation();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 px-5 pt-4">
        <BrandMark />
        <LanguageSwitcher />
      </header>
      {/* Deja sitio a la barra inferior flotante y a la de gestos del móvil. */}
      <main className="mx-auto w-full max-w-xl flex-1 px-5 pt-5 pb-[calc(6.5rem+var(--safe-bottom))]">
        {/* Cada pantalla entra con un pequeño ascenso; al cambiar de ruta, de nuevo. */}
        <div key={pathname} className="animate-rise">
          <Outlet />
        </div>
      </main>
      <BottomNav items={items} />
    </div>
  );
}
