import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useLanguage } from '@/core/i18n';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  segmentClassName,
  SEGMENTED_GROUP_CLASS,
  SkeletonList,
} from '@/core/ui';

import { useTemplates } from '../api/useTemplates';
import { countByTab, visibleTemplates } from '../model/template-list';
import type { TemplateTab } from '../model/template-list';
import { AssignedList } from './AssignedList';
import { NewTemplateForm } from './NewTemplateForm';
import { TemplateRow } from './TemplateRow';
import type { TemplateNotice } from './TemplateRow';

type Tab = TemplateTab | 'assigned';
const TABS: readonly Tab[] = ['active', 'archived', 'assigned'];

/**
 * Las plantillas del coach (PR 2.7, D-085): "Activas" y "Archivadas" con su
 * número, buscador y "Nueva plantilla"; y "Asignadas", la rutina de cada
 * cliente (PR 2.13b).
 */
export function TemplateListPage() {
  const { t } = useTranslation();
  const language = useLanguage();
  const templates = useTemplates();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('active');
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [notice, setNotice] = useState<{ kind: TemplateNotice; name: string } | null>(null);

  const all = templates.data ?? [];
  const counts = countByTab(all);
  const templateTab: TemplateTab = tab === 'archived' ? 'archived' : 'active';
  const visible = visibleTemplates(all, templateTab, query, language);
  const showNotice = (kind: TemplateNotice, name: string) => setNotice({ kind, name });

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl leading-[1.08] font-semibold md:text-4xl">
            {t('programs.list.title')}
          </h1>
          <p className="text-muted">{t('programs.list.description')}</p>
        </div>
        {isCreating ? null : (
          <Button
            onClick={() => {
              setNotice(null);
              setIsCreating(true);
            }}
          >
            {t('programs.list.newTemplate')}
          </Button>
        )}
      </header>

      {isCreating ? (
        <NewTemplateForm
          // La plantilla nueva se abre en el editor, para ponerle sus días.
          onCreated={(id) => void navigate(`/coach/programs/${id}`)}
          onCancel={() => setIsCreating(false)}
        />
      ) : null}

      {notice !== null ? (
        <p role="status" className="text-sm font-medium">
          {t(`programs.list.notices.${notice.kind}`, { name: notice.name })}
        </p>
      ) : null}

      <div role="group" aria-label={t('programs.list.tabsLabel')} className={SEGMENTED_GROUP_CLASS}>
        {TABS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={tab === option}
            onClick={() => setTab(option)}
            className={segmentClassName(tab === option)}
          >
            {t(`programs.list.tabs.${option}`)}
            {/* El espacio separa el número del nombre para los lectores de pantalla. */}{' '}
            {templates.isSuccess && option !== 'assigned' ? (
              <span className="font-semibold tabular-nums">{counts[option]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'assigned' ? <AssignedList /> : null}

      {tab === 'assigned' ? null : (
        <>
          <Input
            label={t('programs.list.search')}
            type="search"
            name="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <Card>
            {templates.isPending ? <SkeletonList rows={2} /> : null}
            {templates.isError ? <ErrorState onRetry={() => void templates.refetch()} /> : null}
            {templates.isSuccess && counts[templateTab] === 0 ? (
              <EmptyState
                title={t(`programs.list.${tab === 'active' ? 'empty' : 'emptyArchived'}.title`)}
                description={t(
                  `programs.list.${tab === 'active' ? 'empty' : 'emptyArchived'}.description`,
                )}
              />
            ) : null}
            {templates.isSuccess && counts[templateTab] > 0 && visible.length === 0 ? (
              <EmptyState
                title={t('programs.list.noResults.title')}
                description={t('programs.list.noResults.description')}
              />
            ) : null}
            {visible.length > 0 ? (
              <ul>
                {visible.map((template) => (
                  <TemplateRow key={template.id} template={template} onDone={showNotice} />
                ))}
              </ul>
            ) : null}
          </Card>
        </>
      )}
    </section>
  );
}
