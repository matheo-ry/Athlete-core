import type { ActiveExercise, ActiveWorkout } from './active-workout';

// Superseries y circuitos al entrenar (D-113, D-121): los ejercicios seguidos
// con el mismo grupo se hacen uno detrás de otro, serie a serie. Una "ronda"
// es la misma serie en todos los del grupo. Lógica pura.

/** Tiempo sin tocar nada antes de pasar solo al siguiente del grupo (D-121). */
export const ADVANCE_DELAY_MS = 2500;
/** Con "Igual" la serie ya está entera: se pasa casi al momento. */
export const ADVANCE_AFTER_COPY_MS = 600;

/** Los ejercicios del grupo del de esta posición; solo él si no está en un grupo. */
export function groupMembers(workout: ActiveWorkout, position: number): ActiveExercise[] {
  const exercise = workout.exercises[position - 1];
  if (exercise === undefined) {
    return [];
  }
  return exercise.supersetGroup === null
    ? [exercise]
    : workout.exercises.filter((item) => item.supersetGroup === exercise.supersetGroup);
}

export interface GroupLabel {
  /** Dos ejercicios son una superserie; tres o más, un circuito (D-113). */
  kind: 'superset' | 'circuit';
  /** El puesto de este ejercicio en el grupo, desde 1. */
  position: number;
  size: number;
}

/** "Superserie · 1 de 2", "Circuito · 2 de 3"; `null` si no está en un grupo. */
export function groupLabel(workout: ActiveWorkout, position: number): GroupLabel | null {
  const members = groupMembers(workout, position);
  if (members.length < 2) {
    return null;
  }
  return {
    kind: members.length === 2 ? 'superset' : 'circuit',
    position: members.findIndex((item) => item.position === position) + 1,
    size: members.length,
  };
}

function hasSet(exercise: ActiveExercise, setNumber: number): boolean {
  return exercise.sets.some((set) => set.setNumber === setNumber);
}

/** Una serie está hecha cuando lo están todos sus lados. */
export function isSetDone(exercise: ActiveExercise, setNumber: number): boolean {
  const sets = exercise.sets.filter((set) => set.setNumber === setNumber);
  return sets.length > 0 && sets.every((set) => set.isDone);
}

/** La ronda está hecha: esa serie, en todos los del grupo que la tienen y no se saltaron. */
function isRoundDone(workout: ActiveWorkout, position: number, setNumber: number): boolean {
  const members = groupMembers(workout, position).filter(
    (item) => !item.isSkipped && hasSet(item, setNumber),
  );
  return members.length > 0 && members.every((item) => isSetDone(item, setNumber));
}

/**
 * ¿Este cambio acaba la ronda? Con él, la serie queda hecha en todo el grupo
 * (y en los dos lados, si es unilateral) y antes no lo estaba: ahí arranca el
 * descanso (D-121). Corregir una ronda ya hecha no lo reinicia.
 */
export function completesRound(
  before: ActiveWorkout,
  after: ActiveWorkout,
  position: number,
  setNumber: number,
): boolean {
  return isRoundDone(after, position, setNumber) && !isRoundDone(before, position, setNumber);
}

function pending(exercise: ActiveExercise, setNumber?: number): boolean {
  return (
    !exercise.isSkipped &&
    exercise.sets.some(
      (set) => (setNumber === undefined || set.setNumber === setNumber) && !set.isDone,
    )
  );
}

/**
 * A qué ejercicio pasar al apuntar una serie (D-121): al siguiente del grupo
 * que aún no tiene esa serie; con la ronda hecha, al primero del grupo al que
 * le queden series (la vuelta siguiente). `null` si no está en un grupo o no
 * queda nada.
 */
function nextInRound(workout: ActiveWorkout, position: number, setNumber: number): number | null {
  const members = groupMembers(workout, position);
  if (members.length < 2) {
    return null;
  }
  const open = members.filter(
    (item) => item.position !== position && hasSet(item, setNumber) && pending(item, setNumber),
  );
  const next = open.find((item) => item.position > position) ?? open[0];
  if (next !== undefined) {
    return next.position;
  }
  const lap = members.find((item) => pending(item));
  return lap === undefined || lap.position === position ? null : lap.position;
}

/**
 * Dónde seguir tras un cambio: solo cuando ese cambio deja hecha la serie del
 * ejercicio (los dos lados, si es unilateral) y antes no lo estaba. Corregir
 * una serie ya hecha no mueve de pantalla.
 */
export function advanceTarget(
  before: ActiveWorkout,
  after: ActiveWorkout,
  position: number,
  setNumber: number,
): number | null {
  const was = before.exercises[position - 1];
  const now = after.exercises[position - 1];
  if (was === undefined || now === undefined) {
    return null;
  }
  if (isSetDone(was, setNumber) || !isSetDone(now, setNumber)) {
    return null;
  }
  return nextInRound(after, position, setNumber);
}
