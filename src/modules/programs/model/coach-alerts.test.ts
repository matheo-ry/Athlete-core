import { describe, expect, it } from 'vitest';

import { parseClientPrograms, routinesByClient } from './assignments';
import { coachAlerts } from './coach-alerts';

const TODAY = '2026-11-16'; // lunes

function row(id: string, clientId: string, startsOn: string, laps: number | null) {
  return {
    id,
    name: `Rutina ${id}`,
    client_id: clientId,
    starts_on: startsOn,
    start_block_id: null,
    mode: 'calendar',
    program_blocks: [{ id: `${id}-b`, position: 1, cycle_days: 7, laps }],
  };
}

const CLIENTS = ['ana', 'bruno', 'carla', 'diego', 'elena', 'fran'].map((name) => ({
  userId: name,
  displayName: name,
}));

describe('coachAlerts', () => {
  const routines = routinesByClient(
    parseClientPrograms([
      // Ana: sin fecha de fin. No da aviso.
      row('a', 'ana', '2026-11-02', null),
      // Bruno: 2 semanas desde el 9: termina el 22, dentro de 6 días.
      row('b', 'bruno', '2026-11-09', 2),
      // Diego: 1 semana desde el 2: terminó el 8 y se repite.
      row('d', 'diego', '2026-11-02', 1),
      // Elena: 8 semanas: termina lejos.
      row('e', 'elena', '2026-11-09', 8),
      // Fran: se le acaba el 22, pero ya tiene la próxima asignada.
      row('f1', 'fran', '2026-11-09', 2),
      row('f2', 'fran', '2026-11-23', null),
    ]),
    TODAY,
  );

  it('avisa de quien no tiene rutina, de la que se repite y de la que termina en 7 días', () => {
    expect(coachAlerts(CLIENTS, routines, TODAY)).toEqual([
      { kind: 'noProgram', clientId: 'carla', clientName: 'carla' },
      { kind: 'repeating', clientId: 'diego', clientName: 'diego' },
      { kind: 'endsSoon', clientId: 'bruno', clientName: 'bruno', endsOn: '2026-11-22' },
    ]);
  });

  it('sin avisos, la lista queda vacía', () => {
    const [ana] = CLIENTS;
    if (ana === undefined) throw new Error('falta la clienta');
    expect(coachAlerts([ana], routines, TODAY)).toEqual([]);
  });

  it('quien solo tiene una próxima no da aviso: ya está resuelto', () => {
    const upcoming = routinesByClient(
      parseClientPrograms([row('x', 'carla', '2026-11-30', null)]),
      TODAY,
    );
    expect(coachAlerts([{ userId: 'carla', displayName: 'carla' }], upcoming, TODAY)).toEqual([]);
  });
});
