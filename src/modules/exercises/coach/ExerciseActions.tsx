import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { logger } from '@/core/lib';
import { Button } from '@/core/ui';

import { useSaveExercise } from '../api/useSaveExercise';
import type { SaveResult } from '../api/useSaveExercise';
import { copyInput, isModified, restoredInput } from '../model/exercise-actions';
import type { ExerciseListItem } from '../model/exercise-list';
import type { Exercise } from '../model/exercise-schema';

/** Lo que ha pasado, para el aviso de la lista. */
export type ExerciseNotice = 'saved' | 'archived' | 'unarchived' | 'restored';

interface ExerciseActionsProps {
  exercise: ExerciseListItem;
  onDone: (exercise: Exercise, notice: ExerciseNotice) => void;
  onDuplicated: (copy: Exercise) => void;
}

const FAILURE_KEYS: Record<Exclude<SaveResult['status'], 'saved'>, string> = {
  offline: 'core.errors.offline',
  limit_reached: 'exercises.form.limitReached',
  in_use: 'exercises.form.inUse',
  error: 'core.errors.unexpected',
};

/**
 * "Duplicar", "Restaurar original" (solo los del catálogo que han cambiado,
 * con confirmación) y "Archivar" o "Recuperar". Nunca se borra (D-073).
 */
export function ExerciseActions({ exercise, onDone, onDuplicated }: ExerciseActionsProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const action = useSaveExercise();
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const isArchived = exercise.archivedAt !== null;
  const restored = restoredInput(exercise);

  const run = (
    variables: Parameters<typeof action.mutateAsync>[0],
    then: (saved: Exercise) => void,
  ) => {
    setFailure(null);
    action
      .mutateAsync(variables)
      .then((result) => {
        if (result.status === 'saved') {
          then(result.exercise);
        } else {
          setFailure(t(FAILURE_KEYS[result.status]));
        }
      })
      .catch((error: unknown) => {
        logger.error('Exercise action failed', {
          message: error instanceof Error ? error.message : 'unknown',
        });
        setFailure(t('core.errors.unexpected'));
      });
  };

  const duplicate = () =>
    run(
      {
        id: null,
        input: copyInput(exercise, t('exercises.actions.copyName', { name: exercise.displayName })),
      },
      onDuplicated,
    );
  const restore = () => {
    if (restored !== null) {
      run({ id: exercise.id, input: restored }, (saved) => onDone(saved, 'restored'));
    }
  };
  const toggleArchived = () =>
    run({ id: exercise.id, archived: !isArchived }, (saved) =>
      onDone(saved, isArchived ? 'unarchived' : 'archived'),
    );

  return (
    <div className="border-border flex flex-col gap-3 border-t pt-4">
      {failure !== null ? (
        <p role="alert" className="text-danger text-sm font-medium">
          {failure}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={duplicate} disabled={action.isPending}>
          {t('exercises.actions.duplicate')}
        </Button>
        {isModified(exercise) && !isConfirmingRestore ? (
          <Button
            variant="secondary"
            onClick={() => setIsConfirmingRestore(true)}
            disabled={action.isPending}
          >
            {t('exercises.actions.restore')}
          </Button>
        ) : null}
        <Button variant="secondary" onClick={toggleArchived} disabled={action.isPending}>
          {isArchived ? t('exercises.actions.unarchive') : t('exercises.actions.archive')}
        </Button>
      </div>
      {isConfirmingRestore ? (
        <div className="bg-background/50 border-border flex flex-col gap-3 rounded-2xl border p-4">
          <p className="text-sm">
            {t('exercises.actions.restoreConfirm', {
              name: exercise.libraryName?.[language] ?? '',
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={restore} disabled={action.isPending}>
              {t('exercises.actions.restoreYes')}
            </Button>
            <Button variant="ghost" onClick={() => setIsConfirmingRestore(false)}>
              {t('exercises.form.cancel')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
