import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { buttonClassName } from '@/core/ui';

/**
 * Bienvenida para quien todavía no pertenece a ningún tenant (ARQUITECTURA §7).
 * En la Fase 0 solo navega; crear el negocio y unirse con código llegan en la Fase 1.
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
        <Link to="/coach" className={buttonClassName('primary')}>
          {t('app.welcome.coachOption')}
        </Link>
        <Link to="/join" className={buttonClassName('secondary')}>
          {t('app.welcome.clientOption')}
        </Link>
      </div>
    </>
  );
}
