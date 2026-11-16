import type { Language } from '@/core/i18n';

import { copyDayOnto, duplicateExercise, pasteExercise } from './copy';
import {
  addExercise,
  moveExercise,
  removeExercise,
  replaceExercise,
  setExerciseNote,
} from './day-exercises';
import { MAX_CYCLE_DAYS, WEEKLY_CYCLE_DAYS, restDay } from './program-document';
import { groupWithNext, normalizeGroups, ungroup } from './supersets';
import type {
  ProgramBlock,
  ProgramDay,
  ProgramDayExercise,
  ProgramDocument,
} from './program-document';

// El estado del editor, primera parte (PR 2.8): los días del ciclo del primer
// bloque. Todo cambio devuelve un documento nuevo y no toca lo que no cambia:
// los ejercicios y las series de cada día viajan intactos hasta "Guardar
// cambios" (D-079). Varios bloques llegan en el PR 2.16. Lógica pura.

export type DayTextField = 'name' | 'subtitle' | 'place';

export type CycleEditorAction =
  | { type: 'setCycleDays'; cycleDays: number }
  | { type: 'setDayKind'; dayNumber: number; kind: ProgramDay['kind'] }
  | { type: 'setDayText'; dayNumber: number; field: DayTextField; value: string }
  /** "Recuperar" los cambios que quedaron en el dispositivo (PR 2.8b). */
  | { type: 'replace'; document: ProgramDocument }
  // Los ejercicios de un día (PR 2.9).
  | { type: 'addExercise'; dayNumber: number; exerciseId: string }
  | { type: 'moveExercise'; dayNumber: number; index: number; direction: -1 | 1 }
  | { type: 'removeExercise'; dayNumber: number; index: number }
  | { type: 'replaceExercise'; dayNumber: number; index: number; exerciseId: string }
  | { type: 'setExerciseNote'; dayNumber: number; index: number; note: string }
  /** Lo prescrito en un ejercicio: sus series y su descanso (PR 2.10). */
  | { type: 'setExercise'; dayNumber: number; index: number; item: ProgramDayExercise }
  // Copiar y duplicar (PR 2.11).
  | { type: 'duplicateExercise'; dayNumber: number; index: number }
  | { type: 'pasteExercise'; dayNumber: number; item: ProgramDayExercise }
  /** Deja el día igual que `source`: duplicar un día en otro, o pegar uno copiado. */
  | { type: 'replaceDay'; dayNumber: number; source: ProgramDay }
  // Superseries y circuitos (PR 2.17).
  | { type: 'groupWithNext'; dayNumber: number; index: number }
  | { type: 'ungroup'; dayNumber: number; index: number };

function updateFirstBlock(
  document: ProgramDocument,
  update: (block: ProgramBlock) => ProgramBlock,
): ProgramDocument {
  const [first, ...rest] = document.blocks;
  return first === undefined ? document : { ...document, blocks: [update(first), ...rest] };
}

function updateDay(
  block: ProgramBlock,
  dayNumber: number,
  update: (day: ProgramDay) => ProgramDay,
): ProgramBlock {
  return {
    ...block,
    // Tras cualquier cambio en un día, sus superseries quedan coherentes (D-077).
    days: block.days.map((day) =>
      day.dayNumber === dayNumber ? normalizeGroups(update(day)) : day,
    ),
  };
}

/** Alargar añade días de descanso al final; acortar quita los últimos. */
function resizeCycle(block: ProgramBlock, cycleDays: number): ProgramBlock {
  const size = Math.min(Math.max(Math.trunc(cycleDays), 1), MAX_CYCLE_DAYS);
  const kept = block.days.filter((day) => day.dayNumber <= size);
  const added = Array.from({ length: size - kept.length }, (_, index) =>
    restDay(kept.length + index + 1),
  );
  return { ...block, cycleDays: size, days: [...kept, ...added] };
}

export function editCycle(document: ProgramDocument, action: CycleEditorAction): ProgramDocument {
  switch (action.type) {
    case 'setCycleDays':
      return updateFirstBlock(document, (block) => resizeCycle(block, action.cycleDays));
    case 'setDayKind':
      // Un día de descanso no lleva ejercicios (D-096): la pantalla avisa antes.
      return updateFirstBlock(document, (block) =>
        updateDay(block, action.dayNumber, (day) => ({
          ...day,
          kind: action.kind,
          exercises: action.kind === 'rest' ? [] : day.exercises,
        })),
      );
    case 'setDayText':
      return updateFirstBlock(document, (block) =>
        updateDay(block, action.dayNumber, (day) => ({
          ...day,
          // Vacío se guarda como "sin nombre"; los espacios de los lados los
          // quita la base de datos al guardar.
          [action.field]: action.value.trim() === '' ? null : action.value,
        })),
      );
    case 'replace':
      return action.document;
    case 'addExercise':
      return updateFirstBlock(document, (block) =>
        updateDay(block, action.dayNumber, (day) => addExercise(day, action.exerciseId)),
      );
    case 'moveExercise':
      return updateFirstBlock(document, (block) =>
        updateDay(block, action.dayNumber, (day) =>
          moveExercise(day, action.index, action.direction),
        ),
      );
    case 'removeExercise':
      return updateFirstBlock(document, (block) =>
        updateDay(block, action.dayNumber, (day) => removeExercise(day, action.index)),
      );
    case 'replaceExercise':
      return updateFirstBlock(document, (block) =>
        updateDay(block, action.dayNumber, (day) =>
          replaceExercise(day, action.index, action.exerciseId),
        ),
      );
    case 'setExerciseNote':
      return updateFirstBlock(document, (block) =>
        updateDay(block, action.dayNumber, (day) =>
          setExerciseNote(day, action.index, action.note),
        ),
      );
    case 'duplicateExercise':
      return updateFirstBlock(document, (block) =>
        updateDay(block, action.dayNumber, (day) => duplicateExercise(day, action.index)),
      );
    case 'pasteExercise':
      return updateFirstBlock(document, (block) =>
        updateDay(block, action.dayNumber, (day) => pasteExercise(day, action.item)),
      );
    case 'groupWithNext':
      return updateFirstBlock(document, (block) =>
        updateDay(block, action.dayNumber, (day) => groupWithNext(day, action.index)),
      );
    case 'ungroup':
      return updateFirstBlock(document, (block) =>
        updateDay(block, action.dayNumber, (day) => ungroup(day, action.index)),
      );
    case 'replaceDay':
      return updateFirstBlock(document, (block) =>
        updateDay(block, action.dayNumber, (day) => copyDayOnto(day, action.source)),
      );
    case 'setExercise':
      return updateFirstBlock(document, (block) =>
        updateDay(block, action.dayNumber, (day) => ({
          ...day,
          exercises: day.exercises.map((item, position) =>
            position === action.index ? action.item : item,
          ),
        })),
      );
  }
}

/** El bloque que edita este PR. */
export function firstBlock(document: ProgramDocument): ProgramBlock | undefined {
  return document.blocks[0];
}

/** Un día con algo dentro: de entreno, con ejercicios o con un nombre puesto. */
export function hasContent(day: ProgramDay): boolean {
  return (
    day.kind === 'training' ||
    day.exercises.length > 0 ||
    day.name !== null ||
    day.subtitle !== null ||
    day.place !== null
  );
}

/** Los días con contenido que se perderían al acortar el ciclo a `cycleDays`. */
export function daysLostWhenShortening(block: ProgramBlock, cycleDays: number): number[] {
  return block.days
    .filter((day) => day.dayNumber > cycleDays && hasContent(day))
    .map((day) => day.dayNumber);
}

/** Cuántos ejercicios y series tiene un día. */
export function dayCounts(day: ProgramDay): { exercises: number; sets: number } {
  return {
    exercises: day.exercises.length,
    sets: day.exercises.reduce((total, item) => total + item.sets.length, 0),
  };
}

/** Hay cambios sin guardar. */
export function isDirty(original: ProgramDocument, draft: ProgramDocument): boolean {
  return JSON.stringify(original) !== JSON.stringify(draft);
}

export function isWeekly(block: ProgramBlock): boolean {
  return block.cycleDays === WEEKLY_CYCLE_DAYS;
}

// El 1 de enero de 2024 fue lunes: de ahí salen los nombres de la semana en
// cada idioma, sin escribirlos a mano.
const FIRST_MONDAY = Date.UTC(2024, 0, 1);

/**
 * El nombre de un día del ciclo: en uno semanal, el día de la semana (el día 1
 * es lunes, D-075); en los demás, `null`, y la pantalla dice "Día N".
 */
export function weekdayName(
  block: ProgramBlock,
  dayNumber: number,
  language: Language,
): string | null {
  if (!isWeekly(block)) {
    return null;
  }
  const name = new Intl.DateTimeFormat(language, { weekday: 'long', timeZone: 'UTC' }).format(
    FIRST_MONDAY + (dayNumber - 1) * 86_400_000,
  );
  return name.charAt(0).toLocaleUpperCase(language) + name.slice(1);
}
