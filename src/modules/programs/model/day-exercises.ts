import type { ProgramDay, ProgramDayExercise, ProgramSet } from './program-document';

// Los ejercicios de un día de entreno (PR 2.9): añadir, ordenar y quitar.
// Funciones puras sobre un día; el editor las usa desde editCycle.

/** Las series con las que entra un ejercicio nuevo (PR 2.9): 3, sin datos. */
export const NEW_EXERCISE_SETS = 3;

export function emptySet(): ProgramSet {
  return {
    id: null,
    repsMin: null,
    repsMax: null,
    durationSeconds: null,
    distanceMeters: null,
    intensityType: null,
    intensityValue: null,
    targetLoadKg: null,
  };
}

/** Un ejercicio recién añadido: 3 series vacías, sin descanso ni nota. */
export function newDayExercise(exerciseId: string): ProgramDayExercise {
  return {
    id: null,
    exerciseId,
    supersetGroup: null,
    restSeconds: null,
    note: null,
    sets: Array.from({ length: NEW_EXERCISE_SETS }, emptySet),
  };
}

/** Se añade al final del día. */
export function addExercise(day: ProgramDay, exerciseId: string): ProgramDay {
  return { ...day, exercises: [...day.exercises, newDayExercise(exerciseId)] };
}

/** Sube (-1) o baja (+1) un puesto. En los extremos no hace nada. */
export function moveExercise(day: ProgramDay, index: number, direction: -1 | 1): ProgramDay {
  const target = index + direction;
  const item = day.exercises[index];
  const other = day.exercises[target];
  if (item === undefined || other === undefined) {
    return day;
  }
  const exercises = [...day.exercises];
  exercises[index] = other;
  exercises[target] = item;
  return { ...day, exercises };
}

export function removeExercise(day: ProgramDay, index: number): ProgramDay {
  return { ...day, exercises: day.exercises.filter((_, position) => position !== index) };
}

/** Alguna serie tiene algo escrito: quitarlo pide confirmación (PR 2.9). */
export function hasSetData(item: ProgramDayExercise): boolean {
  return (
    item.restSeconds !== null ||
    item.note !== null ||
    item.sets.some((set) =>
      Object.entries(set).some(([key, value]) => key !== 'id' && value !== null),
    )
  );
}
