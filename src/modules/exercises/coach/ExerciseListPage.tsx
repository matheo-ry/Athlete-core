import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { useLanguage } from '@/core/i18n';
import { cn } from '@/core/lib';
import { Button, Card, EmptyState, ErrorState, Spinner } from '@/core/ui';

import { useExercises } from '../api/useExercises';
import {
  NO_FILTERS,
  countByTab,
  exerciseName,
  toListItem,
  visibleExercises,
} from '../model/exercise-list';
import type { ExerciseFilters, ExerciseTab } from '../model/exercise-list';
import type { Exercise } from '../model/exercise-schema';
import { ExerciseFilterBar } from './ExerciseFilterBar';
import type { ExerciseNotice } from './ExerciseActions';
import { ExercisePanel } from './ExercisePanel';
import type { PanelTarget } from './ExercisePanel';
import { ExerciseRow } from './ExerciseRow';

const TABS: readonly ExerciseTab[] = ['active', 'archived'];

/**
 * La biblioteca de ejercicios del coach (D-073 y D-085): pestañas "Activos" y
 * "Archivados" con su número, buscador y filtros, todo sobre la lista cargada.
 * El ejercicio abierto va en la dirección (`?exercise=<id>` o `=new`): así
 * "Atrás" cierra el formulario en el móvil.
 */
export function ExerciseListPage() {
  const { t } = useTranslation();
  const language = useLanguage();
  const exercises = useExercises();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<ExerciseTab>('active');
  const [filters, setFilters] = useState<ExerciseFilters>(NO_FILTERS);
  const [notice, setNotice] = useState<{ kind: ExerciseNotice; name: string } | null>(null);

  const all = exercises.data ?? [];
  const counts = countByTab(all);
  const visible = visibleExercises(all, tab, filters, language);

  const opened = searchParams.get('exercise');
  const openedExercise = all.find((exercise) => exercise.id === opened);
  const target: PanelTarget | null =
    opened === 'new'
      ? { kind: 'new', name: searchParams.get('name') ?? '' }
      : openedExercise === undefined
        ? null
        : { kind: 'edit', exercise: toListItem(openedExercise, language) };

  const open = (params: Record<string, string>) => {
    setNotice(null);
    setSearchParams(params);
  };
  const close = () => setSearchParams({});
  const handleDone = (exercise: Exercise, kind: ExerciseNotice) => {
    close();
    setNotice({ kind, name: exerciseName(exercise, language) });
  };
  const query = filters.query.trim();

  return (
    <section
      className={cn(
        'flex flex-col gap-4',
        target !== null && 'lg:grid lg:grid-cols-[1fr_26rem] lg:items-start lg:gap-6',
      )}
    >
      <div className={cn('flex min-w-0 flex-col gap-4', target !== null && 'hidden lg:flex')}>
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t('exercises.list.title')}</h1>
            <p className="text-muted">{t('exercises.list.description')}</p>
          </div>
          <Button onClick={() => open({ exercise: 'new' })}>
            {t('exercises.list.newExercise')}
          </Button>
        </header>

        {notice !== null ? (
          <p role="status" className="text-sm font-medium">
            {t(`exercises.list.notices.${notice.kind}`, { name: notice.name })}
          </p>
        ) : null}

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
              action={
                // D-073: si no lo encuentra, lo crea con lo que ha escrito.
                tab === 'active' && query !== '' ? (
                  <Button onClick={() => open({ exercise: 'new', name: query })}>
                    {t('exercises.list.createFromSearch', { name: query })}
                  </Button>
                ) : undefined
              }
            />
          ) : null}
          {visible.length > 0 ? (
            <ul>
              {visible.map((exercise) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  isOpen={exercise.id === opened}
                  onOpen={(id) => open({ exercise: id })}
                />
              ))}
            </ul>
          ) : null}
        </Card>
      </div>

      {target !== null ? (
        <ExercisePanel
          target={target}
          onDone={handleDone}
          onDuplicated={(copy) => open({ exercise: copy.id })}
          onClose={close}
        />
      ) : null}
    </section>
  );
}
