import type { ProgramDay, ProgramDayExercise } from './program-document';

// Superseries y circuitos (PR 2.17, D-077): los ejercicios seguidos de un día
// con el mismo número de grupo se hacen uno detrás de otro, sin descanso entre
// ellos. Dos son una "superserie"; tres o más, un "circuito". Lógica pura.

/** El tope de grupos por día, el de la base de datos. */
const MAX_GROUPS = 15;

export interface GroupInfo {
  kind: 'superset' | 'circuit';
  /** Cuántos ejercicios tiene el grupo. */
  size: number;
  /** El puesto de este ejercicio dentro del grupo, desde 1. */
  position: number;
}

function withGroup(item: ProgramDayExercise, supersetGroup: number | null): ProgramDayExercise {
  return item.supersetGroup === supersetGroup ? item : { ...item, supersetGroup };
}

/**
 * Deja los grupos coherentes: un grupo es un tramo de ejercicios seguidos con
 * el mismo número. Un tramo de uno deja de ser grupo; si un número aparece en
 * dos tramos separados (al mover un ejercicio, por ejemplo), cada tramo es su
 * propio grupo. Los grupos se numeran 1, 2, 3… por orden. Si no cambia nada,
 * devuelve el mismo día.
 */
export function normalizeGroups(day: ProgramDay): ProgramDay {
  const items = day.exercises;
  const groups: (number | null)[] = [];
  let next = 1;
  for (let index = 0; index < items.length; index += 1) {
    const group = items[index]?.supersetGroup ?? null;
    const sameAsPrevious = index > 0 && group !== null && items[index - 1]?.supersetGroup === group;
    const sameAsNext = group !== null && items[index + 1]?.supersetGroup === group;
    if (sameAsPrevious) {
      groups.push(groups[index - 1] ?? null);
    } else if (sameAsNext && next <= MAX_GROUPS) {
      groups.push(next);
      next += 1;
    } else {
      groups.push(null);
    }
  }
  const exercises = items.map((item, index) => withGroup(item, groups[index] ?? null));
  return exercises.every((item, index) => item === items[index]) ? day : { ...day, exercises };
}

/**
 * "Agrupar con el siguiente": el ejercicio y el de debajo pasan a hacerse
 * seguidos. Si alguno ya estaba en un grupo, los dos grupos se juntan.
 */
export function groupWithNext(day: ProgramDay, index: number): ProgramDay {
  const item = day.exercises[index];
  const below = day.exercises[index + 1];
  if (item === undefined || below === undefined) {
    return day;
  }
  // Un número que no use nadie; al normalizar se renumera.
  const fresh = Math.max(0, ...day.exercises.map((exercise) => exercise.supersetGroup ?? 0)) + 1;
  const target = item.supersetGroup ?? fresh;
  const joined = below.supersetGroup;
  const exercises = day.exercises.map((exercise, position) => {
    const joins =
      position === index ||
      position === index + 1 ||
      // El grupo del de debajo entero se une; solo el tramo pegado a él.
      (joined !== null && exercise.supersetGroup === joined && position > index);
    return joins ? { ...exercise, supersetGroup: target } : exercise;
  });
  return normalizeGroups({ ...day, exercises });
}

/** "Desagrupar": todos los ejercicios de ese grupo quedan sueltos, en el mismo orden. */
export function ungroup(day: ProgramDay, index: number): ProgramDay {
  const group = day.exercises[index]?.supersetGroup ?? null;
  if (group === null) {
    return day;
  }
  return {
    ...day,
    exercises: day.exercises.map((item) =>
      item.supersetGroup === group ? withGroup(item, null) : item,
    ),
  };
}

/** Si el ejercicio está agrupado, cómo es su grupo. Supone los grupos ya coherentes. */
export function groupInfo(day: ProgramDay, index: number): GroupInfo | null {
  const group = day.exercises[index]?.supersetGroup ?? null;
  if (group === null) {
    return null;
  }
  const members = day.exercises
    .map((item, position) => ({ item, position }))
    .filter(({ item }) => item.supersetGroup === group);
  if (members.length < 2) {
    return null;
  }
  return {
    kind: members.length === 2 ? 'superset' : 'circuit',
    size: members.length,
    position: members.findIndex(({ position }) => position === index) + 1,
  };
}

/** Si el ejercicio se puede agrupar con el de debajo: hay uno, y no están ya juntos. */
export function canGroupWithNext(day: ProgramDay, index: number): boolean {
  const item = day.exercises[index];
  const below = day.exercises[index + 1];
  if (item === undefined || below === undefined) {
    return false;
  }
  return item.supersetGroup === null || item.supersetGroup !== below.supersetGroup;
}
