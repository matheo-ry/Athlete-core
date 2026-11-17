import { useTranslation } from 'react-i18next';

const SIZE = 40;
const RADIUS = 16;
const LENGTH = 2 * Math.PI * RADIUS;

/** El anillo de series hechas de un ejercicio, con "1/3" dentro (D-120). */
export function SetsRing({ done, total }: { done: number; total: number }) {
  const { t } = useTranslation();
  const filled = total === 0 ? 0 : (done / total) * LENGTH;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
      role="img"
      aria-label={t('workouts.workout.setsDone', { done, total })}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`} aria-hidden>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={4}
          className="stroke-border"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${String(filled)} ${String(LENGTH)}`}
          transform={`rotate(-90 ${String(SIZE / 2)} ${String(SIZE / 2)})`}
          className="stroke-primary"
        />
      </svg>
      <span className="absolute text-xs font-semibold">{`${String(done)}/${String(total)}`}</span>
    </span>
  );
}
