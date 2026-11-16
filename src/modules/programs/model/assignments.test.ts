import { describe, expect, it } from 'vitest';

import { assignmentWarnings, parseClientPrograms, routinesByClient } from './assignments';

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
