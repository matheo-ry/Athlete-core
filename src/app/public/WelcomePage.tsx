import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { lostAccessTo, useTenancyContext } from '@/core/tenancy';
import { buttonClassName } from '@/core/ui';

import { SignOutButton } from '../SignOutButton';
import { InviteCodeForm } from './InviteCodeForm';

/**
 * Para quien tiene sesión pero ningún espacio activo (ARQUITECTURA §7,
 * DECISIONES D-055 y D-056): escribir el código de un coach, crear su negocio
 * (PR 1.12) o cerrar sesión. Si su coach lo dio de baja, se le dice: "Ya no
 * tienes acceso a …". Se ve con la marca de ATHLETE CORE: ya no tiene coach.
 */
export function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { memberships } = useTenancyContext();
  const formerCoach = lostAccessTo(memberships);

  return (
    <>
      {formerCoach === null ? (
        <header>
          <h1 className="text-2xl font-bold">{t('app.welcome.title')}</h1>
          <p className="text-muted">{t('app.welcome.description')}</p>
        </header>
      ) : (
        <header>
          <h1 className="text-2xl font-bold">
            {t('app.welcome.lostAccessTitle', { name: formerCoach })}
          </h1>
          <p className="text-muted">{t('app.welcome.lostAccessDescription')}</p>
        </header>
      )}
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
