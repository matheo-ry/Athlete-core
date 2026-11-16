import { copyDayOnto } from './copy';
import { editCycle } from './cycle-editor';
import type { CycleEditorAction } from './cycle-editor';
import { WEEKLY_CYCLE_DAYS, restDay } from './program-document';
import type { ProgramBlock, ProgramDocument } from './program-document';

// El estado del editor, segunda parte (PR 2.16, D-075): los bloques de la
// rutina. Lo que pasa dentro de un bloque lo sigue haciendo editCycle; aquí
// se añaden, ordenan, quitan y duplican bloques. Lógica pura.

/** El tope de bloques por rutina (D-086). */
export const MAX_BLOCKS = 12;
export const MAX_LAPS = 52;
/** Lo que se le pone a un bloque sin fin cuando deja de ser el último. */
export const DEFAULT_LAPS = 4;

export type ProgramEditorAction =
  /** Un cambio dentro de un bloque: su ciclo, sus días y sus ejercicios. */
  | { type: 'inBlock'; blockIndex: number; action: CycleEditorAction }
  /** "Recuperar" los cambios que quedaron en el dispositivo (PR 2.8b). */
  | { type: 'replace'; document: ProgramDocument }
  | { type: 'addBlock'; from: 'empty' | 'previous' }
  /** Pega al final un bloque copiado, de esta rutina o de otra. */
  | { type: 'pasteBlock'; block: ProgramBlock }
  | { type: 'duplicateBlock'; index: number }
  | { type: 'moveBlock'; index: number; direction: -1 | 1 }
  | { type: 'removeBlock'; index: number }
  | { type: 'setBlockName'; index: number; name: string }
  | { type: 'setBlockLaps'; index: number; laps: number | null };

/** Un bloque igual que otro, como nuevo: sin identificadores. */
export function copyOfBlock(block: ProgramBlock): ProgramBlock {
  return {
    ...block,
    id: null,
    days: block.days.map((day) => ({ ...copyDayOnto(day, day), id: null })),
  };
}

function emptyBlock(): ProgramBlock {
  return {
    id: null,
    name: null,
    cycleDays: WEEKLY_CYCLE_DAYS,
    laps: null,
    days: Array.from({ length: WEEKLY_CYCLE_DAYS }, (_, index) => restDay(index + 1)),
  };
}

/**
 * Solo el último bloque puede no tener fin (D-075): a los demás, si no la
 * tienen, se les pone una duración, que el coach puede cambiar.
 */
function withValidLaps(blocks: ProgramBlock[]): ProgramBlock[] {
  return blocks.map((block, index) =>
    block.laps === null && index < blocks.length - 1 ? { ...block, laps: DEFAULT_LAPS } : block,
  );
}

function withBlocks(document: ProgramDocument, blocks: ProgramBlock[]): ProgramDocument {
  return { ...document, blocks: withValidLaps(blocks) };
}

function replaceAt(blocks: ProgramBlock[], index: number, block: ProgramBlock): ProgramBlock[] {
  return blocks.map((item, position) => (position === index ? block : item));
}

function clampLaps(laps: number): number {
  return Math.min(Math.max(Math.trunc(laps), 1), MAX_LAPS);
}

export function editProgram(
  document: ProgramDocument,
  action: ProgramEditorAction,
): ProgramDocument {
  const { blocks } = document;
  switch (action.type) {
    case 'replace':
      return action.document;
    case 'inBlock': {
      const block = blocks[action.blockIndex];
      if (block === undefined) {
        return document;
      }
      // editCycle trabaja sobre el primer bloque: se le da solo este.
      const [edited] = editCycle({ ...document, blocks: [block] }, action.action).blocks;
      return edited === undefined || edited === block
        ? document
        : { ...document, blocks: replaceAt(blocks, action.blockIndex, edited) };
    }
    case 'addBlock': {
      const previous = blocks.at(-1);
      if (blocks.length >= MAX_BLOCKS) {
        return document;
      }
      const added =
        action.from === 'previous' && previous !== undefined ? copyOfBlock(previous) : emptyBlock();
      return withBlocks(document, [...blocks, added]);
    }
    case 'pasteBlock':
      return blocks.length >= MAX_BLOCKS
        ? document
        : withBlocks(document, [...blocks, copyOfBlock(action.block)]);
    case 'duplicateBlock': {
      const block = blocks[action.index];
      if (block === undefined || blocks.length >= MAX_BLOCKS) {
        return document;
      }
      const next = [...blocks];
      next.splice(action.index + 1, 0, copyOfBlock(block));
      return withBlocks(document, next);
    }
    case 'moveBlock': {
      const target = action.index + action.direction;
      const block = blocks[action.index];
      const other = blocks[target];
      if (block === undefined || other === undefined) {
        return document;
      }
      const next = [...blocks];
      next[action.index] = other;
      next[target] = block;
      return withBlocks(document, next);
    }
    case 'removeBlock':
      // Una rutina tiene al menos un bloque.
      return blocks.length <= 1 || blocks[action.index] === undefined
        ? document
        : withBlocks(
            document,
            blocks.filter((_, index) => index !== action.index),
          );
    case 'setBlockName': {
      const block = blocks[action.index];
      const name = action.name.trim() === '' ? null : action.name;
      return block === undefined
        ? document
        : { ...document, blocks: replaceAt(blocks, action.index, { ...block, name }) };
    }
    case 'setBlockLaps': {
      const block = blocks[action.index];
      if (block === undefined) {
        return document;
      }
      const isLast = action.index === blocks.length - 1;
      const withoutEnd = isLast ? null : DEFAULT_LAPS;
      const laps = action.laps === null ? withoutEnd : clampLaps(action.laps);
      return { ...document, blocks: replaceAt(blocks, action.index, { ...block, laps }) };
    }
  }
}

/** Los días que dura un bloque: sus vueltas por los días del ciclo. Vacío = sin fin. */
export function blockLengthDays(block: ProgramBlock): number | null {
  return block.laps === null ? null : block.laps * block.cycleDays;
}
