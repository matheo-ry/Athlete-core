import { useTranslation } from 'react-i18next';

import { TemplateItemList } from '../shared/TemplateItemList';

// Las pantallas solo componen piezas: la lógica vive en api/ y en model/.
export function TemplateCoachPage() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('template.coach.title')}</h1>
        <p className="text-muted">{t('template.coach.description')}</p>
      </header>
      <TemplateItemList />
    </section>
  );
}
