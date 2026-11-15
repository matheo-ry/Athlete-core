import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { logger } from '@/core/lib';
import { Button, Checkbox, Input } from '@/core/ui';

import { useExerciseInUse } from '../api/useExerciseInUse';
import { useSaveExercise } from '../api/useSaveExercise';
import type { SaveResult } from '../api/useSaveExercise';
import { readExerciseForm } from '../model/exercise-form';
import type { ExerciseFormErrors, ExerciseFormValues } from '../model/exercise-form';
import type { ExerciseListItem } from '../model/exercise-list';
import type { Exercise } from '../model/exercise-schema';
import { EQUIPMENT, MUSCLE_GROUPS } from '../model/exercise-schema';
import { FilterSelect } from './FilterSelect';
import { MeasurementChoice } from './MeasurementChoice';
import { TextArea } from './TextArea';

interface ExerciseFormProps {
  /** Vacío al crear uno nuevo. */
  exercise: ExerciseListItem | null;
  initialValues: ExerciseFormValues;
  onSaved: (exercise: Exercise) => void;
  onCancel: () => void;
}

const FAILURE_KEYS: Record<Exclude<SaveResult['status'], 'saved'>, string> = {
  offline: 'core.errors.offline',
  limit_reached: 'exercises.form.limitReached',
  in_use: 'exercises.form.inUse',
  error: 'core.errors.unexpected',
};

/** Los datos de un ejercicio (D-072), validados con Zod antes de guardar. */
export function ExerciseForm({ exercise, initialValues, onSaved, onCancel }: ExerciseFormProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const save = useSaveExercise();
  // Si ya está en una rutina, la forma de medir y "unilateral" no cambian (D-072).
  const inUse = useExerciseInUse(exercise?.id ?? null).data === true;
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ExerciseFormErrors>({});
  const [failure, setFailure] = useState<string | null>(null);

  const set = <K extends keyof ExerciseFormValues>(field: K, value: ExerciseFormValues[K]) =>
    setValues((current) => ({ ...current, [field]: value }));
  const errorText = (field: keyof ExerciseFormValues) => {
    const code = errors[field];
    return code === undefined ? undefined : t(`exercises.form.errors.${code}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    const form = readExerciseForm(values, exercise, language);
    if (!form.ok) {
      setErrors(form.errors);
      return;
    }
    setErrors({});
    save
      .mutateAsync({ id: exercise?.id ?? null, input: form.input })
      .then((result) => {
        if (result.status === 'saved') {
          onSaved(result.exercise);
        } else {
          setFailure(t(FAILURE_KEYS[result.status]));
        }
      })
      .catch((error: unknown) => {
        logger.error('Could not save exercise', {
          message: error instanceof Error ? error.message : 'unknown',
        });
        setFailure(t('core.errors.unexpected'));
      });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label={t('exercises.form.name')}
        name="name"
        autoComplete="off"
        value={values.name}
        onChange={(event) => set('name', event.target.value)}
        error={errorText('name')}
      />
      <MeasurementChoice
        value={values.measurement}
        onChange={(measurement) => set('measurement', measurement)}
        error={errorText('measurement')}
        disabled={inUse}
      />
      <Checkbox
        label={t('exercises.form.unilateral')}
        checked={values.isUnilateral}
        disabled={inUse}
        onChange={(event) => set('isUnilateral', event.target.checked)}
      />
      {inUse ? <p className="text-muted text-sm">{t('exercises.form.inUseHint')}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <FilterSelect
          label={t('exercises.list.muscleGroup')}
          value={values.muscleGroup}
          options={[
            { value: 'none', label: t('exercises.form.notSet') },
            ...MUSCLE_GROUPS.map((group) => ({
              value: group,
              label: t(`exercises.muscleGroups.${group}`),
            })),
          ]}
          onChange={(group) => set('muscleGroup', group)}
        />
        <FilterSelect
          label={t('exercises.list.equipment')}
          value={values.equipment}
          options={[
            { value: 'none', label: t('exercises.form.notSet') },
            ...EQUIPMENT.map((item) => ({ value: item, label: t(`exercises.equipment.${item}`) })),
          ]}
          onChange={(item) => set('equipment', item)}
        />
      </div>
      <TextArea
        label={t('exercises.form.instructions')}
        name="instructions"
        value={values.instructions}
        onChange={(event) => set('instructions', event.target.value)}
        error={errorText('instructions')}
      />
      <Input
        label={t('exercises.form.videoUrl')}
        hint={t('exercises.form.videoUrlHint')}
        name="videoUrl"
        type="url"
        inputMode="url"
        autoComplete="off"
        value={values.videoUrl}
        onChange={(event) => set('videoUrl', event.target.value)}
        error={errorText('videoUrl')}
      />
      {exercise?.videoUrl ? (
        // Fuera de la app, nunca incrustado (D-074).
        <a
          href={exercise.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-readable min-h-11 self-start py-2 text-sm font-semibold underline"
        >
          {t('exercises.form.watchVideo')}
        </a>
      ) : null}

      {failure !== null ? (
        <p role="alert" className="text-danger text-sm font-medium">
          {failure}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? t('exercises.form.saving') : t('exercises.form.save')}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t('exercises.form.cancel')}
        </Button>
      </div>
    </form>
  );
}
