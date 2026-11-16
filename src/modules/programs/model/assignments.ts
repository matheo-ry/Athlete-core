import { z } from 'zod';

import { calendarPosition, daysBetween, programEndsOn } from './calendar';
import type { CalendarBlock } from './calendar';

// Las rutinas de los clientes que siguen abiertas (D-081): la vigente de cada
// uno y su próxima. Se calcula al leer, con "hoy" del dispositivo (D-082).

export const PROGRAM_MODES = ['calendar', 'list'] as const;
export type ProgramMode = (typeof PROGRAM_MODES)[number];

export interface ClientProgram {
  id: string;
  name: string;
  clientId: string;
  startsOn: string;
  startBlockId: string | null;
  mode: ProgramMode;
  /** La terminó el coach o se sustituyó: está en "Anteriores" (D-081). */
  endedAt: string | null;
  blocks: CalendarBlock[];
}

/** Lo que tiene cada cliente: la rutina vigente y la próxima, si las hay. */
export interface ClientRoutines {
  current: ClientProgram | null;
  next: ClientProgram | null;
}

const rowSchema = z.object({
  id: z.string(),
  name: z.string(),
  client_id: z.string(),
  starts_on: z.string(),
  start_block_id: z.string().nullable(),
  mode: z.enum(PROGRAM_MODES),
  // Las rutinas abiertas se piden sin esta columna.
  ended_at: z.string().nullable().optional(),
  program_blocks: z.array(
    z.object({
      id: z.string(),
      position: z.number().int(),
      cycle_days: z.number().int(),
      laps: z.number().int().nullable(),
    }),
  ),
});

export function parseClientPrograms(rows: unknown): ClientProgram[] {
  return z
    .array(rowSchema)
    .parse(rows)
    .map((row) => ({
      id: row.id,
      name: row.name,
      clientId: row.client_id,
      startsOn: row.starts_on,
      startBlockId: row.start_block_id,
      mode: row.mode,
      endedAt: row.ended_at ?? null,
      blocks: [...row.program_blocks]
        .sort((a, b) => a.position - b.position)
        .map((block) => ({ id: block.id, cycleDays: block.cycle_days, laps: block.laps })),
    }));
}

/**
 * Agrupa las rutinas abiertas por cliente. La vigente es la de fecha de
 * inicio más reciente que no sea futura; la próxima, la que empieza después
 * de hoy (D-081).
 */
export function routinesByClient(
  programs: readonly ClientProgram[],
  today: string,
): Map<string, ClientRoutines> {
  const byClient = new Map<string, ClientRoutines>();
  for (const program of programs.filter((item) => item.endedAt === null)) {
    const routines = byClient.get(program.clientId) ?? { current: null, next: null };
    if (daysBetween(today, program.startsOn) > 0) {
      if (routines.next === null || program.startsOn < routines.next.startsOn) {
        routines.next = program;
      }
    } else if (routines.current === null || program.startsOn > routines.current.startsOn) {
      routines.current = program;
    }
    byClient.set(program.clientId, routines);
  }
  return byClient;
}

/**
 * Qué le pasa a cada cliente elegido al asignar una rutina que empieza en
 * `startsOn`: con fecha de hoy o pasada, su vigente pasa a "Anteriores"; con
 * fecha futura, su próxima se sustituye (D-081 y D-105).
 */
export type AssignmentWarning =
  | { kind: 'replacesCurrent'; clientId: string; programName: string }
  | { kind: 'replacesNext'; clientId: string; programName: string };

export function assignmentWarnings(
  clientIds: readonly string[],
  routines: ReadonlyMap<string, ClientRoutines>,
  startsOn: string,
  today: string,
): AssignmentWarning[] {
  const isFuture = daysBetween(today, startsOn) > 0;
  return clientIds.flatMap((clientId): AssignmentWarning[] => {
    const own = routines.get(clientId);
    const replaced = isFuture ? own?.next : own?.current;
    if (replaced === null || replaced === undefined) {
      return [];
    }
    return [
      {
        kind: isFuture ? 'replacesNext' : 'replacesCurrent',
        clientId,
        programName: replaced.name,
      },
    ];
  });
}

/** Por dónde va una rutina hoy, para enseñarlo en una línea (PR 2.13b). */
export interface RoutineProgress {
  /** Desde 1. */
  blockNumber: number;
  blockCount: number;
  /** 0 = la semana a medias del principio (D-075). */
  lap: number;
  /** Vueltas del bloque en que va; vacío = sin fin. */
  laps: number | null;
  isWeekly: boolean;
  /** El último bloque terminó sus vueltas y se repite (D-075): el coach debería cambiarla. */
  isRepeating: boolean;
  /** Cuándo termina la rutina entera; vacío = se repite sin fin. */
  endsOn: string | null;
}

/** En qué bloque y vuelta va hoy la rutina vigente de un cliente. */
export function routineProgress(program: ClientProgram, today: string): RoutineProgress | null {
  const position = calendarPosition(program.blocks, program.startsOn, today, program.startBlockId);
  if (position.status === 'upcoming') {
    return null;
  }
  const block = program.blocks[position.blockIndex];
  return {
    blockNumber: position.blockIndex + 1,
    blockCount: program.blocks.length,
    lap: position.lap,
    laps: block?.laps ?? null,
    isWeekly: block?.cycleDays === 7,
    isRepeating: position.isRepeating,
    endsOn: programEndsOn(program.blocks, program.startsOn, program.startBlockId),
  };
}
