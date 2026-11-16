import { describe, expect, it } from 'vitest';

import {
  assignmentWarnings,
  parseClientPrograms,
  routineProgress,
  routinesByClient,
} from './assignments';

const TODAY = '2026-11-16';

function row(id: string, clientId: string, startsOn: string, name = `Rutina ${id}`) {
  return {
    id,
    name,
    client_id: clientId,
    starts_on: startsOn,
    start_block_id: null,
    mode: 'calendar',
    program_blocks: [
      { id: `${id}-b2`, position: 2, cycle_days: 7, laps: null },
      { id: `${id}-b1`, position: 1, cycle_days: 8, laps: 2 },
    ],
  };
}

describe('parseClientPrograms', () => {
  it('lee las filas y ordena los bloques por posición', () => {
    const [program] = parseClientPrograms([row('p1', 'ana', TODAY)]);
    expect(program?.blocks).toEqual([
      { id: 'p1-b1', cycleDays: 8, laps: 2 },
      { id: 'p1-b2', cycleDays: 7, laps: null },
    ]);
  });

  it('rechaza un modo desconocido', () => {
    expect(() => parseClientPrograms([{ ...row('p1', 'ana', TODAY), mode: 'weekly' }])).toThrow();
  });
});

describe('routinesByClient', () => {
  it('la vigente es la más reciente que ya empezó; la próxima, la que empieza después de hoy', () => {
    const programs = parseClientPrograms([
      row('old', 'ana', '2026-10-01'),
      row('now', 'ana', '2026-11-10'),
      row('later', 'ana', '2026-11-26'),
      row('today', 'bruno', TODAY),
    ]);
    const routines = routinesByClient(programs, TODAY);
    expect(routines.get('ana')?.current?.id).toBe('now');
    expect(routines.get('ana')?.next?.id).toBe('later');
    expect(routines.get('bruno')?.current?.id).toBe('today');
    expect(routines.get('bruno')?.next).toBeNull();
    expect(routines.get('carla')).toBeUndefined();
  });
});

describe('assignmentWarnings', () => {
  const routines = routinesByClient(
    parseClientPrograms([
      row('a1', 'ana', '2026-11-01', 'Casa + Gym'),
      row('a2', 'ana', '2026-11-30', 'Fuerza'),
      row('b1', 'bruno', '2026-11-01', 'Pierna'),
    ]),
    TODAY,
  );

  it('con fecha de hoy avisa de las vigentes que pasan a Anteriores', () => {
    expect(assignmentWarnings(['ana', 'bruno', 'carla'], routines, TODAY, TODAY)).toEqual([
      { kind: 'replacesCurrent', clientId: 'ana', programName: 'Casa + Gym' },
      { kind: 'replacesCurrent', clientId: 'bruno', programName: 'Pierna' },
    ]);
  });

  it('con fecha futura solo avisa de las próximas que se sustituyen', () => {
    expect(assignmentWarnings(['ana', 'bruno'], routines, '2026-11-26', TODAY)).toEqual([
      { kind: 'replacesNext', clientId: 'ana', programName: 'Fuerza' },
    ]);
  });
});

describe('routineProgress', () => {
  const program = (startsOn: string, blocks: { cycle_days: number; laps: number | null }[]) =>
    parseClientPrograms([
      {
        ...row('p', 'ana', startsOn),
        program_blocks: blocks.map((block, index) => ({
          id: `b${String(index)}`,
          position: index + 1,
          ...block,
        })),
      },
    ])[0];

  it('dice el bloque, la vuelta y cuándo termina', () => {
    const weekly = program('2026-11-09', [{ cycle_days: 7, laps: 4 }]);
    if (weekly === undefined) throw new Error('falta la rutina');
    expect(routineProgress(weekly, TODAY)).toEqual({
      blockNumber: 1,
      blockCount: 1,
      lap: 2,
      laps: 4,
      isWeekly: true,
      isRepeating: false,
      endsOn: '2026-12-06',
    });
  });

  it('una rutina que se repite sin fin no tiene fecha de fin; una próxima no tiene progreso', () => {
    const endless = program('2026-11-01', [{ cycle_days: 8, laps: null }]);
    const later = program('2026-11-30', [{ cycle_days: 8, laps: null }]);
    if (endless === undefined || later === undefined) throw new Error('falta la rutina');
    expect(routineProgress(endless, TODAY)).toMatchObject({
      isWeekly: false,
      endsOn: null,
      laps: null,
    });
    expect(routineProgress(later, TODAY)).toBeNull();
  });

  it('el último bloque, terminadas sus vueltas, se marca como repetido', () => {
    const done = program('2026-11-02', [{ cycle_days: 7, laps: 1 }]);
    if (done === undefined) throw new Error('falta la rutina');
    expect(routineProgress(done, TODAY)).toMatchObject({ lap: 3, isRepeating: true });
  });
});
