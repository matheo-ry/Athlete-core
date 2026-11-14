import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { buttonClassName } from '@/core/ui';

interface CreateAccountLinkProps {
  email: string;
}

/** "Crear cuenta", resaltado, cuando el email escrito no tiene cuenta (D-043). */
export function CreateAccountLink({ email }: CreateAccountLinkProps) {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <Link to={`/signup${location.search}`} state={{ email }} className={buttonClassName('primary')}>
      {t('app.login.createAccount')}
    </Link>
  );
}
