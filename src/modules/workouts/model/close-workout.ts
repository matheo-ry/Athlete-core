import type { ActiveWorkout } from './active-workout';
import { setCounts } from './active-workout';

// Cerrar un entreno y su resumen final (D-119, D-149). Lógica pura.

/**
 * Lo que se espera, con todo hecho, antes de cerrarlo solo (D-149): al tocar
 * el peso de la última serie ya queda hecha, y hay que dejar tiempo para
 * poner las repeticiones. Cada cambio vuelve a empezar la cuenta.
 */
export const COMPLETE_GRACE_MS = 20_000;

/**
 * Todas las series hechas, salvo las de los ejercicios saltados (D-122). Si
 * se saltó todo, no hay nada que cerrar solo: el entreno sigue abierto.
 */
export function isComplete(workout: ActiveWorkout): boolean {
  const toDo = workout.exercises.filter((exercise) => !exercise.isSkipped);
  return toDo.length > 0 && toDo.every((exercise) => exercise.sets.every((set) => set.isDone));
}

/**
 * Cuánto falta para cerrarlo solo, en milisegundos; `null` si no toca
 * (está abierto con algo pendiente, o ya cerrado). En el resumen, enseguida.
 */
export function autoCloseDelay(
  workout: ActiveWorkout,
  nowMs: number,
  onSummary: boolean,
): number | null {
  if (workout.closedAt !== null || !isComplete(workout)) {
    return null;
  }
  if (onSummary) {
    return 0;
  }
  return Math.max(0, COMPLETE_GRACE_MS - (nowMs - Date.parse(workout.lastChangedAt)));
}

export interface FinishedSummary {
  /** Del inicio al último dato cambiado: lo que tarde en cerrarlo no cuenta. */
  minutes: number;
  setsDone: number;
  exercisesDone: number;
  exercisesTotal: number;
}

/** El resumen final (D-119); récords y minilogros llegan en los PR 3.15 y 3.17. */
export function finishedSummary(workout: ActiveWorkout): FinishedSummary {
  const elapsed = Date.parse(workout.lastChangedAt) - Date.parse(workout.startedAt);
  const planned = workout.exercises.filter((exercise) => !exercise.isSkipped);
  return {
    minutes: Number.isFinite(elapsed) ? Math.max(0, Math.round(elapsed / 60_000)) : 0,
    setsDone: setCounts(workout.exercises).done,
    exercisesDone: planned.filter((exercise) => exercise.sets.some((set) => set.isDone)).length,
    // Los saltados no cuentan: "5 de 6" no debe parecer un entreno a medias.
    exercisesTotal: planned.length,
  };
}
