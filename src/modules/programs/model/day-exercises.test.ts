import { describe, expect, it } from 'vitest';

import { editCycle, firstBlock } from './cycle-editor';
import { emptySet, hasSetData, newDayExercise } from './day-exercises';
import { newTemplate } from './program-document';
import type { ProgramDocument } from './program-document';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

/** "Prueba", semanal, con el lunes de entreno y tres ejercicios: 1, 2 y 3. */
function prueba(): ProgramDocument {
  let document = editCycle(newTemplate('Prueba', 7), {
    type: 'setDayKind',
    dayNumber: 1,
    kind: 'training',
  });
  for (const n of [1, 2, 3]) {
    document = editCycle(document, { type: 'addExercise', dayNumber: 1, exerciseId: uuid(n) });
  }
  return document;
}

const monday = (document: ProgramDocument) => firstBlock(document)?.days[0];
const order = (document: ProgramDocument) =>
  monday(document)?.exercises.map((item) => item.exerciseId);

describe('los ejercicios de un día (PR 2.9)', () => {
  it('un ejercicio añadido entra al final, con 3 series sin datos', () => {
    const document = prueba();

    expect(order(document)).toEqual([uuid(1), uuid(2), uuid(3)]);
    expect(monday(document)?.exercises[2]?.sets).toEqual([emptySet(), emptySet(), emptySet()]);
  });

  it('"Subir" y "Bajar" cambian el puesto; en los extremos no hacen nada', () => {
    let document = editCycle(prueba(), {
      type: 'moveExercise',
      dayNumber: 1,
      index: 2,
      direction: -1,
    });
    expect(order(document)).toEqual([uuid(1), uuid(3), uuid(2)]);

    document = editCycle(document, { type: 'moveExercise', dayNumber: 1, index: 1, direction: -1 });
    expect(order(document)).toEqual([uuid(3), uuid(1), uuid(2)]);

    expect(
      order(editCycle(document, { type: 'moveExercise', dayNumber: 1, index: 0, direction: -1 })),
    ).toEqual(order(document));
    expect(
      order(editCycle(document, { type: 'moveExercise', dayNumber: 1, index: 2, direction: 1 })),
    ).toEqual(order(document));
  });

  it('"Quitar" lo saca del día y no toca los demás ni los otros días', () => {
    const document = editCycle(prueba(), { type: 'removeExercise', dayNumber: 1, index: 1 });

    expect(order(document)).toEqual([uuid(1), uuid(3)]);
    expect(firstBlock(document)?.days[1]?.exercises).toEqual([]);
  });

  it('sabe si un ejercicio tiene algo escrito, para pedir confirmación al quitarlo', () => {
    const empty = newDayExercise(uuid(1));
    const [first, ...rest] = empty.sets;

    expect(hasSetData(empty)).toBe(false);
    expect(
      hasSetData({
        ...empty,
        id: uuid(9),
        sets: empty.sets.map((set) => ({ ...set, id: uuid(8) })),
      }),
    ).toBe(false);
    expect(
      first && hasSetData({ ...empty, sets: [{ ...first, repsMin: 8, repsMax: 12 }, ...rest] }),
    ).toBe(true);
    expect(hasSetData({ ...empty, restSeconds: 90 })).toBe(true);
    expect(hasSetData({ ...empty, note: 'Codo pegado' })).toBe(true);
  });
});

describe('sustituir y la nota (PR 2.9b)', () => {
  it('"Sustituir" cambia el ejercicio y conserva su sitio, sus series, su descanso y su nota', () => {
    const document = prueba();
    const day = monday(document);
    const first = day?.exercises[0];
    if (day === undefined || first === undefined) throw new Error('faltan datos');
    const withData = {
      ...document,
      blocks: document.blocks.map((block) => ({
        ...block,
        days: block.days.map((item) =>
          item.dayNumber === 1
            ? {
                ...item,
                exercises: [
                  { ...first, restSeconds: 90, note: 'Lento' },
                  ...item.exercises.slice(1),
                ],
              }
            : item,
        ),
      })),
    };

    const replaced = editCycle(withData, {
      type: 'replaceExercise',
      dayNumber: 1,
      index: 0,
      exerciseId: uuid(7),
    });
    const item = monday(replaced)?.exercises[0];

    expect(order(replaced)).toEqual([uuid(7), uuid(2), uuid(3)]);
    expect(item).toMatchObject({ restSeconds: 90, note: 'Lento', sets: first.sets });
  });

  it('la nota se escribe en el ejercicio; vacía, queda sin nota', () => {
    let document = editCycle(prueba(), {
      type: 'setExerciseNote',
      dayNumber: 1,
      index: 1,
      note: 'Pausa arriba',
    });
    expect(monday(document)?.exercises[1]?.note).toBe('Pausa arriba');

    document = editCycle(document, { type: 'setExerciseNote', dayNumber: 1, index: 1, note: '  ' });
    expect(monday(document)?.exercises[1]?.note).toBeNull();
  });
});
