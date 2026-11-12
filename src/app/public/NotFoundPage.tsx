import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { EmptyState, buttonClassName } from '@/core/ui';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('app.notFound.title')}
      description={t('app.notFound.description')}
      action={
        <Link to="/" className={buttonClassName('primary')}>
          {t('app.notFound.action')}
        </Link>
      }
    />
  );
}
