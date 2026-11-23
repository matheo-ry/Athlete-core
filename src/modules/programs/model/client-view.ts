import type { ClientProgram } from './assignments';
import {
  addDays,
  calendarPosition,
  formatWeekdayName,
  listPosition,
  scheduleBlocks,
  scheduledDateForDay,
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
  /** Índice del bloque activo en la rutina (PR 3.12). */
  blockIndex?: number;
  /** Vuelta activa en el bloque (PR 3.12). */
  lap?: number;
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

  return {
    block,
    todayNumber,
    nextBlockStartsOn,
    isRecovery,
    blockIndex: index,
    lap: position.status === 'running' ? position.lap : 1,
  };
}

export type DayStatus =
  { kind: 'normal' } | { kind: 'missed' } | { kind: 'done_other_day'; weekday: string };

export interface DayExecutionStatusOptions {
  program: Pick<
    ClientProgram,
    'startsOn' | 'mode' | 'startBlockId' | 'blocks' | 'missedDayRules' | 'missedDays' | 'workouts'
  >;
  blockId?: string | null;
  blockIndex: number;
  lap: number;
  today: string;
  language: string;
}

/**
 * Determina el estado de ejecución de un día para la vista del cliente o coach (D-125):
 * - normal: el día se hizo en su fecha prevista o aún no ha llegado
 * - missed: el día se saltó y no se ha recuperado ("Faltado")
 * - done_other_day: el día se hizo en otro día de la semana ("Lunes, hecho el martes")
 */
export function dayExecutionStatus(
  day: { id?: string | null; dayNumber: number; kind: 'training' | 'rest' },
  options: DayExecutionStatusOptions,
): DayStatus {
  if (day.kind === 'rest' || options.program.mode !== 'calendar') {
    return { kind: 'normal' };
  }

  const scheduledDate = scheduledDateForDay(
    options.program.blocks,
    options.program.startsOn,
    options.program.startBlockId,
    {
      blockIndex: options.blockIndex,
      lap: options.lap,
      dayNumber: day.dayNumber,
      rules: options.program.missedDayRules,
      missedDays: options.program.missedDays,
    },
  );

  if (scheduledDate === null) {
    return { kind: 'normal' };
  }

  const isDayMatch = (item: { programDayId?: string | null; dayNumber?: number | null }) => {
    if (day.id !== null && day.id !== undefined && item.programDayId) {
      return item.programDayId === day.id;
    }
    return item.dayNumber === day.dayNumber;
  };

  const missedRecord = options.program.missedDays?.find(
    (m) =>
      m.missedOn === scheduledDate &&
      (m.blockId === null || options.blockId === null || m.blockId === options.blockId) &&
      isDayMatch(m),
  );

  const completedWorkouts = (options.program.workouts ?? []).filter(
    (w) => w.closedAt !== null && isDayMatch(w) && Boolean(w.performedOn),
  );

  // Entreno hecho a tiempo en su fecha prevista
  const onTimeWorkout = completedWorkouts.find((w) => w.performedOn === scheduledDate);
  if (onTimeWorkout) {
    return { kind: 'normal' };
  }

  // Entreno hecho en otra fecha (recuperación o hecho otro día en una ventana de 7 días)
  const otherDayWorkout = completedWorkouts.find(
    (w) =>
      w.performedOn! !== scheduledDate &&
      w.performedOn! >= scheduledDate &&
      w.performedOn! <= addDays(scheduledDate, 7),
  );

  if (otherDayWorkout && otherDayWorkout.performedOn) {
    return {
      kind: 'done_other_day',
      weekday: formatWeekdayName(otherDayWorkout.performedOn, options.language),
    };
  }

  // Si no se hizo y está registrado como faltado (o pasó su fecha prevista)
  if (missedRecord !== undefined || scheduledDate < options.today) {
    return { kind: 'missed' };
  }

  return { kind: 'normal' };
}
