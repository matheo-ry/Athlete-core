// El calendario de una rutina asignada (DECISIONES D-075, D-081 a D-083):
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
function weekdayIndex(date: string): number {
  // El 1 de enero de 1970 fue jueves (3).
  return (((toDayNumber(date) + 3) % WEEK) + WEEK) % WEEK;
}

/**
 * Los bloques que se hacen, desde el de inicio, con sus fechas. Un bloque
 * semanal va de lunes a domingo: si empieza otro día, primero hace la semana
 * a medias y después sus vueltas completas (D-075).
 */
export function scheduleBlocks(
  blocks: readonly CalendarBlock[],
  startsOn: string,
  startBlockId: string | null = null,
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
    const length = laps === null ? null : partialDays + laps * block.cycleDays;
    scheduled.push({
      index,
      startsOn: start,
      endsOn: length === null ? null : addDays(start, length - 1),
      partialDays,
    });
    if (length === null) {
      break;
    }
    start = addDays(start, length);
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
): string | null {
  return scheduleBlocks(blocks, startsOn, startBlockId).at(-1)?.endsOn ?? null;
}

/** En qué bloque, vuelta y día va la rutina en la fecha `today`. */
export function calendarPosition(
  blocks: readonly CalendarBlock[],
  startsOn: string,
  today: string,
  startBlockId: string | null = null,
): CalendarPosition {
  if (daysBetween(startsOn, today) < 0) {
    return { status: 'upcoming', startsOn };
  }
  const schedule = scheduleBlocks(blocks, startsOn, startBlockId);
  const last = schedule.at(-1);
  if (last === undefined) {
    throw new Error('A program needs at least one block');
  }
  const current =
    schedule.find((item) => item.endsOn === null || daysBetween(today, item.endsOn) >= 0) ?? last;
  const cycleDays = blocks[current.index]?.cycleDays ?? 1;
  const elapsed = daysBetween(current.startsOn, today);

  if (elapsed < current.partialDays) {
    // La semana a medias: hoy es el día de la semana que toca.
    return {
      status: 'running',
      blockIndex: current.index,
      lap: 0,
      dayNumber: weekdayIndex(today) + 1,
      isRepeating: false,
    };
  }
  const intoLaps = elapsed - current.partialDays;
  const lap = Math.floor(intoLaps / cycleDays) + 1;
  const laps = blocks[current.index]?.laps ?? null;
  return {
    status: 'running',
    blockIndex: current.index,
    lap,
    dayNumber: (intoLaps % cycleDays) + 1,
    isRepeating: current === last && laps !== null && lap > laps,
  };
}
