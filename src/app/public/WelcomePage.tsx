import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { buttonClassName } from '@/core/ui';

import { SignOutButton } from '../SignOutButton';

/**
 * Bienvenida para quien tiene sesión pero ningún espacio activo (ARQUITECTURA §7,
 * DECISIONES D-056). Escribir un código lleva a /join; crear el negocio llega en
 * el PR 1.12 y la pantalla definitiva, en el PR 1.9.
 */
export function WelcomePage() {
  const { t } = useTranslation();

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">{t('app.welcome.title')}</h1>
        <p className="text-muted">{t('app.welcome.description')}</p>
      </header>
      <div className="flex flex-col gap-3">
        <Link to="/join" className={buttonClassName('primary')}>
          {t('app.welcome.clientOption')}
        </Link>
      </div>
      <SignOutButton />
    </>
  );
}
