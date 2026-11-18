import type { ClientProgram } from './assignments';
import {
  calendarPosition,
  formatWeekdayName,
  listPosition,
  scheduleBlocks,
  weekdayIndex,
} from './calendar';
import type { CalendarOptions } from './calendar';
import type { ProgramBlock, ProgramDocument } from './program-document';

// Lo que necesita "Entreno" del cliente (PR 2.15, D-082, D-084, D-125).

export interface ClientBlock {
  block: ProgramBlock;
  /** El día que toca hoy; vacío en modo lista (D-082). */
  todayNumber: number | null;
  /** Cuándo empieza el bloque siguiente; vacío si este es el último (D-084). */
  nextBlockStartsOn: string | null;
  /** Si hoy toca recuperación de un día faltado (D-125). */
  isRecovery?: boolean;
}

/**
 * El bloque en que va el cliente hoy y el día que le toca.
 * En modo lista (D-125), el bloque avanza por entrenos hechos, no por fechas.
 * Con calendario, se aplican las reglas del día saltado (D-125).
 */
export function clientBlock(
  program: ClientProgram,
  document: ProgramDocument,
  today: string,
  options?: CalendarOptions,
): ClientBlock | null {
  if (program.mode === 'list') {
    const trainingDaysPerBlock = document.blocks.map(
      (b) => b.days.filter((d) => d.kind === 'training').length,
    );
    const completed = options?.completedWorkouts ?? program.completedWorkoutsCount ?? 0;
    const pos = listPosition(program.blocks, completed, trainingDaysPerBlock);
    const block = document.blocks[pos.blockIndex] ?? document.blocks[0];
    if (block === undefined) {
      return null;
    }
    return {
      block,
      todayNumber: null,
      nextBlockStartsOn: null,
      isRecovery: false,
    };
  }

  const isRestDay = (blockIndex: number, dayNumber: number) => {
    const docBlock = document.blocks[blockIndex];
    const day = docBlock?.days.find((d) => d.dayNumber === dayNumber);
    return day?.kind === 'rest';
  };

  const opts: CalendarOptions = {
    rules: program.missedDayRules,
    missedDays: program.missedDays,
    isRestDay,
    ...options,
  };

  const position = calendarPosition(
    program.blocks,
    program.startsOn,
    today,
    program.startBlockId,
    opts,
  );
  const index = position.status === 'running' ? position.blockIndex : 0;
  const block = document.blocks[index] ?? document.blocks[0];
  if (block === undefined) {
    return null;
  }
  const todayNumber =
    program.mode === 'calendar' && position.status === 'running' ? position.dayNumber : null;
  const isRecovery = position.status === 'running' ? Boolean(position.isRecovery) : false;

  // El cliente ve solo su bloque; del siguiente, cuándo empieza (PR 2.16).
  const schedule = scheduleBlocks(program.blocks, program.startsOn, program.startBlockId, opts);
  const place = schedule.findIndex((item) => item.index === index);
  const nextBlockStartsOn =
    position.status === 'running' ? (schedule[place + 1]?.startsOn ?? null) : null;

  return { block, todayNumber, nextBlockStartsOn, isRecovery };
}

export type DayStatus =
  { kind: 'normal' } | { kind: 'missed' } | { kind: 'done_other_day'; weekday: string };

/**
 * Determina el estado de ejecución de un día para la vista del cliente o coach (D-125):
 * - normal: el día no se ha saltado
 * - missed: el día se saltó y no se ha recuperado ("Faltado")
 * - done_other_day: el día se hizo en otro día de la semana ("Lunes, hecho el martes")
 */
export function dayExecutionStatus(
  day: { id?: string | null; dayNumber: number; kind: 'training' | 'rest' },
  program: Pick<ClientProgram, 'missedDays' | 'workouts'>,
  language: string,
): DayStatus {
  if (day.kind === 'rest') {
    return { kind: 'normal' };
  }

  const missedRecord = program.missedDays?.find(
    (m) =>
      m.dayNumber === day.dayNumber ||
      (day.id !== null && day.id !== undefined && m.programDayId === day.id),
  );

  const completedWorkout = program.workouts?.find(
    (w) =>
      w.closedAt !== null &&
      (w.dayNumber === day.dayNumber ||
        (day.id !== null && day.id !== undefined && w.programDayId === day.id)),
  );

  if (completedWorkout && completedWorkout.performedOn) {
    const performedWeekday = weekdayIndex(completedWorkout.performedOn);
    const scheduledWeekday = (day.dayNumber - 1) % 7;
    if (missedRecord !== undefined || performedWeekday !== scheduledWeekday) {
      return {
        kind: 'done_other_day',
        weekday: formatWeekdayName(completedWorkout.performedOn, language),
      };
    }
    return { kind: 'normal' };
  }

  if (missedRecord !== undefined) {
    return { kind: 'missed' };
  }

  return { kind: 'normal' };
}
