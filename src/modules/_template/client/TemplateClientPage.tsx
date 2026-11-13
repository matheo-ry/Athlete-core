import { useTranslation } from 'react-i18next';

import { TemplateItemList } from '../shared/TemplateItemList';

// Las pantallas solo componen piezas: la lógica vive en api/ y en model/.
export function TemplateClientPage() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('template.client.title')}</h1>
        <p className="text-muted">{t('template.client.description')}</p>
      </header>
      <TemplateItemList />
    </section>
  );
}
