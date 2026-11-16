import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { Button, EmptyState, ErrorState, Spinner } from '@/core/ui';

import { useExercises } from '../api/useExercises';
import { emptyFormValues } from '../model/exercise-form';
import { NO_FILTERS, toOption, visibleExercises } from '../model/exercise-list';
import type { ExerciseFilters, ExerciseOption } from '../model/exercise-list';
import type { Measurement } from '../model/exercise-schema';
import { ExerciseFilterBar } from './ExerciseFilterBar';
import { ExerciseForm } from './ExerciseForm';

interface ExercisePickerProps {
  title: string;
  onPick: (exercise: ExerciseOption) => void;
  onCancel: () => void;
  /** Solo los que se miden así ("Sustituir", PR 2.9b). */
  measurement?: Measurement;
}

/**
 * Elegir un ejercicio sin salir de donde se está (PR 2.9): el buscador y los
 * filtros de "Ejercicios" (D-073), solo con los activos. Si no está, "Crear
 * «lo escrito»" abre aquí mismo el formulario y lo elige al guardarlo.
 */
export function ExercisePicker({ title, onPick, onCancel, measurement }: ExercisePickerProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const exercises = useExercises();
  const [filters, setFilters] = useState<ExerciseFilters>(NO_FILTERS);
  const [creating, setCreating] = useState<string | null>(null);

  const visible = visibleExercises(exercises.data ?? [], 'active', filters, language).filter(
    (exercise) => measurement === undefined || exercise.measurement === measurement,
  );
  const query = filters.query.trim();

  if (creating !== null) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold">{t('exercises.form.newTitle')}</h3>
        <ExerciseForm
          exercise={null}
          initialValues={emptyFormValues(creating)}
          onSaved={(exercise) => onPick(toOption(exercise, language))}
          onCancel={() => setCreating(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">{title}</h3>
        <Button variant="ghost" onClick={onCancel}>
          {t('exercises.form.cancel')}
        </Button>
      </div>
      <ExerciseFilterBar filters={filters} onChange={setFilters} />
      {exercises.isPending ? <Spinner /> : null}
      {exercises.isError ? <ErrorState onRetry={() => void exercises.refetch()} /> : null}
      {exercises.isSuccess && visible.length === 0 ? (
        <EmptyState
          title={t('exercises.list.noResults.title')}
          description={t('exercises.list.noResults.description')}
          action={
            query === '' ? undefined : (
              <Button onClick={() => setCreating(query)}>
                {t('exercises.list.createFromSearch', { name: query })}
              </Button>
            )
          }
        />
      ) : null}
      {visible.length > 0 ? (
        <ul aria-label={title} className="max-h-[60vh] overflow-y-auto">
          {visible.map((exercise) => (
            <li key={exercise.id} className="border-border border-b last:border-b-0">
              <button
                type="button"
                onClick={() => onPick(toOption(exercise, language))}
                className="hover:bg-background focus-visible:outline-primary-readable flex min-h-12 w-full flex-col justify-center rounded-lg px-2 py-2 text-left focus-visible:outline-2"
              >
                <span className="font-medium break-words">{exercise.displayName}</span>
                <span className="text-muted text-sm">
                  {t(`exercises.measurements.${exercise.measurement}`)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
