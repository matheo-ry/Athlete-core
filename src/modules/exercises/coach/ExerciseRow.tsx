import { useTranslation } from 'react-i18next';

import { cn } from '@/core/lib';

import type { ExerciseListItem } from '../model/exercise-list';

const TAG = 'rounded-full px-2 py-0.5 text-xs font-semibold';

interface ExerciseRowProps {
  exercise: ExerciseListItem;
  /** El que está abierto en el panel. */
  isOpen: boolean;
  onOpen: (id: string) => void;
}

/** Una fila: nombre, grupo y material, y las etiquetas "Unilateral" y "Propio". Abre el ejercicio. */
export function ExerciseRow({ exercise, isOpen, onOpen }: ExerciseRowProps) {
  const { t } = useTranslation();
  const details = [
    exercise.muscleGroup === null ? null : t(`exercises.muscleGroups.${exercise.muscleGroup}`),
    exercise.equipment === null ? null : t(`exercises.equipment.${exercise.equipment}`),
  ].filter((detail) => detail !== null);

  return (
    <li className="border-border border-b last:border-b-0">
      <button
        type="button"
        aria-current={isOpen ? true : undefined}
        onClick={() => onOpen(exercise.id)}
        className={cn(
          'flex min-h-14 w-full items-center gap-3 rounded-lg px-2 py-2 text-left',
          'hover:bg-background focus-visible:outline-primary-readable focus-visible:outline-2',
          isOpen ? 'bg-background' : null,
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium break-words">{exercise.displayName}</span>
          {details.length > 0 ? (
            <span className="text-muted text-sm">{details.join(' · ')}</span>
          ) : null}
        </span>
        <span className="flex shrink-0 flex-wrap justify-end gap-1">
          {exercise.isUnilateral ? (
            <span className={`${TAG} border-border text-muted border`}>
              {t('exercises.list.unilateral')}
            </span>
          ) : null}
          {exercise.isOwn ? (
            <span className={`${TAG} bg-primary text-on-primary`}>{t('exercises.list.own')}</span>
          ) : null}
        </span>
      </button>
    </li>
  );
}
