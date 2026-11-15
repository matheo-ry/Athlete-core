import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { cn } from '@/core/lib';
import { Card, EmptyState, ErrorState, Spinner } from '@/core/ui';

import { useExercises } from '../api/useExercises';
import { NO_FILTERS, countByTab, visibleExercises } from '../model/exercise-list';
import type { ExerciseFilters, ExerciseTab } from '../model/exercise-list';
import { ExerciseFilterBar } from './ExerciseFilterBar';
import { ExerciseRow } from './ExerciseRow';

const TABS: readonly ExerciseTab[] = ['active', 'archived'];

/**
 * La biblioteca de ejercicios del coach (D-073 y D-085): pestañas "Activos" y
 * "Archivados" con su número, buscador y filtros, todo sobre la lista cargada.
 */
export function ExerciseListPage() {
  const { t } = useTranslation();
  const language = useLanguage();
  const exercises = useExercises();
  const [tab, setTab] = useState<ExerciseTab>('active');
  const [filters, setFilters] = useState<ExerciseFilters>(NO_FILTERS);

  const all = exercises.data ?? [];
  const counts = countByTab(all);
  const visible = visibleExercises(all, tab, filters, language);

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('exercises.list.title')}</h1>
        <p className="text-muted">{t('exercises.list.description')}</p>
      </header>

      <div role="group" aria-label={t('exercises.list.tabsLabel')} className="flex gap-2">
        {TABS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={tab === option}
            onClick={() => setTab(option)}
            className={cn(
              'flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium',
              'focus-visible:outline-primary-readable focus-visible:outline-2',
              tab === option ? 'bg-primary text-on-primary' : 'bg-surface text-muted',
            )}
          >
            {t(`exercises.list.tabs.${option}`)}
            {/* El espacio separa el número del nombre para los lectores de pantalla. */}{' '}
            {exercises.isSuccess ? (
              <span className="font-semibold tabular-nums">{counts[option]}</span>
            ) : null}
          </button>
        ))}
      </div>

      <ExerciseFilterBar filters={filters} onChange={setFilters} />

      <Card>
        {exercises.isPending ? <Spinner /> : null}
        {exercises.isError ? <ErrorState onRetry={() => void exercises.refetch()} /> : null}
        {exercises.isSuccess && counts[tab] === 0 ? (
          <EmptyState
            title={t(`exercises.list.${tab === 'active' ? 'empty' : 'emptyArchived'}.title`)}
            description={t(
              `exercises.list.${tab === 'active' ? 'empty' : 'emptyArchived'}.description`,
            )}
          />
        ) : null}
        {exercises.isSuccess && counts[tab] > 0 && visible.length === 0 ? (
          <EmptyState
            title={t('exercises.list.noResults.title')}
            description={t('exercises.list.noResults.description')}
          />
        ) : null}
        {visible.length > 0 ? (
          <ul>
            {visible.map((exercise) => (
              <ExerciseRow key={exercise.id} exercise={exercise} />
            ))}
          </ul>
        ) : null}
      </Card>
    </section>
  );
}
