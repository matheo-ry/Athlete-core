import { describe, expect, it } from 'vitest';

import {
  activeMissedDayRule,
  addDays,
  calendarPosition,
  daysBetween,
  listPosition,
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

describe('las tres reglas del día saltado (D-125, D-139)', () => {
  // Lunes 16 es día 1 (entreno); martes 17 es día 2 (descanso); miércoles 18 es día 3 (entreno).
  // Jueves 19 es día 4 (descanso); viernes 20 es día 5 (entreno); sábado 21 y domingo 22 descanso.
  const isRest = (_b: number, day: number) => day === 2 || day === 4 || day === 6 || day === 7;

  describe('1. Se pierde (lose)', () => {
    it('Criterio 1: sin entrenar el lunes, el martes es descanso y el fin de bloque no cambia', () => {
      const blocks = [weekly(4)];
      const missedMonday = [{ dayNumber: 1, missedOn: '2026-11-16' }];
      const options = {
        rules: [{ rule: 'lose' as const, startsOn: '2026-11-16' }],
        missedDays: missedMonday,
        isRestDay: isRest,
      };

      // El martes toca lo del martes (descanso, día 2)
      const tuesdayPos = calendarPosition(blocks, MONDAY, '2026-11-17', null, options);
      expect(tuesdayPos).toMatchObject({
        status: 'running',
        dayNumber: 2,
        isRecovery: false,
      });

      // El final del bloque sigue siendo el 13 de diciembre
      expect(programEndsOn(blocks, MONDAY, null, options)).toBe('2026-12-13');
    });
  });

  describe('2. Se recupera en el siguiente descanso (recover)', () => {
    it('Criterio 2: tras faltar el lunes, el martes (descanso) sale con isRecovery: true y día 1', () => {
      const blocks = [weekly(4)];
      const missedMonday = [{ dayNumber: 1, missedOn: '2026-11-16' }];
      const options = {
        rules: [{ rule: 'recover' as const, startsOn: '2026-11-16' }],
        missedDays: missedMonday,
        isRestDay: isRest,
      };

      const tuesdayPos = calendarPosition(blocks, MONDAY, '2026-11-17', null, options);
      expect(tuesdayPos).toMatchObject({
        status: 'running',
        dayNumber: 1,
        isRecovery: true,
        recoveredDayNumber: 1,
      });

      // El miércoles toca el día 3 normal (entreno), no es recuperación
      const wednesdayPos = calendarPosition(blocks, MONDAY, '2026-11-18', null, options);
      expect(wednesdayPos).toMatchObject({
        status: 'running',
        dayNumber: 3,
        isRecovery: false,
      });

      // En 'recover', el fin de bloque no se retrasa
      expect(programEndsOn(blocks, MONDAY, null, options)).toBe('2026-12-13');
    });

    it('si faltan varios, se recuperan por orden en los descansos sucesivos', () => {
      const blocks = [weekly(4)];
      const missedDays = [
        { dayNumber: 1, missedOn: '2026-11-16' },
        { dayNumber: 3, missedOn: '2026-11-18' },
      ];
      const options = {
        rules: [{ rule: 'recover' as const, startsOn: '2026-11-16' }],
        missedDays,
        isRestDay: isRest,
      };

      // Martes 17 recupera el lunes 16 (día 1)
      const tue = calendarPosition(blocks, MONDAY, '2026-11-17', null, options);
      expect(tue).toMatchObject({ dayNumber: 1, isRecovery: true });

      // Jueves 19 recupera el miércoles 18 (día 3)
      const thu = calendarPosition(blocks, MONDAY, '2026-11-19', null, options);
      expect(thu).toMatchObject({ dayNumber: 3, isRecovery: true });
    });
  });

  describe('3. Se mueve todo (shift)', () => {
    it('Criterio 3: tras faltar un día, el ciclo se mueve 1 y el bloque termina un día más tarde', () => {
      // Ciclo de 8 días de Bruno
      const blocks = [cycle8(3)];
      const missedMonday = [{ dayNumber: 1, missedOn: '2026-11-16' }];
      const options = {
        rules: [{ rule: 'shift' as const, startsOn: '2026-11-16' }],
        missedDays: missedMonday,
      };

      // El martes toca lo del lunes (día 1)
      const tuesdayPos = calendarPosition(blocks, MONDAY, '2026-11-17', null, options);
      expect(tuesdayPos).toMatchObject({
        status: 'running',
        dayNumber: 1,
      });

      // 3 vueltas de 8 días = 24 días. Sin saltos terminaría el 9 de diciembre (startsOn + 23).
      // Con 1 día saltado, termina el 10 de diciembre (+1 día).
      const normalEndsOn = programEndsOn(blocks, MONDAY, null);
      const shiftedEndsOn = programEndsOn(blocks, MONDAY, null, options);
      expect(normalEndsOn).toBe('2026-12-09');
      expect(shiftedEndsOn).toBe('2026-12-10');
    });

    it('con varios bloques, se retrasa también el fin de cada bloque y el inicio del siguiente', () => {
      const blocks = [weekly(2), weekly(2)];
      const missedMonday = [{ dayNumber: 1, missedOn: '2026-11-16' }];
      const options = {
        rules: [{ rule: 'shift' as const, startsOn: '2026-11-16' }],
        missedDays: missedMonday,
      };

      const schedule = scheduleBlocks(blocks, MONDAY, null, options);
      // Bloque 1: dura 14 + 1 = 15 días: del 16 al 30 de nov
      expect(schedule[0]?.startsOn).toBe('2026-11-16');
      expect(schedule[0]?.endsOn).toBe('2026-11-30');

      // Bloque 2: empieza el 1 de dic en vez del 30 de nov
      expect(schedule[1]?.startsOn).toBe('2026-12-01');
    });

    it('una rutina próxima empieza en su fecha aunque la vigente se haya movido', () => {
      const currentBlocks = [weekly(2)];
      const options = {
        rules: [{ rule: 'shift' as const, startsOn: '2026-11-16' }],
        missedDays: [{ dayNumber: 1, missedOn: '2026-11-16' }],
      };

      // La vigente se mueve
      expect(programEndsOn(currentBlocks, MONDAY, null, options)).toBe('2026-11-30');

      // La próxima mantiene su startsOn asignado (D-125)
      const nextStartsOn = '2026-11-30';
      const nextBlocks = [weekly(null)];
      expect(scheduleBlocks(nextBlocks, nextStartsOn)[0]?.startsOn).toBe('2026-11-30');
    });
  });
});

describe('modo lista: avance por entrenos hechos (D-125)', () => {
  it('Criterio 4: Diego en modo lista avanza por entrenos completados, no por fechas', () => {
    // 2 bloques: Bloque 1 (ciclo de 7 días con 4 de entreno, 4 vueltas = 16 entrenos)
    // Bloque 2 (ciclo de 7 días con 4 de entreno, 4 vueltas = 16 entrenos)
    const blocks: CalendarBlock[] = [
      { id: 'b1', cycleDays: 7, laps: 4, trainingDaysCount: 4 },
      { id: 'b2', cycleDays: 7, laps: 4, trainingDaysCount: 4 },
    ];
    const trainingDaysPerBlock = [4, 4];

    // Con 0 entrenos: Bloque 1, vuelta 1
    expect(listPosition(blocks, 0, trainingDaysPerBlock)).toEqual({
      blockIndex: 0,
      lap: 1,
      dayIndex: 0,
      isRepeating: false,
    });

    // Con 15 entrenos: Bloque 1, vuelta 4
    expect(listPosition(blocks, 15, trainingDaysPerBlock)).toEqual({
      blockIndex: 0,
      lap: 4,
      dayIndex: 3,
      isRepeating: false,
    });

    // Con 16 entrenos: pasa al Bloque 2, vuelta 1
    expect(listPosition(blocks, 16, trainingDaysPerBlock)).toEqual({
      blockIndex: 1,
      lap: 1,
      dayIndex: 0,
      isRepeating: false,
    });

    // Con 31 entrenos: Bloque 2, vuelta 4
    expect(listPosition(blocks, 31, trainingDaysPerBlock)).toEqual({
      blockIndex: 1,
      lap: 4,
      dayIndex: 3,
      isRepeating: false,
    });

    // Con 32 o más entrenos: último bloque repitiéndose (vuelta 5 > 4 vueltas)
    expect(listPosition(blocks, 32, trainingDaysPerBlock)).toEqual({
      blockIndex: 1,
      lap: 5,
      dayIndex: 0,
      isRepeating: true,
    });
  });

  describe('activeMissedDayRule (D-125)', () => {
    it('devuelve lose por defecto si no hay reglas o es anterior a la primera', () => {
      expect(activeMissedDayRule(undefined, '2026-11-16')).toBe('lose');
      expect(activeMissedDayRule([], '2026-11-16')).toBe('lose');
      expect(activeMissedDayRule([{ rule: 'shift', startsOn: '2026-11-17' }], '2026-11-16')).toBe(
        'lose',
      );
    });

    it('devuelve la regla vigente en la fecha según el historial', () => {
      const rules = [
        { rule: 'recover' as const, startsOn: '2026-11-10' },
        { rule: 'shift' as const, startsOn: '2026-11-20' },
      ];
      expect(activeMissedDayRule(rules, '2026-11-09')).toBe('lose');
      expect(activeMissedDayRule(rules, '2026-11-10')).toBe('recover');
      expect(activeMissedDayRule(rules, '2026-11-15')).toBe('recover');
      expect(activeMissedDayRule(rules, '2026-11-20')).toBe('shift');
      expect(activeMissedDayRule(rules, '2026-11-25')).toBe('shift');
    });
  });
});
