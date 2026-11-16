import { z } from 'zod';

// Una rutina completa tal como la carga y la guarda el editor: el "documento"
// de D-079. Los límites son los de la base de datos (migraciones 11 a 13 y
// D-086): si cambian allí, cambian aquí. Lógica pura.

export const MAX_CYCLE_DAYS = 28;
export const WEEKLY_CYCLE_DAYS = 7;

const id = z.uuid().nullable();
const optionalText = (max: number) => z.string().min(1).max(max).nullable();
const count = (min: number, max: number) => z.number().int().min(min).max(max).nullable();

const programSetSchema = z.object({
  id,
  repsMin: count(1, 100),
  repsMax: count(1, 100),
  durationSeconds: count(1, 86_400),
  distanceMeters: count(1, 1_000_000),
  intensityType: z.enum(['rir', 'rpe', 'failure']).nullable(),
  intensityValue: z.number().min(0).max(10).nullable(),
  targetLoadKg: z.number().min(0).max(1000).nullable(),
});

export const programDayExerciseSchema = z.object({
  id,
  exerciseId: z.uuid(),
  supersetGroup: count(1, 15),
  restSeconds: count(0, 3600),
  note: optionalText(500),
  sets: z.array(programSetSchema).min(1).max(10),
});

export const programDaySchema = z.object({
  id,
  dayNumber: z.number().int().min(1).max(MAX_CYCLE_DAYS),
  kind: z.enum(['training', 'rest']),
  name: optionalText(40),
  subtitle: optionalText(60),
  place: optionalText(20),
  exercises: z.array(programDayExerciseSchema).max(30),
});

export const programBlockSchema = z.object({
  id,
  name: optionalText(40),
  cycleDays: z.number().int().min(1).max(MAX_CYCLE_DAYS),
  // Vacío = sin fecha de fin (D-075).
  laps: count(1, 52),
  days: z.array(programDaySchema),
});

/** El documento validado. También sirve para leer lo guardado en el dispositivo (PR 2.8). */
export const programDocumentSchema = z.object({
  id,
  /** El `updated_at` que se cargó: si no coincide al guardar, hay conflicto (D-079). */
  updatedAt: z.string().nullable(),
  name: z.string().min(1).max(80),
  /** Vacío = plantilla (D-078). */
  clientId: z.uuid().nullable(),
  blocks: z.array(programBlockSchema).min(1).max(12),
});

export type ProgramDocument = z.infer<typeof programDocumentSchema>;
export type ProgramBlock = ProgramDocument['blocks'][number];
export type ProgramDay = ProgramBlock['days'][number];
export type ProgramDayExercise = ProgramDay['exercises'][number];
export type ProgramSet = ProgramDayExercise['sets'][number];

// ----- Lo que devuelve la base de datos -----
// Las filas llegan anidadas pero sin orden: se ordenan por posición aquí.

const byPosition = <T extends { position: number }>(rows: readonly T[]) =>
  [...rows].sort((a, b) => a.position - b.position);

const setRowSchema = z.object({
  id: z.uuid(),
  position: z.number(),
  reps_min: z.number().nullable(),
  reps_max: z.number().nullable(),
  duration_seconds: z.number().nullable(),
  distance_meters: z.number().nullable(),
  intensity_type: z.enum(['rir', 'rpe', 'failure']).nullable(),
  intensity_value: z.number().nullable(),
  target_load_kg: z.number().nullable(),
});

const dayExerciseRowSchema = z.object({
  id: z.uuid(),
  position: z.number(),
  exercise_id: z.uuid(),
  superset_group: z.number().nullable(),
  rest_seconds: z.number().nullable(),
  note: z.string().nullable(),
  program_sets: z.array(setRowSchema),
});

const dayRowSchema = z.object({
  id: z.uuid(),
  day_number: z.number(),
  kind: z.enum(['training', 'rest']),
  name: z.string().nullable(),
  subtitle: z.string().nullable(),
  place: z.string().nullable(),
  program_day_exercises: z.array(dayExerciseRowSchema),
});

const programRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  client_id: z.uuid().nullable(),
  updated_at: z.string(),
  program_blocks: z.array(
    z.object({
      id: z.uuid(),
      position: z.number(),
      name: z.string().nullable(),
      cycle_days: z.number(),
      laps: z.number().nullable(),
      program_days: z.array(dayRowSchema),
    }),
  ),
});

/** Valida en la frontera la rutina que devuelve la base de datos (AGENTS.md §4). */
export function parseProgramDocument(row: unknown): ProgramDocument {
  const program = programRowSchema.parse(row);
  return programDocumentSchema.parse({
    id: program.id,
    updatedAt: program.updated_at,
    name: program.name,
    clientId: program.client_id,
    blocks: byPosition(program.program_blocks).map((block) => ({
      id: block.id,
      name: block.name,
      cycleDays: block.cycle_days,
      laps: block.laps,
      days: [...block.program_days]
        .sort((a, b) => a.day_number - b.day_number)
        .map((day) => ({
          id: day.id,
          dayNumber: day.day_number,
          kind: day.kind,
          name: day.name,
          subtitle: day.subtitle,
          place: day.place,
          exercises: byPosition(day.program_day_exercises).map((item) => ({
            id: item.id,
            exerciseId: item.exercise_id,
            supersetGroup: item.superset_group,
            restSeconds: item.rest_seconds,
            note: item.note,
            sets: byPosition(item.program_sets).map((set) => ({
              id: set.id,
              repsMin: set.reps_min,
              repsMax: set.reps_max,
              durationSeconds: set.duration_seconds,
              distanceMeters: set.distance_meters,
              intensityType: set.intensity_type,
              intensityValue: set.intensity_value,
              targetLoadKg: set.target_load_kg,
            })),
          })),
        })),
    })),
  });
}

/**
 * Lo que recibe `save_program` (D-096): el mismo documento con los nombres de
 * la base de datos. El orden de cada lista es la posición.
 */
export function toSavePayload(document: ProgramDocument) {
  return {
    id: document.id,
    expected_updated_at: document.updatedAt,
    name: document.name.trim(),
    blocks: document.blocks.map((block) => ({
      id: block.id,
      name: block.name,
      cycle_days: block.cycleDays,
      laps: block.laps,
      days: block.days.map((day) => ({
        id: day.id,
        day_number: day.dayNumber,
        kind: day.kind,
        name: day.name,
        subtitle: day.subtitle,
        place: day.place,
        exercises: day.exercises.map((item) => ({
          id: item.id,
          exercise_id: item.exerciseId,
          superset_group: item.supersetGroup,
          rest_seconds: item.restSeconds,
          note: item.note,
          sets: item.sets.map((set) => ({
            id: set.id,
            reps_min: set.repsMin,
            reps_max: set.repsMax,
            duration_seconds: set.durationSeconds,
            distance_meters: set.distanceMeters,
            intensity_type: set.intensityType,
            intensity_value: set.intensityValue,
            target_load_kg: set.targetLoadKg,
          })),
        })),
      })),
    })),
  };
}

/** Un día de descanso vacío: así empieza cada día de un ciclo nuevo. */
export function restDay(dayNumber: number): ProgramDay {
  return {
    id: null,
    dayNumber,
    kind: 'rest',
    name: null,
    subtitle: null,
    place: null,
    exercises: [],
  };
}

/**
 * Una plantilla nueva (PR 2.7): un bloque sin fecha de fin con todos sus días
 * de descanso. El coach los rellena en el editor.
 */
export function newTemplate(name: string, cycleDays: number): ProgramDocument {
  return {
    id: null,
    updatedAt: null,
    name: name.trim(),
    clientId: null,
    blocks: [
      {
        id: null,
        name: null,
        cycleDays,
        laps: null,
        days: Array.from({ length: cycleDays }, (_, index) => restDay(index + 1)),
      },
    ],
  };
}

/** El formulario de "Nueva plantilla" y de "Renombrar". Las claves son de i18n. */
export const templateNameSchema = z
  .string()
  .trim()
  .min(1, 'programs.form.nameRequired')
  .max(80, 'programs.form.nameTooLong');

export const newTemplateSchema = z.object({
  name: templateNameSchema,
  // Llega como texto del campo: solo cifras, de 1 a 28.
  cycleDays: z
    .string()
    .trim()
    .regex(/^\d{1,2}$/, 'programs.form.cycleDaysInvalid')
    .transform(Number)
    .pipe(
      z
        .number()
        .min(1, 'programs.form.cycleDaysInvalid')
        .max(MAX_CYCLE_DAYS, 'programs.form.cycleDaysInvalid'),
    ),
});

export type NewTemplateInput = z.output<typeof newTemplateSchema>;
