import { describe, expect, it } from 'vitest';

import { parseClientPrograms } from './assignments';
import { clientBlock, dayExecutionStatus } from './client-view';
import { newTemplate } from './program-document';

const TODAY = '2026-11-18'; // miércoles

function program(mode: 'calendar' | 'list', startsOn: string) {
  const [parsed] = parseClientPrograms([
    {
      id: 'p',
      name: 'Casa + Gym',
      client_id: 'ana',
      starts_on: startsOn,
      start_block_id: null,
      mode,
      program_blocks: [{ id: 'b', position: 1, cycle_days: 7, laps: null }],
    },
  ]);
  if (parsed === undefined) throw new Error('falta la rutina');
  return parsed;
}

describe('clientBlock con varios bloques (PR 2.16)', () => {
  it('va por el bloque que toca y dice cuándo empieza el siguiente', () => {
    const [parsed] = parseClientPrograms([
      {
        id: 'p',
        name: 'Dos bloques',
        client_id: 'ana',
        starts_on: '2026-11-16',
        start_block_id: null,
        mode: 'calendar',
        program_blocks: [
          { id: 'b1', position: 1, cycle_days: 7, laps: 1 },
          { id: 'b2', position: 2, cycle_days: 7, laps: null },
        ],
      },
    ]);
    if (parsed === undefined) throw new Error('falta la rutina');
    const first = newTemplate('Dos bloques', 7).blocks[0];
    if (first === undefined) throw new Error('falta el bloque');
    const document = { ...newTemplate('Dos bloques', 7), blocks: [first, { ...first, name: 'B' }] };

    const inFirst = clientBlock(parsed, document, '2026-11-18');
    expect(inFirst?.block).toBe(document.blocks[0]);
    expect(inFirst?.nextBlockStartsOn).toBe('2026-11-23');

    const inSecond = clientBlock(parsed, document, '2026-11-24');
    expect(inSecond?.block.name).toBe('B');
    expect(inSecond?.nextBlockStartsOn).toBeNull();

    // Reiniciada desde el segundo bloque (D-083): el cliente va por ese.
    const restarted = clientBlock({ ...parsed, startBlockId: 'b2' }, document, '2026-11-18');
    expect(restarted?.block.name).toBe('B');
  });
});

describe('clientBlock', () => {
  const document = newTemplate('Casa + Gym', 7);

  it('con calendario, hoy toca el día de la semana', () => {
    expect(clientBlock(program('calendar', '2026-11-02'), document, TODAY)?.todayNumber).toBe(3);
  });

  it('en modo lista no hay "Hoy toca" (D-082)', () => {
    expect(clientBlock(program('list', '2026-11-02'), document, TODAY)?.todayNumber).toBeNull();
  });

  it('una rutina que aún no ha empezado enseña su primer bloque, sin día de hoy', () => {
    const result = clientBlock(program('calendar', '2026-11-30'), document, TODAY);
    expect(result?.block).toBe(document.blocks[0]);
    expect(result?.todayNumber).toBeNull();
  });

  it('en modo lista el bloque avanza por entrenos completados (D-125)', () => {
    const [p] = parseClientPrograms([
      {
        id: 'p-list',
        name: 'Modo lista',
        client_id: 'diego',
        starts_on: '2026-11-01',
        start_block_id: null,
        mode: 'list',
        program_blocks: [
          { id: 'b1', position: 1, cycle_days: 7, laps: 4 },
          { id: 'b2', position: 2, cycle_days: 7, laps: 4 },
        ],
      },
    ]);
    if (p === undefined) throw new Error('falta la rutina');
    const first = newTemplate('Modo lista', 7).blocks[0]!;
    // Modificar primer bloque para tener 4 días de entreno y 3 de descanso
    const b1 = {
      ...first,
      name: 'Bloque 1',
      days: first.days.map((d) => ({
        ...d,
        kind: d.dayNumber <= 4 ? ('training' as const) : ('rest' as const),
      })),
    };
    const b2 = { ...b1, name: 'Bloque 2' };
    const doc = { ...newTemplate('Modo lista', 7), blocks: [b1, b2] };

    // Con 15 entrenos: sigue en Bloque 1
    const res15 = clientBlock({ ...p, completedWorkoutsCount: 15 }, doc, TODAY);
    expect(res15?.block.name).toBe('Bloque 1');

    // Con 16 entrenos: avanza a Bloque 2 (4 laps * 4 training days = 16)
    const res16 = clientBlock({ ...p, completedWorkoutsCount: 16 }, doc, TODAY);
    expect(res16?.block.name).toBe('Bloque 2');
  });

  it('con regla recover y día faltado, el día de descanso pasa a ser recuperación (D-125)', () => {
    const [p] = parseClientPrograms([
      {
        id: 'p-rec',
        name: 'Casa + Gym',
        client_id: 'ana',
        starts_on: '2026-11-16', // Lunes 16
        start_block_id: null,
        mode: 'calendar',
        program_blocks: [{ id: 'b', position: 1, cycle_days: 7, laps: 4 }],
        program_missed_day_rules: [{ rule: 'recover', starts_on: '2026-11-16' }],
        program_missed_days: [{ day_number: 1, missed_on: '2026-11-16' }],
      },
    ]);
    if (p === undefined) throw new Error('falta la rutina');

    // Martes 17 es descanso normalmente (día 2), pero recupera el lunes (día 1)
    const tuesday = clientBlock(p, document, '2026-11-17');
    expect(tuesday?.todayNumber).toBe(1);
    expect(tuesday?.isRecovery).toBe(true);
  });

  describe('dayExecutionStatus (D-125)', () => {
    const baseProgram = {
      startsOn: '2026-11-16',
      mode: 'calendar' as const,
      startBlockId: null,
      blocks: [{ id: 'b1', cycleDays: 7, laps: 4 }],
      missedDayRules: [],
      missedDays: [],
      workouts: [],
    };

    it('un día de descanso siempre devuelve normal', () => {
      const status = dayExecutionStatus(
        { dayNumber: 2, kind: 'rest' },
        {
          program: baseProgram,
          blockId: 'b1',
          blockIndex: 0,
          lap: 1,
          today: '2026-11-17',
          language: 'es',
        },
      );
      expect(status.kind).toBe('normal');
    });

    it('un día de entreno futuro devuelve normal', () => {
      const status = dayExecutionStatus(
        { dayNumber: 3, kind: 'training' },
        {
          program: baseProgram,
          blockId: 'b1',
          blockIndex: 0,
          lap: 1,
          today: '2026-11-17', // Miércoles 18 aún no ha llegado
          language: 'es',
        },
      );
      expect(status.kind).toBe('normal');
    });

    it('un día de entreno faltado sin completar devuelve missed', () => {
      const status = dayExecutionStatus(
        { dayNumber: 1, kind: 'training' },
        {
          program: {
            ...baseProgram,
            missedDays: [{ dayNumber: 1, missedOn: '2026-11-16', blockId: 'b1' }],
          },
          blockId: 'b1',
          blockIndex: 0,
          lap: 1,
          today: '2026-11-17',
          language: 'es',
        },
      );
      expect(status.kind).toBe('missed');
    });

    it('un día de entreno faltado el lunes y hecho el martes devuelve done_other_day', () => {
      const status = dayExecutionStatus(
        { id: 'd1', dayNumber: 1, kind: 'training' },
        {
          program: {
            ...baseProgram,
            missedDays: [
              { dayNumber: 1, missedOn: '2026-11-16', blockId: 'b1', programDayId: 'd1' },
            ],
            workouts: [
              {
                programDayId: 'd1',
                performedOn: '2026-11-17', // Martes
                closedAt: '2026-11-17T18:00:00Z',
              },
            ],
          },
          blockId: 'b1',
          blockIndex: 0,
          lap: 1,
          today: '2026-11-18',
          language: 'es',
        },
      );
      expect(status).toEqual({ kind: 'done_other_day', weekday: 'martes' });
    });

    it('en inglés devuelve el nombre del día traducido', () => {
      const status = dayExecutionStatus(
        { id: 'd1', dayNumber: 1, kind: 'training' },
        {
          program: {
            ...baseProgram,
            missedDays: [
              { dayNumber: 1, missedOn: '2026-11-16', blockId: 'b1', programDayId: 'd1' },
            ],
            workouts: [
              {
                programDayId: 'd1',
                performedOn: '2026-11-17',
                closedAt: '2026-11-17T18:00:00Z',
              },
            ],
          },
          blockId: 'b1',
          blockIndex: 0,
          lap: 1,
          today: '2026-11-18',
          language: 'en',
        },
      );
      expect(status).toEqual({ kind: 'done_other_day', weekday: 'Tuesday' });
    });

    it('dos bloques: un lunes faltado en el bloque 1 no marca como faltado el día 1 del bloque 2', () => {
      const twoBlockProgram = {
        ...baseProgram,
        blocks: [
          { id: 'b1', cycleDays: 7, laps: 1 },
          { id: 'b2', cycleDays: 7, laps: 1 },
        ],
        missedDays: [{ dayNumber: 1, missedOn: '2026-11-16', blockId: 'b1' }],
      };
      // En el bloque 2 (que empieza el 2026-11-23), el día 1 toca el 23
      const status = dayExecutionStatus(
        { dayNumber: 1, kind: 'training' },
        {
          program: twoBlockProgram,
          blockId: 'b2',
          blockIndex: 1,
          lap: 1,
          today: '2026-11-23',
          language: 'es',
        },
      );
      // El día 1 del bloque 2 es hoy (23), no está faltado
      expect(status.kind).toBe('normal');
    });

    it('dos vueltas: un entreno completado en la vuelta 1 no da por hecho el día en la vuelta 2', () => {
      const twoLapsProgram = {
        ...baseProgram,
        blocks: [{ id: 'b1', cycleDays: 7, laps: 2 }],
        workouts: [
          {
            programDayId: 'd1',
            performedOn: '2026-11-16', // Vuelta 1 lunes
            closedAt: '2026-11-16T18:00:00Z',
          },
        ],
      };
      // En la vuelta 2, el lunes tocaba el 2026-11-23. Hoy es 24 y no se hizo.
      const status = dayExecutionStatus(
        { id: 'd1', dayNumber: 1, kind: 'training' },
        {
          program: twoLapsProgram,
          blockId: 'b1',
          blockIndex: 0,
          lap: 2,
          today: '2026-11-24',
          language: 'es',
        },
      );
      expect(status.kind).toBe('missed');
    });

    it('un ciclo de 8 días calcula correctamente las fechas sin asumir lunes', () => {
      const eightDayProgram = {
        ...baseProgram,
        blocks: [{ id: 'b1', cycleDays: 8, laps: 2 }],
        workouts: [
          {
            programDayId: 'd8',
            performedOn: '2026-11-24', // Se hizo el martes en vez del lunes 23
            closedAt: '2026-11-24T18:00:00Z',
          },
        ],
      };
      const status = dayExecutionStatus(
        { id: 'd8', dayNumber: 8, kind: 'training' },
        {
          program: eightDayProgram,
          blockId: 'b1',
          blockIndex: 0,
          lap: 1,
          today: '2026-11-25',
          language: 'es',
        },
      );
      expect(status).toEqual({ kind: 'done_other_day', weekday: 'martes' });
    });

    it('una rutina que empieza un miércoles maneja correctamente la semana parcial', () => {
      const wednesdayProgram = {
        ...baseProgram,
        startsOn: '2026-11-18', // Miércoles 18
        blocks: [{ id: 'b1', cycleDays: 7, laps: 2 }],
      };
      // En lap 0 (semana parcial), el lunes (día 1) no existe
      const mondayLap0 = dayExecutionStatus(
        { dayNumber: 1, kind: 'training' },
        {
          program: wednesdayProgram,
          blockId: 'b1',
          blockIndex: 0,
          lap: 0,
          today: '2026-11-19',
          language: 'es',
        },
      );
      expect(mondayLap0.kind).toBe('normal');

      // En lap 1, el lunes tocaba el 2026-11-23. Si hoy es 24 y no se hizo, es missed
      const mondayLap1 = dayExecutionStatus(
        { dayNumber: 1, kind: 'training' },
        {
          program: wednesdayProgram,
          blockId: 'b1',
          blockIndex: 0,
          lap: 1,
          today: '2026-11-24',
          language: 'es',
        },
      );
      expect(mondayLap1.kind).toBe('missed');
    });
  });
});
