import { describe, expect, it } from 'vitest';

import { countByTab, describeCycle, parseTemplates, visibleTemplates } from './template-list';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const days = (kinds: string) =>
  [...kinds].map((kind) => ({ kind: kind === 'E' ? 'training' : 'rest' }));

function row(
  n: number,
  name: string,
  blocks: [number, string][],
  archivedAt: string | null = null,
) {
  return {
    id: uuid(n),
    name,
    updated_at: '2026-11-15T10:00:00+00:00',
    archived_at: archivedAt,
    program_blocks: blocks.map(([cycleDays, kinds], index) => ({
      position: index + 1,
      cycle_days: cycleDays,
      program_days: days(kinds),
    })),
  };
}

const TEMPLATES = parseTemplates([
  row(1, 'Pecho / Espalda y Brazo / Pierna', [[8, 'EEDEEDDD']]),
  row(2, 'Casa + Gym', [[7, 'EDEDEED']]),
  row(3, 'Fuerza básica', [
    [7, 'EDEDEDD'],
    [7, 'EDEDDDD'],
  ]),
  row(4, 'Antigua', [[3, 'EDD']], '2026-11-01T10:00:00+00:00'),
]);

describe('la lista de plantillas (PR 2.7)', () => {
  it('cada fila dice si es semanal o de cuántos días es el ciclo, y cuántos días de entreno tiene', () => {
    const [eightDays, weekly, twoBlocks] = TEMPLATES;
    expect(weekly && describeCycle(weekly)).toEqual({ kind: 'weekly', trainingDays: 4 });
    expect(eightDays && describeCycle(eightDays)).toEqual({
      kind: 'cycle',
      cycleDays: 8,
      trainingDays: 4,
    });
    expect(twoBlocks && describeCycle(twoBlocks)).toEqual({ kind: 'blocks', blocks: 2 });
  });

  it('cuenta las activas y las archivadas, sin contar la búsqueda', () => {
    expect(countByTab(TEMPLATES)).toEqual({ active: 3, archived: 1 });
  });

  it('enseña las de la pestaña por orden alfabético', () => {
    expect(visibleTemplates(TEMPLATES, 'active', '', 'es').map((t) => t.name)).toEqual([
      'Casa + Gym',
      'Fuerza básica',
      'Pecho / Espalda y Brazo / Pierna',
    ]);
    expect(visibleTemplates(TEMPLATES, 'archived', '', 'es').map((t) => t.name)).toEqual([
      'Antigua',
    ]);
  });

  it('busca por nombre sin mayúsculas ni tildes', () => {
    expect(visibleTemplates(TEMPLATES, 'active', '  BASICA ', 'es').map((t) => t.name)).toEqual([
      'Fuerza básica',
    ]);
    expect(visibleTemplates(TEMPLATES, 'active', 'zzz', 'es')).toEqual([]);
  });

  it('rechaza lo que no cuadra con la base de datos', () => {
    expect(() => parseTemplates([{ id: uuid(1) }])).toThrow();
  });
});
