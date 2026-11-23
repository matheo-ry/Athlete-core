import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { DEFAULT_WEIGHT_UNIT, cn, fromKg, toKg } from '@/core/lib';
import { useTenantSettings } from '@/core/tenancy';
import { Icon } from '@/core/ui';

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
  /** Lo que copia "Igual" según el ajuste del Perfil; `null` si no hay nada que copiar. */
  copySource: PreviousSetValues | null;
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
export function SetEditor({
  exercise,
  set,
  previous,
  copySource,
  onChange,
  onCopy,
  onUnmark,
}: SetEditorProps) {
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
        'flex flex-col gap-3 rounded-3xl p-3 transition-[background,border-color,box-shadow] duration-300',
        set.isDone ? 'surface-accent' : 'surface',
      )}
    >
      <div className="flex min-h-11 items-center justify-between gap-2">
        <button
          type="button"
          className="focus-ring flex min-h-11 items-center gap-2.5 rounded-full pr-2 text-left text-sm font-semibold"
          aria-pressed={set.isDone}
          disabled={!set.isDone}
          aria-label={t('workouts.set.unmark', { number: set.setNumber })}
          onClick={onUnmark}
        >
          <span
            aria-hidden="true"
            className={cn(
              'numeric flex size-9 items-center justify-center rounded-full text-sm transition-colors duration-300',
              set.isDone
                ? 'bg-primary text-on-primary shadow-[0_6px_18px_-6px_var(--color-primary-glow)]'
                : 'bg-foreground/8 text-muted',
            )}
          >
            {set.isDone ? <Icon name="check" className="size-4" /> : set.setNumber}
          </span>
          {t('workouts.set.label', { number: set.setNumber })}
        </button>
        <div className="flex min-w-0 items-center gap-2">
          {previous === null ? null : (
            <span className="text-muted flex min-w-0 items-center gap-1.5">
              <Icon name="history" className="size-3.5 shrink-0" />
              <span className="numeric truncate text-sm" data-testid="previous">
                {previousText(previous, exercise.measurement, unit, t('workouts.set.failureShort'))}
              </span>
            </span>
          )}
          {copySource === null ? null : (
            <button
              type="button"
              className="focus-ring surface-raised hover:border-border-strong min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-transform active:scale-95"
              onClick={onCopy}
            >
              {t('workouts.set.same')}
            </button>
          )}
        </div>
      </div>
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
          <span
            className={cn(
              'truncate px-2 pt-1.5 text-xs font-medium',
              atFailure ? 'text-on-primary/80' : 'text-muted',
            )}
          >
            {t('workouts.set.failure')}
          </span>
          <span className="numeric flex h-11 items-center px-2 text-2xl font-medium">
            {t('workouts.set.failureShort')}
          </span>
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
