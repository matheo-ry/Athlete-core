import type { ClientProgram } from './assignments';
import { calendarPosition, scheduleBlocks } from './calendar';
import type { ProgramBlock, ProgramDocument } from './program-document';

// Lo que necesita "Entreno" del cliente (PR 2.15, D-082 y D-084).

export interface ClientBlock {
  block: ProgramBlock;
  /** El día que toca hoy; vacío en modo lista (D-082). */
  todayNumber: number | null;
  /** Cuándo empieza el bloque siguiente; vacío si este es el último (D-084). */
  nextBlockStartsOn: string | null;
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
  // El cliente ve solo su bloque; del siguiente, cuándo empieza (PR 2.16).
  const schedule = scheduleBlocks(program.blocks, program.startsOn, program.startBlockId);
  const place = schedule.findIndex((item) => item.index === index);
  const nextBlockStartsOn =
    position.status === 'running' ? (schedule[place + 1]?.startsOn ?? null) : null;
  return { block, todayNumber, nextBlockStartsOn };
}
