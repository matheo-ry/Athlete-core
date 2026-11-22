import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { rememberCoachIntent } from '@/core/tenancy';
import { buttonClassName, Icon, StateOrbit } from '@/core/ui';

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
      <header className="flex flex-col gap-5">
        <StateOrbit>
          <Icon name="dumbbell" className="text-primary-readable size-7" />
        </StateOrbit>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl leading-[1.02] font-semibold md:text-5xl">
            {t('app.start.title')}
          </h1>
          <p className="text-muted text-lg leading-7">{t('app.start.description')}</p>
        </div>
      </header>
      <InviteCodeForm onSubmit={(code) => void navigate(`/join?code=${code}`)} />
      <nav className="border-border flex flex-col gap-1 border-t pt-5">
        <Link to="/login" className={buttonClassName('ghost')}>
          {t('app.start.haveAccount')}
        </Link>
        {/* D-037: "Soy coach" lleva al registro y, al terminar, a crear el negocio. */}
        <Link
          to={`/signup?${new URLSearchParams({ next: '/create-business' }).toString()}`}
          onClick={() => rememberCoachIntent()}
          className={buttonClassName('ghost')}
        >
          {t('app.start.isCoach')}
        </Link>
      </nav>
    </>
  );
}
