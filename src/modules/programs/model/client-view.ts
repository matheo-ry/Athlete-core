import type { ClientProgram } from './assignments';
import { calendarPosition } from './calendar';
import type { ProgramBlock, ProgramDocument } from './program-document';

// Lo que necesita "Entreno" del cliente (PR 2.15, D-082 y D-084).

export interface ClientBlock {
  block: ProgramBlock;
  /** El día que toca hoy; vacío en modo lista (D-082). */
  todayNumber: number | null;
}

/**
 * El bloque en que va el cliente hoy y el día que le toca. En modo lista el
 * bloque también se cuenta por fechas (D-082), pero no hay "Hoy toca".
 */
export function clientBlock(
  program: ClientProgram,
  document: ProgramDocument,
  today: string,
): ClientBlock | null {
  const position = calendarPosition(program.blocks, program.startsOn, today, program.startBlockId);
  const index = position.status === 'running' ? position.blockIndex : 0;
  const block = document.blocks[index] ?? document.blocks[0];
  if (block === undefined) {
    return null;
  }
  const todayNumber =
    program.mode === 'calendar' && position.status === 'running' ? position.dayNumber : null;
  return { block, todayNumber };
}
