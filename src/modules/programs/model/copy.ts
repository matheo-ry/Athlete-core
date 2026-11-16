import type { ProgramDay, ProgramDayExercise, ProgramDocument } from './program-document';

// Copiar y duplicar, en pequeño y en grande (PR 2.11, D-080): un ejercicio,
// un día o una plantilla entera. Toda copia nace sin identificadores: al
// guardar, la base de datos la crea como algo nuevo. Lógica pura.

const MAX_NAME_LENGTH = 80;

/** Un ejercicio con sus series, como nuevo. */
export function copyOfExercise(item: ProgramDayExercise): ProgramDayExercise {
  return { ...item, id: null, sets: item.sets.map((set) => ({ ...set, id: null })) };
}

/** Duplica un ejercicio justo debajo, con las mismas series, descanso y nota. */
export function duplicateExercise(day: ProgramDay, index: number): ProgramDay {
  const item = day.exercises[index];
  if (item === undefined) {
    return day;
  }
  const exercises = [...day.exercises];
  exercises.splice(index + 1, 0, copyOfExercise(item));
  return { ...day, exercises };
}

/** Pega un ejercicio copiado al final del día. */
export function pasteExercise(day: ProgramDay, item: ProgramDayExercise): ProgramDay {
  return { ...day, exercises: [...day.exercises, copyOfExercise(item)] };
}

/**
 * Deja un día igual que otro: tipo, nombre, subtítulo, lugar, ejercicios y
 * series. El día de destino sigue siendo el mismo día del ciclo; lo que tenía
 * se sustituye (la pantalla pide confirmación antes si tenía ejercicios).
 */
export function copyDayOnto(target: ProgramDay, source: ProgramDay): ProgramDay {
  return {
    id: target.id,
    dayNumber: target.dayNumber,
    kind: source.kind,
    name: source.name,
    subtitle: source.subtitle,
    place: source.place,
    exercises: source.exercises.map(copyOfExercise),
  };
}

/**
 * Una plantilla nueva igual que otra rutina, con otro nombre (el que da la
 * pantalla, "Copia de …", recortado a 80). Sirve también para "Guardar como
 * plantilla" (PR 2.14): la copia nunca tiene cliente.
 */
export function copyOfProgram(document: ProgramDocument, name: string): ProgramDocument {
  return {
    id: null,
    updatedAt: null,
    name: name.trim().slice(0, MAX_NAME_LENGTH),
    clientId: null,
    blocks: document.blocks.map((block) => ({
      ...block,
      id: null,
      days: block.days.map((day) => ({ ...copyDayOnto(day, day), id: null })),
    })),
  };
}
