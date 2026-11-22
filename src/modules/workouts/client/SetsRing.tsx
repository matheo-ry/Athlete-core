import { useTranslation } from 'react-i18next';

import { cn } from '@/core/lib';
import { Icon } from '@/core/ui';

const SIZE = 46;
const RADIUS = 19;
const LENGTH = 2 * Math.PI * RADIUS;

/**
 * El anillo de series hechas de un ejercicio, con "1/3" dentro (D-120). Lleno,
 * se ilumina y enseña un tick: el ejercicio está hecho.
 */
export function SetsRing({ done, total }: { done: number; total: number }) {
  const { t } = useTranslation();
  const filled = total === 0 ? 0 : (done / total) * LENGTH;
  const isComplete = total > 0 && done >= total;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
      role="img"
      aria-label={t('workouts.workout.setsDone', { done, total })}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}
        aria-hidden
        className={cn(isComplete && 'drop-shadow-[0_0_10px_var(--color-primary-glow)]')}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={3.5}
          className={isComplete ? 'fill-primary stroke-primary' : 'stroke-border fill-none'}
        />
        {done === 0 ? null : (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeDasharray={`${String(filled)} ${String(LENGTH)}`}
            transform={`rotate(-90 ${String(SIZE / 2)} ${String(SIZE / 2)})`}
            className="stroke-primary transition-[stroke-dasharray] duration-500"
          />
        )}
      </svg>
      {isComplete ? (
        <Icon name="check" className="text-on-primary absolute size-5" />
      ) : (
        <span className="numeric absolute text-[11px] font-medium">{`${String(done)}/${String(total)}`}</span>
      )}
    </span>
  );
}
