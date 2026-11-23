import { z } from 'zod';

import { calendarPosition, daysBetween, listPosition, programEndsOn } from './calendar';
import type {
  CalendarBlock,
  CalendarOptions,
  MissedDayRecord,
  MissedDayRule,
  MissedDayRuleHistory,
} from './calendar';

export type { MissedDayRecord, MissedDayRule, MissedDayRuleHistory };

// Las rutinas de los clientes que siguen abiertas (D-081): la vigente de cada
// uno y su próxima. Se calcula al leer, con "hoy" del dispositivo (D-082).

export const PROGRAM_MODES = ['calendar', 'list'] as const;
export type ProgramMode = (typeof PROGRAM_MODES)[number];

export interface ClientProgramWorkout {
  id?: string;
  programDayId?: string | null;
  dayNumber?: number;
  performedOn?: string;
  closedAt?: string | null;
}

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
  missedDayRules?: MissedDayRuleHistory[];
  missedDays?: MissedDayRecord[];
  workouts?: ClientProgramWorkout[];
  completedWorkoutsCount?: number;
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
  program_missed_day_rules: z
    .array(
      z.object({
        rule: z.enum(['lose', 'recover', 'shift']),
        starts_on: z.string(),
      }),
    )
    .optional()
    .nullable(),
  program_missed_days: z
    .array(
      z.object({
        id: z.string().optional(),
        block_id: z.string().nullable().optional(),
        program_day_id: z.string().nullable().optional(),
        day_number: z.number().int(),
        missed_on: z.string(),
      }),
    )
    .optional()
    .nullable(),
  workouts: z
    .array(
      z.object({
        id: z.string().optional(),
        program_day_id: z.string().nullable().optional(),
        day_number: z.number().optional(),
        performed_on: z.string().optional(),
        closed_at: z.string().nullable().optional(),
      }),
    )
    .optional()
    .nullable(),
});

/** Una rutina ya leída, tal como se guarda en el móvil para entrenar sin conexión (D-118). */
export const clientProgramSchema: z.ZodType<ClientProgram> = z.object({
  id: z.string(),
  name: z.string(),
  clientId: z.string(),
  startsOn: z.string(),
  startBlockId: z.string().nullable(),
  mode: z.enum(PROGRAM_MODES),
  endedAt: z.string().nullable(),
  blocks: z.array(
    z.object({
      id: z.string().nullable(),
      cycleDays: z.number().int(),
      laps: z.number().int().nullable(),
      trainingDaysCount: z.number().int().optional(),
    }),
  ),
  missedDayRules: z
    .array(
      z.object({
        rule: z.enum(['lose', 'recover', 'shift']),
        startsOn: z.string(),
      }),
    )
    .optional(),
  missedDays: z
    .array(
      z.object({
        id: z.string().optional(),
        blockId: z.string().nullable().optional(),
        programDayId: z.string().nullable().optional(),
        dayNumber: z.number().int(),
        missedOn: z.string(),
      }),
    )
    .optional(),
  workouts: z
    .array(
      z.object({
        id: z.string().optional(),
        programDayId: z.string().nullable().optional(),
        dayNumber: z.number().optional(),
        performedOn: z.string().optional(),
        closedAt: z.string().nullable().optional(),
      }),
    )
    .optional(),
  completedWorkoutsCount: z.number().int().optional(),
});

export function parseClientPrograms(rows: unknown): ClientProgram[] {
  return z
    .array(rowSchema)
    .parse(rows)
    .map((row) => {
      const missedDayRules = (row.program_missed_day_rules ?? []).map((r) => ({
        rule: r.rule,
        startsOn: r.starts_on,
      }));
      const missedDays = (row.program_missed_days ?? []).map((m) => ({
        id: m.id,
        blockId: m.block_id ?? null,
        programDayId: m.program_day_id ?? null,
        dayNumber: m.day_number,
        missedOn: m.missed_on,
      }));
      const workouts = (row.workouts ?? [])
        .filter(
          (w) =>
            w.closed_at !== null &&
            w.closed_at !== undefined &&
            (w.performed_on === undefined || w.performed_on >= row.starts_on),
        )
        .map((w) => ({
          programDayId: w.program_day_id ?? null,
          performedOn: w.performed_on,
          closedAt: w.closed_at ?? null,
        }));
      const completedWorkoutsCount = workouts.length;

      return {
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
        missedDayRules,
        missedDays,
        workouts,
        completedWorkoutsCount,
      };
    });
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
export function routineProgress(
  program: ClientProgram,
  today: string,
  options?: CalendarOptions,
): RoutineProgress | null {
  const opts: CalendarOptions = {
    rules: program.missedDayRules,
    missedDays: program.missedDays,
    completedWorkouts: program.completedWorkoutsCount,
    ...options,
  };

  if (program.mode === 'list') {
    const pos = listPosition(
      program.blocks,
      opts.completedWorkouts ?? program.completedWorkoutsCount ?? 0,
      opts.trainingDaysPerBlock,
    );
    const block = program.blocks[pos.blockIndex];
    return {
      blockNumber: pos.blockIndex + 1,
      blockCount: program.blocks.length,
      lap: pos.lap,
      laps: block?.laps ?? null,
      isWeekly: block?.cycleDays === 7,
      isRepeating: pos.isRepeating,
      endsOn: null,
    };
  }

  const position = calendarPosition(
    program.blocks,
    program.startsOn,
    today,
    program.startBlockId,
    opts,
  );
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
    endsOn: programEndsOn(program.blocks, program.startsOn, program.startBlockId, opts),
  };
}
