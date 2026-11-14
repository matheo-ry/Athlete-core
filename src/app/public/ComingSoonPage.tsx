import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Button } from '@/core/ui';

/** Crear negocio llega en el PR 1.12. Hasta entonces, este aviso. */
export function ComingSoonPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">{t('app.comingSoon.title')}</h1>
        <p className="text-muted">{t('app.comingSoon.createBusiness')}</p>
      </header>
      <Button variant="ghost" onClick={() => void navigate(-1)}>
        {t('app.comingSoon.back')}
      </Button>
    </>
  );
}
