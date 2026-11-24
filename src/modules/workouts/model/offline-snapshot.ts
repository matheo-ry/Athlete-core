import { z } from 'zod';

import { clientProgramSchema, programDocumentSchema } from '@/modules/programs';

// Lo que se guarda en el móvil para entrenar sin cobertura (D-118): la rutina
// vigente entera y, de cada ejercicio, lo que hizo el cliente la vez anterior
// (D-120). Se pone al día cada vez que se abre la app, o se vuelve a ella, con
// conexión. Lógica pura.

const performedSetSchema = z.object({
  setNumber: z.number().int().min(1).max(10),
  side: z.enum(['none', 'right', 'left']),
  weightKg: z.number().nullable(),
  reps: z.number().int().nullable(),
  durationSeconds: z.number().int().nullable(),
  distanceMeters: z.number().int().nullable(),
  intensityType: z.enum(['rir', 'rpe', 'failure']).nullable(),
  intensityValue: z.number().nullable(),
  isWarmup: z.boolean().optional(),
});

export type PerformedSet = z.infer<typeof performedSetSchema>;

/** Un ejercicio hecho en un entreno, con sus series hechas. */
export const performedExerciseSchema = z.object({
  exerciseId: z.string(),
  programId: z.string().nullable(),
  dayNumber: z.number().int(),
  performedOn: z.string(),
  changedAt: z.string(),
  sets: z.array(performedSetSchema),
});

export type PerformedExercise = z.infer<typeof performedExerciseSchema>;

/** La vez anterior de un ejercicio: en un día de la rutina o, con `dayNumber` vacío, en cualquiera. */
const previousSchema = performedExerciseSchema.extend({ dayNumber: z.number().int().nullable() });

export type PreviousPerformance = z.infer<typeof previousSchema>;

export const offlineSnapshotSchema = z.object({
  tenantId: z.string(),
  savedAt: z.string(),
  /** Vacío si el cliente no tiene rutina vigente. */
  current: z.object({ program: clientProgramSchema, document: programDocumentSchema }).nullable(),
  previous: z.array(previousSchema),
});

export type OfflineSnapshot = z.infer<typeof offlineSnapshotSchema>;

/** Lo más reciente primero: por fecha del entreno y, el mismo día, por la hora del cambio. */
function newestFirst(a: PerformedExercise, b: PerformedExercise): number {
  return b.performedOn.localeCompare(a.performedOn) || b.changedAt.localeCompare(a.changedAt);
}

/**
 * De lo hecho, lo que hay que guardar de cada ejercicio de la rutina: la última
 * vez en cada día de esta rutina ("lunes con lunes") y la última vez en
 * cualquier día (D-120). Sin series hechas no cuenta.
 */
export function previousPerformances(
  performed: readonly PerformedExercise[],
  programId: string,
  exerciseIds: ReadonlySet<string>,
): PreviousPerformance[] {
  const result: PreviousPerformance[] = [];
  const seen = new Set<string>();
  for (const item of [...performed].sort(newestFirst)) {
    if (!exerciseIds.has(item.exerciseId) || item.sets.length === 0) {
      continue;
    }
    const anyDay = `${item.exerciseId}:any`;
    if (!seen.has(anyDay)) {
      seen.add(anyDay);
      result.push({ ...item, dayNumber: null });
    }
    const sameDay = `${item.exerciseId}:${String(item.dayNumber)}`;
    if (item.programId === programId && !seen.has(sameDay)) {
      seen.add(sameDay);
      result.push(item);
    }
  }
  return result;
}

/**
 * Lo que se enseña en gris en un ejercicio (D-120): la vez anterior en ese
 * mismo día de la rutina; si no, la última en cualquier día; si nunca lo ha
 * hecho, nada (y se enseña lo prescrito).
 */
export function previousFor(
  snapshot: OfflineSnapshot,
  exerciseId: string,
  dayNumber: number,
): PreviousPerformance | null {
  const own = snapshot.previous.filter((item) => item.exerciseId === exerciseId);
  return (
    own.find((item) => item.dayNumber === dayNumber) ??
    own.find((item) => item.dayNumber === null) ??
    null
  );
}

/** Los ejercicios de toda la rutina, de todos sus bloques. */
export function programExerciseIds(snapshot: Pick<OfflineSnapshot, 'current'>): Set<string> {
  const ids = new Set<string>();
  for (const block of snapshot.current?.document.blocks ?? []) {
    for (const day of block.days) {
      for (const exercise of day.exercises) {
        ids.add(exercise.exerciseId);
      }
    }
  }
  return ids;
}
