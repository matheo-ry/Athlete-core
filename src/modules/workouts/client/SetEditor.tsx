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
import { StepperField } from './StepperField';

interface SetEditorProps {
  exercise: ActiveExercise;
  set: ActiveSet;
  /** Lo de la vez anterior en esta serie (D-120); `null` si no hay. */
  previous: PreviousSetValues | null;
  onChange: (patch: SetPatch) => void;
  /** "Igual": copia lo gris. */
  onCopy: () => void;
  /** Tocar la serie iluminada la apaga. */
  onUnmark: () => void;
}

const round = (value: number) => Number(value.toFixed(1));

/**
 * Una serie (D-120): peso y repeticiones (o segundos, o metros) e intensidad,
 * RIR o RPE según el negocio, con "F" al fallo. Cambiar cualquier dato la
 * ilumina con el color de la marca: no hay botón "Marcar serie hecha".
 */
export function SetEditor({ exercise, set, previous, onChange, onCopy, onUnmark }: SetEditorProps) {
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
    <li
      aria-label={t('workouts.set.label', { number: set.setNumber })}
      data-done={set.isDone}
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3',
        set.isDone ? 'border-primary bg-primary/15' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="min-h-11 text-left text-sm font-semibold"
          aria-pressed={set.isDone}
          disabled={!set.isDone}
          aria-label={t('workouts.set.unmark', { number: set.setNumber })}
          onClick={onUnmark}
        >
          {t('workouts.set.label', { number: set.setNumber })}
        </button>
        {previous === null ? null : (
          <div className="flex items-center gap-2">
            <span className="text-muted text-sm" data-testid="previous">
              {previousText(previous, exercise.measurement, unit, t('workouts.set.failureShort'))}
            </span>
            <button
              type="button"
              className="border-border bg-surface h-11 rounded-lg border px-3 text-sm font-semibold"
              onClick={onCopy}
            >
              {t('workouts.set.same')}
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
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
            'h-11 min-w-11 self-end rounded-lg border px-3 font-semibold',
            atFailure ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface',
          )}
          onClick={() => {
            onChange(
              atFailure
                ? { intensityType: null, intensityValue: null }
                : { intensityType: 'failure', intensityValue: null },
            );
          }}
        >
          {t('workouts.set.failureShort')}
        </button>
      </div>
    </li>
  );
}

/** Lo gris: "10 × 12 (1)", "45 s" o "100 m" (D-120), con el peso en la unidad del cliente. */
function previousText(
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
