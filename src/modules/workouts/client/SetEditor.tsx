import { Check, History } from 'lucide-react';
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
        'group relative flex flex-col gap-3 rounded-[1.6rem] p-4 transition-[box-shadow,background-color] duration-500',
        set.isDone
          ? 'bg-primary-soft shadow-[inset_0_0_0_1.5px_var(--brand-primary),0_18px_40px_-22px_var(--color-primary-glow)]'
          : 'glass',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="focus-ring flex min-h-11 items-center gap-2.5 rounded-full pr-2 text-left"
          aria-pressed={set.isDone}
          disabled={!set.isDone}
          aria-label={t('workouts.set.unmark', { number: set.setNumber })}
          onClick={onUnmark}
        >
          <span
            aria-hidden="true"
            className={cn(
              'flex size-9 items-center justify-center rounded-full transition-[background-color,color,transform] duration-500',
              set.isDone
                ? 'bg-primary text-on-primary scale-105 shadow-[0_6px_16px_-6px_var(--color-primary-glow)]'
                : 'bg-glass-strong text-muted',
            )}
          >
            {set.isDone ? (
              <Check className="size-5" strokeWidth={3} />
            ) : (
              <span className="numeral text-base">{set.setNumber}</span>
            )}
          </span>
          <span className="text-sm font-semibold">
            {t('workouts.set.label', { number: set.setNumber })}
          </span>
        </button>
        <div className="flex min-w-0 items-center gap-2">
          {previous === null ? null : (
            <span
              className="text-muted flex min-w-0 items-center gap-1 text-sm"
              data-testid="previous"
            >
              <History aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="truncate tabular-nums">
                {previousText(previous, exercise.measurement, unit, t('workouts.set.failureShort'))}
              </span>
            </span>
          )}
          {copySource === null ? null : (
            <button
              type="button"
              className="focus-ring bg-glass-strong hover:bg-glass-hover h-11 shrink-0 rounded-full px-4 text-sm font-semibold shadow-[var(--glass-edge)] transition-colors"
              onClick={onCopy}
            >
              {t('workouts.set.same')}
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
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
        ) : (
          <div className="col-span-2">
            {exercise.measurement === 'time' ? (
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
          </div>
        )}
        <div className="col-span-2 flex items-end gap-2.5 [&>*:first-child]:flex-1">
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
              'focus-ring numeral h-14 min-w-14 rounded-[1.15rem] px-4 text-xl transition-[background-color,color,box-shadow] duration-300',
              atFailure
                ? 'bg-primary text-on-primary shadow-[0_8px_22px_-10px_var(--color-primary-glow)]'
                : 'bg-glass text-muted hover:text-foreground shadow-[inset_0_0_0_1px_var(--color-hairline)]',
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
