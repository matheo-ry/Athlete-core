// El calendario de una rutina asignada (DECISIONES D-075, D-081 a D-083, D-125, D-139):
// dada su lista de bloques, la fecha de inicio, el bloque desde el que se
// cuenta y "hoy", dice en qué bloque, vuelta y día va, y cuándo termina cada
// bloque. No hay ninguna tarea programada: todo se calcula al leer.
//
// Las fechas son días de calendario, "AAAA-MM-DD", sin hora ni zona: "hoy" es
// la fecha del dispositivo (D-082). Se cuentan en días enteros con UTC para
// que los cambios de hora no muevan nada.

/** Lo que el calendario necesita de cada bloque. `laps` vacío = sin fin. */
export interface CalendarBlock {
  id: string | null;
  cycleDays: number;
  laps: number | null;
  trainingDaysCount?: number;
}

/** Las tres reglas del día saltado (D-125, D-139). */
export type MissedDayRule = 'lose' | 'recover' | 'shift';

export interface MissedDayRuleHistory {
  rule: MissedDayRule;
  startsOn: string;
}

export interface MissedDayRecord {
  id?: string;
  blockId?: string | null;
  programDayId?: string | null;
  dayNumber: number;
  missedOn: string;
}

export interface CalendarOptions {
  rules?: readonly MissedDayRuleHistory[];
  missedDays?: readonly MissedDayRecord[];
  /** Indica si un día de un bloque es de descanso. */
  isRestDay?: (blockIndex: number, dayNumber: number) => boolean;
  /** Para modo lista: número de entrenos completados (D-125). */
  completedWorkouts?: number;
  /** Días de entreno por bloque en modo lista. */
  trainingDaysPerBlock?: readonly number[];
}

/** Un bloque colocado en el calendario. `endsOn` vacío = se repite sin fin. */
export interface ScheduledBlock {
  /** Posición en la rutina, desde 0. */
  index: number;
  startsOn: string;
  endsOn: string | null;
  /** Días de la primera semana a medias de un bloque semanal (D-075). */
  partialDays: number;
}

export type CalendarPosition =
  | { status: 'upcoming'; startsOn: string }
  | {
      status: 'running';
      blockIndex: number;
      /** 0 = la semana a medias del principio; después, 1, 2… */
      lap: number;
      dayNumber: number;
      /** El último bloque terminó sus vueltas y se sigue repitiendo (D-075). */
      isRepeating: boolean;
      /** Si hoy toca recuperar un día faltado anterior (D-125). */
      isRecovery?: boolean;
      /** El número de día original que se recupera hoy. */
      recoveredDayNumber?: number;
    };

const DAY_MS = 86_400_000;
const WEEK = 7;

function toDayNumber(date: string): number {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (parts === null) {
    throw new Error('Invalid calendar date');
  }
  return Date.UTC(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])) / DAY_MS;
}

function fromDayNumber(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** Suma días a una fecha "AAAA-MM-DD". */
export function addDays(date: string, days: number): string {
  return fromDayNumber(toDayNumber(date) + days);
}

/** Días de una fecha a otra (negativo si la segunda es anterior). */
export function daysBetween(from: string, to: string): number {
  return toDayNumber(to) - toDayNumber(from);
}

/** La fecha de hoy en el dispositivo, "AAAA-MM-DD". */
export function localToday(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${String(now.getFullYear())}-${month}-${day}`;
}

/** Lunes = 0 … domingo = 6. */
export function weekdayIndex(date: string): number {
  // El 1 de enero de 1970 fue jueves (3).
  return (((toDayNumber(date) + 3) % WEEK) + WEEK) % WEEK;
}

/** Nombre del día de la semana en minúsculas en el idioma del usuario ("martes", "Tuesday"). */
export function formatWeekdayName(date: string, language: string): string {
  const parts = date.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (year === undefined || month === undefined || day === undefined) {
    return '';
  }
  const d = new Date(Date.UTC(year, month - 1, day));
  const name = new Intl.DateTimeFormat(language, { weekday: 'long', timeZone: 'UTC' }).format(d);
  return language.startsWith('es') ? name.toLowerCase() : name;
}

/** Devuelve la regla del día saltado activa en una fecha (D-125, D-139). Por defecto 'lose'. */
export function activeMissedDayRule(
  rules: readonly MissedDayRuleHistory[] | undefined,
  date: string,
): MissedDayRule {
  if (!rules || rules.length === 0) {
    return 'lose';
  }
  const sorted = [...rules].sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  const active = sorted.filter((r) => r.startsOn <= date).at(-1);
  return active?.rule ?? 'lose';
}

/** Determina si un día faltado produce retraso en el calendario. */
function doesMissedDayShift(
  missedOn: string,
  rules: readonly MissedDayRuleHistory[] | undefined,
  referenceDate?: string,
): boolean {
  if (!rules || rules.length === 0) {
    return false;
  }
  const ruleAtMissed = activeMissedDayRule(rules, missedOn);
  if (ruleAtMissed === 'shift') {
    return true;
  }
  if (referenceDate !== undefined) {
    const ruleAtRef = activeMissedDayRule(rules, referenceDate);
    if (ruleAtRef === 'shift') {
      return true;
    }
  }
  return false;
}

/** Cuenta cuántos días faltados causan un retraso en o antes de una fecha. */
export function countShiftDays(
  missedDays: readonly MissedDayRecord[] | undefined,
  rules: readonly MissedDayRuleHistory[] | undefined,
  beforeOrOnDate: string,
): number {
  if (!missedDays || missedDays.length === 0) {
    return 0;
  }
  return missedDays.filter(
    (m) => m.missedOn <= beforeOrOnDate && doesMissedDayShift(m.missedOn, rules, beforeOrOnDate),
  ).length;
}

/**
 * En modo lista (D-125): el bloque avanza por entrenos hechos, no por fechas.
 * Un bloque de laps vueltas con T días de entreno dura laps * T entrenos.
 */
export function listPosition(
  blocks: readonly CalendarBlock[],
  completedWorkouts: number,
  trainingDaysPerBlock?: readonly number[],
): {
  blockIndex: number;
  lap: number;
  dayIndex: number;
  isRepeating: boolean;
} {
  let remaining = Math.max(0, completedWorkouts);
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block === undefined) break;
    const trainingDays =
      trainingDaysPerBlock?.[index] ?? block.trainingDaysCount ?? block.cycleDays;
    const isLast = index === blocks.length - 1;
    const laps = block.laps ?? (isLast ? null : 1);
    const capacity = laps === null ? null : laps * trainingDays;

    if (capacity === null || remaining < capacity) {
      const lap = Math.floor(remaining / Math.max(1, trainingDays)) + 1;
      const dayIndex = remaining % Math.max(1, trainingDays);
      return { blockIndex: index, lap, dayIndex, isRepeating: false };
    }
    if (isLast) {
      const lap = Math.floor(remaining / Math.max(1, trainingDays)) + 1;
      const dayIndex = remaining % Math.max(1, trainingDays);
      return { blockIndex: index, lap, dayIndex, isRepeating: true };
    }
    remaining -= capacity;
  }
  return { blockIndex: 0, lap: 1, dayIndex: 0, isRepeating: false };
}

/**
 * Los bloques que se hacen, desde el de inicio, con sus fechas. Un bloque
 * semanal va de lunes a domingo: si empieza otro día, primero hace la semana
 * a medias y después sus vueltas completas (D-075). Con la regla 'shift',
 * los días faltados retrasan el final de cada bloque (D-125).
 */
export function scheduleBlocks(
  blocks: readonly CalendarBlock[],
  startsOn: string,
  startBlockId: string | null = null,
  options?: CalendarOptions,
): ScheduledBlock[] {
  const first = Math.max(
    0,
    blocks.findIndex((block) => block.id !== null && block.id === startBlockId),
  );
  const scheduled: ScheduledBlock[] = [];
  let start = startsOn;
  for (let index = first; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block === undefined) {
      break;
    }
    const weekday = weekdayIndex(start);
    const partialDays = block.cycleDays === WEEK && weekday !== 0 ? WEEK - weekday : 0;
    const isLast = index === blocks.length - 1;
    // Solo el último puede no tener fin; si otro no lo tiene, se toma 1 vuelta.
    const laps = block.laps ?? (isLast ? null : 1);
    const baseLength = laps === null ? null : partialDays + laps * block.cycleDays;

    // Con 'shift', los días saltados en este bloque retrasan su final.
    let shiftDaysInBlock = 0;
    if (baseLength !== null && options?.missedDays && options.missedDays.length > 0) {
      const unshiftedEnd = addDays(start, baseLength - 1);
      shiftDaysInBlock = options.missedDays.filter(
        (m) =>
          m.missedOn >= start &&
          m.missedOn <= unshiftedEnd &&
          doesMissedDayShift(m.missedOn, options.rules, unshiftedEnd),
      ).length;
    }

    const totalLength = baseLength === null ? null : baseLength + shiftDaysInBlock;
    scheduled.push({
      index,
      startsOn: start,
      endsOn: totalLength === null ? null : addDays(start, totalLength - 1),
      partialDays,
    });
    if (totalLength === null) {
      break;
    }
    start = addDays(start, totalLength);
  }
  return scheduled;
}

/**
 * Cuándo termina la rutina: el último día de su último bloque. Vacío si se
 * repite sin fin.
 */
export function programEndsOn(
  blocks: readonly CalendarBlock[],
  startsOn: string,
  startBlockId: string | null = null,
  options?: CalendarOptions,
): string | null {
  return scheduleBlocks(blocks, startsOn, startBlockId, options).at(-1)?.endsOn ?? null;
}

/** En qué bloque, vuelta y día va la rutina en la fecha `today`. */
export function calendarPosition(
  blocks: readonly CalendarBlock[],
  startsOn: string,
  today: string,
  startBlockId: string | null = null,
  options?: CalendarOptions,
): CalendarPosition {
  if (daysBetween(startsOn, today) < 0) {
    return { status: 'upcoming', startsOn };
  }
  const schedule = scheduleBlocks(blocks, startsOn, startBlockId, options);
  const last = schedule.at(-1);
  if (last === undefined) {
    throw new Error('A program needs at least one block');
  }
  const current =
    schedule.find((item) => item.endsOn === null || daysBetween(today, item.endsOn) >= 0) ?? last;
  const cycleDays = blocks[current.index]?.cycleDays ?? 1;

  // Con 'shift', los días saltados anteriores a today desplazan la posición efectiva.
  let shiftCountBefore = 0;
  if (options?.missedDays && options.missedDays.length > 0) {
    shiftCountBefore = options.missedDays.filter(
      (m) =>
        m.missedOn >= current.startsOn &&
        m.missedOn < today &&
        doesMissedDayShift(m.missedOn, options.rules, today),
    ).length;
  }

  const rawElapsed = daysBetween(current.startsOn, today);
  const elapsed = Math.max(0, rawElapsed - shiftCountBefore);

  let lap: number;
  let dayNumber: number;
  let isRepeating: boolean;

  if (elapsed < current.partialDays) {
    // La semana a medias: hoy es el día de la semana que toca.
    const shiftedDate = addDays(current.startsOn, elapsed);
    lap = 0;
    dayNumber = weekdayIndex(shiftedDate) + 1;
    isRepeating = false;
  } else {
    const intoLaps = elapsed - current.partialDays;
    lap = Math.floor(intoLaps / cycleDays) + 1;
    dayNumber = (intoLaps % cycleDays) + 1;
    const laps = blocks[current.index]?.laps ?? null;
    isRepeating = current === last && laps !== null && lap > laps;
  }

  // Comprobar regla 'recover' (D-125):
  // Si hoy es descanso y la regla activa hoy es 'recover', los días de descanso
  // recuperan en orden los días faltados de entreno anteriores aún pendientes.
  const activeRule = activeMissedDayRule(options?.rules, today);
  if (activeRule === 'recover' && options?.isRestDay?.(current.index, dayNumber)) {
    // Buscar días faltados de entreno antes de hoy.
    const missedList = [...(options.missedDays ?? [])]
      .filter((m) => m.missedOn < today)
      .sort((a, b) => a.missedOn.localeCompare(b.missedOn));

    if (missedList.length > 0) {
      // Simular descansos desde el primer día faltado hasta hoy
      const firstMissedDate = missedList[0]?.missedOn ?? current.startsOn;
      const queue = [...missedList];
      let assignedToToday: MissedDayRecord | null = null;

      let simDate = firstMissedDate;
      while (simDate <= today && queue.length > 0) {
        if (simDate > firstMissedDate) {
          // Evaluar si simDate era día de descanso normal
          const simElapsed = daysBetween(current.startsOn, simDate);
          const simDay =
            simElapsed < current.partialDays
              ? weekdayIndex(simDate) + 1
              : ((simElapsed - current.partialDays) % cycleDays) + 1;
          if (options.isRestDay?.(current.index, simDay)) {
            const recovered = queue.shift();
            if (simDate === today && recovered) {
              assignedToToday = recovered;
              break;
            }
          }
        }
        simDate = addDays(simDate, 1);
      }

      if (assignedToToday !== null) {
        return {
          status: 'running',
          blockIndex: current.index,
          lap,
          dayNumber: assignedToToday.dayNumber,
          isRepeating,
          isRecovery: true,
          recoveredDayNumber: assignedToToday.dayNumber,
        };
      }
    }
  }

  return {
    status: 'running',
    blockIndex: current.index,
    lap,
    dayNumber,
    isRepeating,
    isRecovery: false,
  };
}
