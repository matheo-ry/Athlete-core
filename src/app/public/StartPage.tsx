import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { buttonClassName } from '@/core/ui';

import { InviteCodeForm } from './InviteCodeForm';

/**
 * La primera pantalla, sin sesión (D-037): el código del coach en primer plano,
 * porque casi todos los que abren la app por primera vez son clientes con un
 * código. El idioma está arriba (PublicLayout).
 */
export function StartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">{t('app.start.title')}</h1>
        <p className="text-muted">{t('app.start.description')}</p>
      </header>
      <InviteCodeForm onSubmit={(code) => void navigate(`/join?code=${code}`)} />
      <nav className="border-border flex flex-col gap-1 border-t pt-4">
        <Link to="/login" className={buttonClassName('ghost')}>
          {t('app.start.haveAccount')}
        </Link>
        <Link to="/create-business" className={buttonClassName('ghost')}>
          {t('app.start.isCoach')}
        </Link>
      </nav>
    </>
  );
}
