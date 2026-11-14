import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { buttonClassName } from '@/core/ui';

import { SignOutButton } from '../SignOutButton';
import { InviteCodeForm } from './InviteCodeForm';

/**
 * Bienvenida para quien tiene sesión pero ningún espacio activo (ARQUITECTURA §7,
 * DECISIONES D-056): escribir el código de un coach, crear su negocio (PR 1.12)
 * o cerrar sesión.
 */
export function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">{t('app.welcome.title')}</h1>
        <p className="text-muted">{t('app.welcome.description')}</p>
      </header>
      <InviteCodeForm onSubmit={(code) => void navigate(`/join?code=${code}`)} />
      <div className="border-border flex flex-col gap-2 border-t pt-4">
        <Link to="/create-business" className={buttonClassName('secondary')}>
          {t('app.welcome.createBusiness')}
        </Link>
        <SignOutButton />
      </div>
    </>
  );
}
