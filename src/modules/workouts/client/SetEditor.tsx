import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { DEFAULT_WEIGHT_UNIT, cn, fromKg, toKg } from '@/core/lib';
import { useTenantSettings } from '@/core/tenancy';

import { STEPS, prescribedReference } from '../model/active-workout';
import type { ActiveExercise, ActiveSet, SetPatch } from '../model/active-workout';
import { StepperField } from './StepperField';

interface SetEditorProps {
  exercise: ActiveExercise;
  set: ActiveSet;
  onChange: (patch: SetPatch) => void;
}

const round = (value: number) => Number(value.toFixed(1));

/**
 * Una serie (D-120): peso y repeticiones (o segundos, o metros) e intensidad,
 * RIR o RPE según el negocio, con "F" al fallo. Cambiar cualquier dato la
 * ilumina con el color de la marca: no hay botón "Marcar serie hecha".
 */
export function SetEditor({ exercise, set, onChange }: SetEditorProps) {
  const { t } = useTranslation();
  const unit = useProfile().data?.weightUnit ?? DEFAULT_WEIGHT_UNIT;
  const { intensityScale } = useTenantSettings();
  const reference = prescribedReference(exercise, set.setNumber);
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
      <span className="text-sm font-semibold">
        {t('workouts.set.label', { number: set.setNumber })}
      </span>
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
