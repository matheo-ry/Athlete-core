import { describe, expect, it } from 'vitest';

import { parseClientPrograms } from './assignments';
import { clientBlock } from './client-view';
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
});
