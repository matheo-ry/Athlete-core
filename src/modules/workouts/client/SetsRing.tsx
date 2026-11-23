import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ProgressRing } from '@/core/ui';

/** El anillo de series hechas de un ejercicio, con "1/3" dentro y un tick al acabar (D-120). */
export function SetsRing({ done, total }: { done: number; total: number }) {
  const { t } = useTranslation();
  const complete = total > 0 && done === total;
  return (
    <span role="img" aria-label={t('workouts.workout.setsDone', { done, total })}>
      <ProgressRing value={done} max={total} size={44} stroke={4}>
        {complete ? (
          <Check aria-hidden="true" className="text-primary-readable size-5" strokeWidth={3} />
        ) : (
          <span className="numeral text-[0.8rem]">{`${String(done)}/${String(total)}`}</span>
        )}
      </ProgressRing>
    </span>
  );
}
