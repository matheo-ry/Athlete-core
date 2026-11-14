import { useTranslation } from 'react-i18next';

import { Card } from '@/core/ui';

/**
 * Ajustes del coach. Aquí llegarán "Mi cuenta" (PR 1.13), "Mis espacios"
 * (PR 1.14) y la marca (PR 1.15 y 1.16).
 */
export function CoachSettingsPage() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('app.coachSettings.title')}</h1>
      </header>
      <Card>
        <p className="text-muted">{t('app.coachSettings.soon')}</p>
      </Card>
    </section>
  );
}
