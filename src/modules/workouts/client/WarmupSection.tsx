import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { DEFAULT_WEIGHT_UNIT, cn, fromKg, toKg } from '@/core/lib';
import { buttonClassName } from '@/core/ui';

import { MAX_WARMUP_SETS, STEPS, previousWarmupSet, warmupSets } from '../model/active-workout';
import type {
  ActiveExercise,
  ActiveSet,
  PreviousSetValues,
  SetPatch,
} from '../model/active-workout';
import type { PreviousPerformance } from '../model/offline-snapshot';
import { previousText } from './SetSideFields';
import { StepperField } from './StepperField';

const round = (value: number) => Number(value.toFixed(1));

interface WarmupSectionProps {
  exercise: ActiveExercise;
  previous: PreviousPerformance | null;
  enabled: boolean;
  onAdd: () => void;
  onChange: (
    setNumber: number,
    patch: Pick<SetPatch, 'weightKg' | 'reps' | 'durationSeconds' | 'distanceMeters'>,
  ) => void;
  onCopy: (setNumber: number, prev: PreviousSetValues) => void;
  onRemove: (setNumber: number) => void;
}

/**
 * Series de calentamiento del ejercicio (D-ideas-2): antes de las efectivas,
 * numeradas C1..C5, solo peso y repeticiones (o tiempo/distancia), sin RIR/RPE,
 * sin lado en unilaterales y sin arrancar descanso ni contar en progreso.
 */
export function WarmupSection({
  exercise,
  previous,
  enabled,
  onAdd,
  onChange,
  onCopy,
  onRemove,
}: WarmupSectionProps) {
  const { t } = useTranslation();
  const warmups = warmupSets(exercise);

  if (!enabled && warmups.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3" data-testid="warmup-section">
      {warmups.length > 0 ? (
        <ol className="flex flex-col gap-2.5">
          {warmups.map((set) => (
            <WarmupSetRow
              key={set.id}
              exercise={exercise}
              set={set}
              previous={previousWarmupSet(previous, set.setNumber)}
              onChange={(patch) => {
                onChange(set.setNumber, patch);
              }}
              onCopy={(prev) => {
                onCopy(set.setNumber, prev);
              }}
              onRemove={() => {
                onRemove(set.setNumber);
              }}
            />
          ))}
        </ol>
      ) : null}
      {enabled && warmups.length < MAX_WARMUP_SETS ? (
        <button
          type="button"
          data-testid="add-warmup-button"
          className="focus-ring border-border text-muted hover:text-foreground hover:bg-foreground/5 min-h-12 w-full rounded-2xl border border-dashed text-sm font-medium transition-colors"
          onClick={onAdd}
        >
          {t('workouts.set.addWarmup')}
        </button>
      ) : null}
    </div>
  );
}

function WarmupSetRow({
  exercise,
  set,
  previous,
  onChange,
  onCopy,
  onRemove,
}: {
  exercise: ActiveExercise;
  set: ActiveSet;
  previous: PreviousSetValues | null;
  onChange: (
    patch: Pick<SetPatch, 'weightKg' | 'reps' | 'durationSeconds' | 'distanceMeters'>,
  ) => void;
  onCopy: (prev: PreviousSetValues) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const unit = useProfile().data?.weightUnit ?? DEFAULT_WEIGHT_UNIT;
  const byWeight =
    exercise.measurement === 'weight_reps' || exercise.measurement === 'bodyweight_reps';
  const displayedWeight = set.weightKg === null ? null : round(fromKg(set.weightKg, unit));
  const referenceWeight =
    previous?.weightKg === null || previous?.weightKg === undefined
      ? null
      : round(fromKg(previous.weightKg, unit));

  return (
    <li
      data-testid={`warmup-set-${set.setNumber}`}
      className={cn(
        'flex flex-col gap-3 rounded-3xl border p-4 transition-colors',
        set.isDone
          ? 'border-border-strong bg-foreground/6'
          : 'border-border border-dashed bg-foreground/[0.02]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="eyebrow font-mono text-xs font-semibold">
            {t('workouts.set.warmupLabel', { number: set.setNumber })}
          </span>
          <span className="bg-foreground/10 text-muted rounded-full px-2 py-0.5 text-[11px] font-medium">
            {t('workouts.set.warmupTag')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {previous !== null ? (
            <button
              type="button"
              onClick={() => {
                onCopy(previous);
              }}
              className={buttonClassName('ghost', 'min-h-8 px-2.5 text-xs')}
            >
              {t('workouts.set.same')}
            </button>
          ) : null}
          <button
            type="button"
            aria-label={t('workouts.set.removeWarmup')}
            onClick={onRemove}
            className="focus-ring text-muted hover:text-foreground min-h-8 min-w-8 rounded-lg px-2 text-xs font-medium"
          >
            ✕
          </button>
        </div>
      </div>

      {previous !== null ? (
        <p className="text-muted text-xs">
          {previousText(previous, exercise.measurement, unit, t('workouts.set.failure'))}
        </p>
      ) : null}

      {byWeight ? (
        <div className="grid grid-cols-2 gap-3">
          <StepperField
            label={t('workouts.set.weight', { unit })}
            value={displayedWeight}
            placeholder={referenceWeight}
            step={STEPS[unit]}
            max={1000}
            decimals
            onChange={(value) => {
              onChange({ weightKg: toKg(value, unit) });
            }}
          />
          <StepperField
            label={t('workouts.set.reps')}
            value={set.reps}
            placeholder={previous?.reps ?? null}
            step={STEPS.reps}
            max={1000}
            decimals={false}
            onChange={(value) => {
              onChange({ reps: value });
            }}
          />
        </div>
      ) : exercise.measurement === 'time' ? (
        <StepperField
          label={t('workouts.set.seconds')}
          value={set.durationSeconds}
          placeholder={previous?.durationSeconds ?? null}
          step={STEPS.seconds}
          max={86400}
          decimals={false}
          onChange={(value) => {
            onChange({ durationSeconds: value });
          }}
        />
      ) : (
        <StepperField
          label={t('workouts.set.meters')}
          value={set.distanceMeters}
          placeholder={previous?.distanceMeters ?? null}
          step={STEPS.meters}
          max={1_000_000}
          decimals={false}
          onChange={(value) => {
            onChange({ distanceMeters: value });
          }}
        />
      )}
    </li>
  );
}
