import { describe, expect, it } from 'vitest';

import {
  dayCounts,
  daysLostWhenShortening,
  editCycle,
  firstBlock,
  isDirty,
  weekdayName,
} from './cycle-editor';
import { newTemplate } from './program-document';
import type { ProgramDayExercise, ProgramDocument } from './program-document';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function exercise(sets: number): ProgramDayExercise {
  return {
    id: uuid(50 + sets),
    exerciseId: uuid(90),
    supersetGroup: null,
    restSeconds: 120,
    note: null,
    sets: Array.from({ length: sets }, (_, index) => ({
      id: uuid(60 + index),
      repsMin: 8,
      repsMax: 12,
      durationSeconds: null,
      distanceMeters: null,
      intensityType: 'rir' as const,
      intensityValue: 1,
      targetLoadKg: null,
    })),
  };
}

/** Una plantilla de 8 días ya guardada: el día 1 de entreno, con dos ejercicios. */
function saved(): ProgramDocument {
  const template = newTemplate('Prueba', 8);
  const block = firstBlock(template);
  if (block === undefined) throw new Error('sin bloque');
  return {
    ...template,
    id: uuid(1),
    updatedAt: '2026-11-15T10:00:00Z',
    blocks: [
      {
        ...block,
        id: uuid(2),
        days: block.days.map((day, index) => ({
          ...day,
          id: uuid(10 + index),
          ...(day.dayNumber === 1
            ? {
                kind: 'training' as const,
                subtitle: 'Tirón + pierna',
                exercises: [exercise(3), exercise(2)],
              }
            : {}),
        })),
      },
    ],
  };
}

describe('el editor de los días del ciclo (PR 2.8)', () => {
  it('alargar el ciclo añade días de descanso al final y conserva los demás', () => {
    const longer = firstBlock(editCycle(saved(), { type: 'setCycleDays', cycleDays: 10 }));

    expect(longer?.cycleDays).toBe(10);
    expect(longer?.days.map((day) => [day.dayNumber, day.kind, day.id])).toEqual([
      ...Array.from({ length: 8 }, (_, index) => [
        index + 1,
        index === 0 ? 'training' : 'rest',
        uuid(10 + index),
      ]),
      [9, 'rest', null],
      [10, 'rest', null],
    ]);
  });

  it('acortar quita los últimos días, y avisa de los que tienen contenido', () => {
    const document = editCycle(saved(), { type: 'setDayKind', dayNumber: 6, kind: 'training' });
    const block = firstBlock(document);
    if (block === undefined) throw new Error('sin bloque');

    expect(daysLostWhenShortening(block, 5)).toEqual([6]);
    expect(daysLostWhenShortening(block, 7)).toEqual([]);
    expect(
      firstBlock(editCycle(document, { type: 'setCycleDays', cycleDays: 5 }))?.days,
    ).toHaveLength(5);
  });

  it('el ciclo se queda entre 1 y 28 días', () => {
    expect(
      firstBlock(editCycle(saved(), { type: 'setCycleDays', cycleDays: 40 }))?.days,
    ).toHaveLength(28);
    expect(
      firstBlock(editCycle(saved(), { type: 'setCycleDays', cycleDays: 0 }))?.days,
    ).toHaveLength(1);
  });

  it('un día pasa a entreno o a descanso; al descanso, sin ejercicios', () => {
    const rest = editCycle(saved(), { type: 'setDayKind', dayNumber: 1, kind: 'rest' });
    expect(firstBlock(rest)?.days[0]).toMatchObject({
      kind: 'rest',
      exercises: [],
      subtitle: 'Tirón + pierna',
    });

    const training = editCycle(saved(), { type: 'setDayKind', dayNumber: 2, kind: 'training' });
    expect(firstBlock(training)?.days[1]?.kind).toBe('training');
  });

  it('el nombre, el subtítulo y el lugar se cambian; vacíos quedan sin poner', () => {
    let document = editCycle(saved(), {
      type: 'setDayText',
      dayNumber: 1,
      field: 'place',
      value: 'Gym',
    });
    document = editCycle(document, {
      type: 'setDayText',
      dayNumber: 1,
      field: 'subtitle',
      value: '   ',
    });

    expect(firstBlock(document)?.days[0]).toMatchObject({ place: 'Gym', subtitle: null });
  });

  it('cambiar los días no toca los ejercicios ni las series que ya tenía (D-079)', () => {
    let document = editCycle(saved(), {
      type: 'setDayText',
      dayNumber: 1,
      field: 'name',
      value: 'Lunes',
    });
    document = editCycle(document, { type: 'setCycleDays', cycleDays: 7 });
    const day = firstBlock(document)?.days[0];

    expect(day?.exercises).toEqual(firstBlock(saved())?.days[0]?.exercises);
    expect(day && dayCounts(day)).toEqual({ exercises: 2, sets: 5 });
    expect(document.id).toBe(uuid(1));
    expect(document.updatedAt).toBe('2026-11-15T10:00:00Z');
  });

  it('sabe si hay cambios sin guardar', () => {
    const original = saved();
    const changed = editCycle(original, {
      type: 'setDayText',
      dayNumber: 2,
      field: 'name',
      value: 'Extra',
    });
    const undone = editCycle(changed, {
      type: 'setDayText',
      dayNumber: 2,
      field: 'name',
      value: '',
    });

    expect(isDirty(original, original)).toBe(false);
    expect(isDirty(original, changed)).toBe(true);
    expect(isDirty(original, undone)).toBe(false);
  });

  it('en un ciclo semanal los días son de lunes a domingo; en los demás no tienen nombre', () => {
    const weekly = firstBlock(editCycle(saved(), { type: 'setCycleDays', cycleDays: 7 }));
    const eightDays = firstBlock(saved());
    if (weekly === undefined || eightDays === undefined) throw new Error('sin bloque');

    expect([1, 3, 7].map((day) => weekdayName(weekly, day, 'es'))).toEqual([
      'Lunes',
      'Miércoles',
      'Domingo',
    ]);
    expect(weekdayName(weekly, 1, 'en')).toBe('Monday');
    expect(weekdayName(eightDays, 1, 'es')).toBeNull();
  });
});
