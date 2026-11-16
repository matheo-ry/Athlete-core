import { describe, expect, it } from 'vitest';

import {
  addDays,
  calendarPosition,
  daysBetween,
  localToday,
  programEndsOn,
  scheduleBlocks,
} from './calendar';
import type { CalendarBlock } from './calendar';

// 2026-11-16 es lunes; 2026-11-18, miércoles.
const MONDAY = '2026-11-16';
const WEDNESDAY = '2026-11-18';

const weekly = (laps: number | null, id: string | null = null): CalendarBlock => ({
  id,
  cycleDays: 7,
  laps,
});
const cycle8 = (laps: number | null, id: string | null = null): CalendarBlock => ({
  id,
  cycleDays: 8,
  laps,
});

describe('fechas de calendario', () => {
  it('suma días y cruza meses y años', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3);
    expect(daysBetween('2027-01-02', '2026-12-30')).toBe(-3);
  });

  it('"hoy" es la fecha del dispositivo, sin hora', () => {
    expect(localToday(new Date(2026, 10, 5, 23, 59))).toBe('2026-11-05');
  });

  it('una fecha mal escrita es un error', () => {
    expect(() => addDays('16/11/2026', 1)).toThrow();
  });
});

describe('scheduleBlocks y programEndsOn', () => {
  it('un bloque semanal que empieza en lunes: 4 vueltas son 28 días', () => {
    expect(scheduleBlocks([weekly(4)], MONDAY)).toEqual([
      { index: 0, startsOn: MONDAY, endsOn: '2026-12-13', partialDays: 0 },
    ]);
  });

  it('un bloque semanal que empieza en miércoles hace antes la semana a medias (D-075)', () => {
    expect(scheduleBlocks([weekly(2)], WEDNESDAY)).toEqual([
      { index: 0, startsOn: WEDNESDAY, endsOn: '2026-12-06', partialDays: 5 },
    ]);
  });

  it('un ciclo de 8 días no se alinea con la semana', () => {
    expect(programEndsOn([cycle8(4)], WEDNESDAY)).toBe(addDays(WEDNESDAY, 31));
  });

  it('varios bloques van uno detrás de otro, y el último puede no tener fin', () => {
    const schedule = scheduleBlocks([cycle8(1), weekly(2), weekly(null)], MONDAY);
    // 8 días: del lunes 16 al lunes 23; el semanal empieza el martes 24, a medias.
    expect(schedule.map((block) => [block.startsOn, block.endsOn, block.partialDays])).toEqual([
      [MONDAY, '2026-11-23', 0],
      ['2026-11-24', '2026-12-13', 6],
      ['2026-12-14', null, 0],
    ]);
    expect(programEndsOn([cycle8(1), weekly(2), weekly(null)], MONDAY)).toBeNull();
  });

  it('se puede empezar desde un bloque que no es el primero (D-083)', () => {
    const blocks = [weekly(1, 'a'), weekly(2, 'b')];
    expect(scheduleBlocks(blocks, MONDAY, 'b')).toEqual([
      { index: 1, startsOn: MONDAY, endsOn: '2026-11-29', partialDays: 0 },
    ]);
    // Un bloque que no existe: se cuenta desde el primero.
    expect(scheduleBlocks(blocks, MONDAY, 'x')[0]?.index).toBe(0);
  });
});

describe('calendarPosition', () => {
  it('una rutina que aún no ha empezado', () => {
    expect(calendarPosition([weekly(null)], '2026-11-26', MONDAY)).toEqual({
      status: 'upcoming',
      startsOn: '2026-11-26',
    });
  });

  it('el primer día es el día 1; un ciclo de 8 días vuelve a empezar el noveno', () => {
    expect(calendarPosition([cycle8(4)], MONDAY, MONDAY)).toMatchObject({
      blockIndex: 0,
      lap: 1,
      dayNumber: 1,
    });
    expect(calendarPosition([cycle8(4)], MONDAY, addDays(MONDAY, 8))).toMatchObject({
      lap: 2,
      dayNumber: 1,
    });
  });

  it('en la semana a medias toca el día de la semana de hoy, en la vuelta 0', () => {
    expect(calendarPosition([weekly(2)], WEDNESDAY, WEDNESDAY)).toMatchObject({
      lap: 0,
      dayNumber: 3,
    });
    // El lunes siguiente empieza la vuelta 1.
    expect(calendarPosition([weekly(2)], WEDNESDAY, '2026-11-23')).toMatchObject({
      lap: 1,
      dayNumber: 1,
    });
  });

  it('pasa al bloque siguiente cuando termina el anterior', () => {
    const blocks = [cycle8(1), weekly(2)];
    expect(calendarPosition(blocks, MONDAY, '2026-11-23')).toMatchObject({
      blockIndex: 0,
      dayNumber: 8,
    });
    // Martes 24: el bloque semanal, a medias.
    expect(calendarPosition(blocks, MONDAY, '2026-11-24')).toMatchObject({
      blockIndex: 1,
      lap: 0,
      dayNumber: 2,
    });
  });

  it('el último bloque, terminadas sus vueltas, se sigue repitiendo (D-075)', () => {
    const position = calendarPosition([weekly(1)], MONDAY, '2026-11-25');
    expect(position).toMatchObject({ lap: 2, dayNumber: 3, isRepeating: true });
    expect(calendarPosition([weekly(1)], MONDAY, '2026-11-22')).toMatchObject({
      isRepeating: false,
    });
  });

  it('un bloque sin fin nunca se marca como repetido', () => {
    expect(calendarPosition([weekly(null)], MONDAY, '2027-06-01')).toMatchObject({
      isRepeating: false,
    });
  });
});
