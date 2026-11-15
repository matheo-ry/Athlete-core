import { z } from 'zod';

// Un ejercicio del negocio tal como lo usa la app (DECISIONES D-072 y D-089).
// Las listas cerradas son las de la migración 8, en el mismo orden en que se
// enseñan: si cambian allí, cambian aquí.

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'quads',
  'hamstrings',
  'glutes',
  'adductors',
  'calves',
  'full_body',
  'cardio',
] as const;

export const EQUIPMENT = [
  'barbell',
  'dumbbells',
  'machine',
  'cable',
  'bodyweight',
  'band',
  'kettlebell',
  'other',
] as const;

export const MEASUREMENTS = ['weight_reps', 'bodyweight_reps', 'time', 'distance'] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
export type Equipment = (typeof EQUIPMENT)[number];
export type Measurement = (typeof MEASUREMENTS)[number];

// La fila de `exercises` con su original del catálogo: el nombre en los dos
// idiomas (cambiar de idioma no vuelve a pedir nada) y los datos que recupera
// "Restaurar original".
const exerciseRowSchema = z
  .object({
    id: z.uuid(),
    name: z.string().nullable(),
    library_key: z.string().nullable(),
    muscle_group: z.enum(MUSCLE_GROUPS).nullable(),
    equipment: z.enum(EQUIPMENT).nullable(),
    measurement: z.enum(MEASUREMENTS),
    is_unilateral: z.boolean(),
    instructions: z.string().nullable(),
    video_url: z.string().nullable(),
    archived_at: z.string().nullable(),
    exercise_library: z
      .object({
        name_en: z.string(),
        name_es: z.string(),
        measurement: z.enum(MEASUREMENTS),
        is_unilateral: z.boolean(),
        muscle_group: z.enum(MUSCLE_GROUPS),
        equipment: z.enum(EQUIPMENT),
      })
      .nullable(),
  })
  .transform((row) => ({
    id: row.id,
    // Vacío mientras valga el nombre del catálogo (D-089).
    name: row.name,
    libraryKey: row.library_key,
    libraryName:
      row.exercise_library === null
        ? null
        : { en: row.exercise_library.name_en, es: row.exercise_library.name_es },
    muscleGroup: row.muscle_group,
    equipment: row.equipment,
    measurement: row.measurement,
    isUnilateral: row.is_unilateral,
    instructions: row.instructions,
    videoUrl: row.video_url,
    archivedAt: row.archived_at,
    // Los datos del catálogo, sin el nombre (ese va en libraryName).
    original:
      row.exercise_library === null
        ? null
        : {
            measurement: row.exercise_library.measurement,
            isUnilateral: row.exercise_library.is_unilateral,
            muscleGroup: row.exercise_library.muscle_group,
            equipment: row.exercise_library.equipment,
          },
  }));

export type Exercise = z.output<typeof exerciseRowSchema>;

/** Valida en la frontera lo que devuelve la base de datos (AGENTS.md §4). */
export function parseExercises(rows: unknown): Exercise[] {
  return z.array(exerciseRowSchema).parse(rows);
}

/** Lo mismo para una sola fila: la que devuelve la base de datos al guardar. */
export function parseExercise(row: unknown): Exercise {
  return exerciseRowSchema.parse(row);
}
