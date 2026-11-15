import { useTranslation } from 'react-i18next';

import type { ExerciseListItem } from '../model/exercise-list';

const TAG = 'rounded-full px-2 py-0.5 text-xs font-semibold';

/** Una fila: nombre, grupo y material, y las etiquetas "Unilateral" y "Propio". */
export function ExerciseRow({ exercise }: { exercise: ExerciseListItem }) {
  const { t } = useTranslation();
  const details = [
    exercise.muscleGroup === null ? null : t(`exercises.muscleGroups.${exercise.muscleGroup}`),
    exercise.equipment === null ? null : t(`exercises.equipment.${exercise.equipment}`),
  ].filter((detail) => detail !== null);

  return (
    <li className="border-border flex min-h-14 items-center gap-3 border-b py-2 last:border-b-0">
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
    </li>
  );
}
