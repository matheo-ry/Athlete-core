import { z } from 'zod';

import type { Language } from '@/core/i18n';

import { EQUIPMENT, MEASUREMENTS, MUSCLE_GROUPS } from './exercise-schema';
import type { Equipment, Exercise, Measurement, MuscleGroup } from './exercise-schema';

// El formulario de un ejercicio (D-072 y D-074). Los límites son los de la
// migración 8: si cambian allí, cambian aquí. Cada mensaje de error es el
// final de una clave de i18n (`exercises.form.errors.<mensaje>`).

export const NAME_MAX_LENGTH = 80;
export const INSTRUCTIONS_MAX_LENGTH = 2000;
export const VIDEO_URL_MAX_LENGTH = 500;

/** Lo que se escribe en el formulario, tal cual. "none" = sin grupo o sin material. */
export interface ExerciseFormValues {
  name: string;
  measurement: Measurement | '';
  isUnilateral: boolean;
  muscleGroup: MuscleGroup | 'none';
  equipment: Equipment | 'none';
  instructions: string;
  videoUrl: string;
}

/** Vacío cuenta como "sin dato": se guarda `null`. */
const optionalText = (max: number, tooLong: string) =>
  z
    .string()
    .trim()
    .max(max, { error: tooLong })
    .transform((text) => (text === '' ? null : text));

const exerciseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'nameRequired' })
    .max(NAME_MAX_LENGTH, { error: 'nameTooLong' }),
  measurement: z.enum(MEASUREMENTS, { error: 'measurementRequired' }),
  isUnilateral: z.boolean(),
  muscleGroup: z
    .enum([...MUSCLE_GROUPS, 'none'])
    .transform((group) => (group === 'none' ? null : group)),
  equipment: z.enum([...EQUIPMENT, 'none']).transform((item) => (item === 'none' ? null : item)),
  instructions: optionalText(INSTRUCTIONS_MAX_LENGTH, 'instructionsTooLong'),
  // Solo https:// y sin espacios (D-074), como exige la base de datos.
  videoUrl: optionalText(VIDEO_URL_MAX_LENGTH, 'videoUrlTooLong').refine(
    (url) => url === null || /^https:\/\/\S+$/.test(url),
    { error: 'videoUrlNotHttps' },
  ),
});

/** Lo que se guarda: los datos ya limpios. `name` vacío = "vale el del catálogo" (D-089). */
export interface ExerciseInput {
  name: string | null;
  measurement: Measurement;
  isUnilateral: boolean;
  muscleGroup: MuscleGroup | null;
  equipment: Equipment | null;
  instructions: string | null;
  videoUrl: string | null;
}

const FIELDS = [
  'name',
  'measurement',
  'isUnilateral',
  'muscleGroup',
  'equipment',
  'instructions',
  'videoUrl',
] as const satisfies readonly (keyof ExerciseFormValues)[];

export type ExerciseFormErrors = Partial<Record<keyof ExerciseFormValues, string>>;

export type ExerciseFormResult =
  { ok: true; input: ExerciseInput } | { ok: false; errors: ExerciseFormErrors };

/** El formulario de "Nuevo ejercicio", con el nombre ya puesto si viene del buscador. */
export function emptyFormValues(name = ''): ExerciseFormValues {
  return {
    name: name.trim().slice(0, NAME_MAX_LENGTH),
    measurement: '',
    isUnilateral: false,
    muscleGroup: 'none',
    equipment: 'none',
    instructions: '',
    videoUrl: '',
  };
}

/** El formulario de un ejercicio que ya existe, con el nombre que se ve. */
export function formValuesOf(exercise: Exercise, displayName: string): ExerciseFormValues {
  return {
    name: displayName,
    measurement: exercise.measurement,
    isUnilateral: exercise.isUnilateral,
    muscleGroup: exercise.muscleGroup ?? 'none',
    equipment: exercise.equipment ?? 'none',
    instructions: exercise.instructions ?? '',
    videoUrl: exercise.videoUrl ?? '',
  };
}

/**
 * Valida el formulario. Si el ejercicio viene del catálogo, aún no tiene
 * nombre propio y el coach no lo ha tocado, el nombre sigue vacío: así cada
 * usuario lo sigue viendo en su idioma (D-071).
 */
export function readExerciseForm(
  values: ExerciseFormValues,
  exercise: Exercise | null,
  language: Language,
): ExerciseFormResult {
  const parsed = exerciseFormSchema.safeParse(values);
  if (!parsed.success) {
    // El primer problema de cada campo.
    const { fieldErrors } = z.flattenError(parsed.error);
    const errors: ExerciseFormErrors = {};
    for (const field of FIELDS) {
      const message = fieldErrors[field]?.[0];
      if (message !== undefined) {
        errors[field] = message;
      }
    }
    return { ok: false, errors };
  }

  const keepsLibraryName =
    exercise !== null &&
    exercise.name === null &&
    exercise.libraryName?.[language] === parsed.data.name;
  return { ok: true, input: { ...parsed.data, name: keepsLibraryName ? null : parsed.data.name } };
}
