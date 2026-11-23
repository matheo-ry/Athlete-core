import { emptySet, emptySets, setNumbers, withExercise } from './active-workout';
import type { ActiveExercise, ActiveWorkout, ExerciseInfo } from './active-workout';

// "Saltar ejercicio" y "Cambiar ejercicio" (D-122), y poner al día lo guardado
// antes de que los unilaterales tuvieran lados (D-121). Lógica pura.

/** Solo se salta un ejercicio al que no se le ha apuntado nada: si no, ya se hizo. */
export function canSkip(exercise: ActiveExercise): boolean {
  return !exercise.isSkipped && !exercise.sets.some((set) => set.isDone);
}

/** "Saltar ejercicio": no cuenta para cerrar el entreno ni en el total de series. */
export function skipExercise(workout: ActiveWorkout, position: number, now: string): ActiveWorkout {
  const exercise = workout.exercises[position - 1];
  if (exercise === undefined || !canSkip(exercise)) {
    return workout;
  }
  return withExercise(workout, position, now, (item) => ({ ...item, isSkipped: true }));
}

/** Deshacer "Saltar ejercicio": vuelve a contar, tal como estaba. */
export function unskipExercise(
  workout: ActiveWorkout,
  position: number,
  now: string,
): ActiveWorkout {
  const exercise = workout.exercises[position - 1];
  if (exercise === undefined || !exercise.isSkipped) {
    return workout;
  }
  return withExercise(workout, position, now, (item) => ({ ...item, isSkipped: false }));
}

/** El ejercicio elegido para hacer hoy en su lugar, con cómo se mide. */
export interface ReplacementExercise extends ExerciseInfo {
  exerciseId: string;
}

/**
 * "Cambiar ejercicio" (D-122): hoy se hace otro. Lo apuntado cuenta para el
 * que se hizo de verdad (`exerciseId`); el de la rutina queda en
 * `replacesExerciseId`. Volver a elegir el de la rutina lo deshace. Si el
 * nuevo se mide o se apunta de otra forma (por lados), lo apuntado hasta
 * entonces no encaja y las series empiezan de cero.
 */
export function replaceExercise(
  workout: ActiveWorkout,
  position: number,
  to: ReplacementExercise,
  now: string,
  newId: () => string,
): ActiveWorkout {
  const exercise = workout.exercises[position - 1];
  if (exercise === undefined || exercise.exerciseId === to.exerciseId) {
    return workout;
  }
  const original = exercise.replacesExerciseId ?? exercise.exerciseId;
  const sameShape =
    exercise.measurement === to.measurement && exercise.isUnilateral === to.isUnilateral;
  return withExercise(workout, position, now, (item) => ({
    ...item,
    exerciseId: to.exerciseId,
    measurement: to.measurement,
    isUnilateral: to.isUnilateral,
    replacesExerciseId: to.exerciseId === original ? null : original,
    sets: sameShape
      ? item.sets
      : emptySets(to.isUnilateral, setNumbers(item).length, newId, item.prescribedSets.length + 1),
  }));
}

/**
 * Lo guardado antes del PR 3.8 apuntaba un unilateral sin lados. Lo que había
 * pasa al lado derecho y se añade el izquierdo, vacío. Si no hace falta nada,
 * devuelve el mismo entreno.
 */
export function withSides(workout: ActiveWorkout, newId: () => string): ActiveWorkout {
  const needsSides = (exercise: ActiveExercise) =>
    exercise.isUnilateral && exercise.sets.some((set) => set.side === 'none');
  if (!workout.exercises.some(needsSides)) {
    return workout;
  }
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) =>
      needsSides(exercise)
        ? {
            ...exercise,
            sets: exercise.sets.flatMap((set) =>
              set.side === 'none'
                ? [
                    { ...set, side: 'right' as const },
                    emptySet(newId(), set.setNumber, set.isExtra, 'left'),
                  ]
                : [set],
            ),
          }
        : exercise,
    ),
  };
}
