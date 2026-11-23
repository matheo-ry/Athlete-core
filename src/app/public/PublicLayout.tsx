import { Outlet } from 'react-router';

import { LanguageSwitcher } from '@/core/i18n';

import { BrandMark } from '../BrandMark';

/** Marco de las pantallas de entrada: sin menú, contenido centrado. */
export function PublicLayout() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 px-5 pt-4">
        <BrandMark />
        <LanguageSwitcher />
      </header>
      <main className="animate-rise mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-7 px-5 py-10">
        <Outlet />
      </main>
    </div>
  );
}
