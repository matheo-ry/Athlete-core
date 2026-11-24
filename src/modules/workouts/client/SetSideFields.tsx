import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { DEFAULT_WEIGHT_UNIT, cn, fromKg, toKg } from '@/core/lib';
import { useTenantSettings } from '@/core/tenancy';

import { STEPS, prescribedReference } from '../model/active-workout';
import type {
  ActiveExercise,
  ActiveSet,
  PreviousSetValues,
  Reference,
  SetPatch,
} from '../model/active-workout';
import { BallastTotal } from './BallastTotal';
import { StepperField } from './StepperField';

const round = (value: number) => Number(value.toFixed(1));

/** Lo gris: "10 × 12 (1)", "45 s" o "100 m" (D-120), con el peso en la unidad del cliente. */
export function previousText(
  previous: PreviousSetValues,
  measurement: ActiveExercise['measurement'],
  unit: 'kg' | 'lb',
  failure: string,
): string {
  const intensity =
    previous.intensityType === 'failure'
      ? ` (${failure})`
      : previous.intensityValue === null
        ? ''
        : ` (${String(previous.intensityValue)})`;
  if (measurement === 'time') {
    return `${String(previous.durationSeconds ?? 0)} s${intensity}`;
  }
  if (measurement === 'distance') {
    return `${String(previous.distanceMeters ?? 0)} m${intensity}`;
  }
  const reps = String(previous.reps ?? 0);
  return previous.weightKg === null || previous.weightKg === 0
    ? `${reps}${intensity}`
    : `${String(round(fromKg(previous.weightKg, unit)))} × ${reps}${intensity}`;
}

interface SetSideFieldsProps {
  exercise: ActiveExercise;
  /** La fila que se edita: una serie, o un lado de ella en un unilateral. */
  set: ActiveSet;
  /** Lo de la vez anterior en esta serie y lado (D-120); `null` si no hay. */
  previous: PreviousSetValues | null;
  onChange: (patch: SetPatch) => void;
}

/**
 * Los datos de una serie (D-120): peso y repeticiones (o segundos, o metros) e
 * intensidad, RIR o RPE según el negocio, con "F" al fallo. Cambiar cualquiera
 * ilumina la serie: no hay botón "Marcar serie hecha".
 */
export function SetSideFields({ exercise, set, previous, onChange }: SetSideFieldsProps) {
  const { t } = useTranslation();
  const unit = useProfile().data?.weightUnit ?? DEFAULT_WEIGHT_UNIT;
  const { intensityScale } = useTenantSettings();
  // En gris, la vez anterior; si nunca lo hizo, lo prescrito (D-120).
  const reference: Reference | null = previous ?? prescribedReference(exercise, set.setNumber);
  const byWeight =
    exercise.measurement === 'weight_reps' || exercise.measurement === 'bodyweight_reps';
  const atFailure = set.intensityType === 'failure';
  const referenceKg = reference?.weightKg ?? null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {byWeight ? (
        <>
          <StepperField
            label={t(
              exercise.measurement === 'bodyweight_reps'
                ? 'workouts.set.extraLoad'
                : 'workouts.set.weight',
              { unit },
            )}
            value={set.weightKg === null ? null : round(fromKg(set.weightKg, unit))}
            placeholder={referenceKg === null ? null : round(fromKg(referenceKg, unit))}
            step={STEPS[unit]}
            max={unit === 'lb' ? 2200 : 1000}
            decimals
            onChange={(value) => {
              onChange({ weightKg: toKg(value, unit) });
            }}
          />
          <StepperField
            label={t('workouts.set.reps')}
            value={set.reps}
            placeholder={reference?.reps ?? null}
            step={STEPS.reps}
            max={100}
            decimals={false}
            onChange={(value) => {
              onChange({ reps: value });
            }}
          />
        </>
      ) : exercise.measurement === 'time' ? (
        <StepperField
          className="col-span-2"
          label={t('workouts.set.seconds')}
          value={set.durationSeconds}
          placeholder={reference?.durationSeconds ?? null}
          step={STEPS.seconds}
          max={86_400}
          decimals={false}
          onChange={(value) => {
            onChange({ durationSeconds: value });
          }}
        />
      ) : (
        <StepperField
          className="col-span-2"
          label={t('workouts.set.meters')}
          value={set.distanceMeters}
          placeholder={reference?.distanceMeters ?? null}
          step={STEPS.meters}
          max={1_000_000}
          decimals={false}
          onChange={(value) => {
            onChange({ distanceMeters: value });
          }}
        />
      )}
      {atFailure ? null : (
        <StepperField
          label={t(`workouts.set.${intensityScale}`)}
          value={set.intensityValue}
          placeholder={reference?.intensityValue ?? null}
          step={STEPS[intensityScale]}
          max={10}
          decimals={intensityScale === 'rpe'}
          onChange={(value) => {
            onChange({ intensityType: intensityScale, intensityValue: value });
          }}
        />
      )}
      <button
        type="button"
        aria-pressed={atFailure}
        aria-label={t('workouts.set.failure')}
        className={cn(
          'focus-ring flex min-h-11 flex-col justify-between gap-0.5 rounded-2xl border p-1 text-left transition-[background-color,transform] duration-200 active:scale-[0.97]',
          atFailure
            ? 'bg-primary text-on-primary border-primary col-span-2'
            : 'bg-background/70 border-border text-muted hover:text-foreground',
        )}
        onClick={() => {
          onChange(
            atFailure
              ? { intensityType: null, intensityValue: null }
              : { intensityType: 'failure', intensityValue: null },
          );
        }}
      >
        <span className={cn('eyebrow truncate px-2 pt-1.5', atFailure && 'text-on-primary/80')}>
          {t('workouts.set.failure')}
        </span>
        <span className="numeric flex h-11 items-center px-2 text-2xl font-medium">
          {t('workouts.set.failureShort')}
        </span>
      </button>
      {exercise.measurement === 'bodyweight_reps' ? (
        <BallastTotal
          className="col-span-2"
          ballastKg={set.weightKg ?? referenceKg}
          isReference={set.weightKg === null}
        />
      ) : null}
    </div>
  );
}
