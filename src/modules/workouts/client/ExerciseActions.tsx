import { useTranslation } from 'react-i18next';

import { Icon, buttonClassName } from '@/core/ui';

/**
 * "Cambiar ejercicio" y "Saltar ejercicio" (D-122), al final del ejercicio:
 * son poco frecuentes y no deben estorbar al apuntar. Saltar solo se ofrece
 * mientras no se haya apuntado nada.
 */
export function ExerciseActions({
  canSkip,
  onReplace,
  onSkip,
}: {
  canSkip: boolean;
  onReplace: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" className={buttonClassName('ghost')} onClick={onReplace}>
        <Icon name="dumbbell" className="size-4" />
        {t('workouts.workout.replace')}
      </button>
      {canSkip ? (
        <button type="button" className={buttonClassName('ghost')} onClick={onSkip}>
          <Icon name="skip" className="size-4" />
          {t('workouts.workout.skip')}
        </button>
      ) : null}
    </div>
  );
}

/** El ejercicio saltado, con "Deshacer" (D-122). */
export function SkippedNotice({ onUndo }: { onUndo: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className="surface flex flex-col gap-3 rounded-3xl p-4"
      data-testid="skipped-notice"
    >
      <p className="text-sm leading-6">{t('workouts.workout.skippedNote')}</p>
      <button type="button" className={buttonClassName('secondary')} onClick={onUndo}>
        {t('workouts.workout.unskip')}
      </button>
    </div>
  );
}
