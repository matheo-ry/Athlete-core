import { Outlet } from 'react-router';

import { LanguageSwitcher } from '@/core/i18n';

import { BrandMark } from '../BrandMark';

/** Marco de las pantallas de entrada: sin menú, contenido centrado. */
export function PublicLayout() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-2">
        <BrandMark />
        <LanguageSwitcher />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
