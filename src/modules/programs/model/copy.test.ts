import { beforeEach, describe, expect, it } from 'vitest';

import { clearDeviceDrafts } from '@/core/lib';

import { copyDayOnto, copyOfProgram, duplicateExercise, pasteExercise } from './copy';
import { editCycle, firstBlock } from './cycle-editor';
import { newDayExercise } from './day-exercises';
import { updateSets } from './prescription';
import { readClipboard, writeClipboard } from './program-clipboard';
import { newTemplate, programDocumentSchema } from './program-document';
import type { ProgramDay, ProgramDocument } from './program-document';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

/** Un lunes ya guardado: "Torso", en casa, con dos ejercicios de 3 series de 8 a 12. */
function savedMonday(): ProgramDay {
  const exercise = (n: number) => {
    const item = updateSets(newDayExercise(uuid(n)), { repsMin: 8, repsMax: 12 }, 'all');
    return {
      ...item,
      id: uuid(100 + n),
      restSeconds: 120,
      note: 'Lento',
      sets: item.sets.map((set, index) => ({ ...set, id: uuid(200 + n * 10 + index) })),
    };
  };
  return {
    id: uuid(10),
    dayNumber: 1,
    kind: 'training',
    name: 'Torso',
    subtitle: 'Empuje',
    place: 'Casa',
    exercises: [exercise(1), exercise(2)],
  };
}

function savedProgram(): ProgramDocument {
  const template = newTemplate('Casa + Gym', 7);
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
        days: block.days.map((day, index) =>
          index === 0 ? savedMonday() : { ...day, id: uuid(10 + index) },
        ),
      },
    ],
  };
}

const withoutIds = (day: ProgramDay) =>
  day.exercises.map((item) => ({
    ...item,
    id: null,
    sets: item.sets.map((set) => ({ ...set, id: null })),
  }));

describe('copiar y duplicar (PR 2.11, D-080)', () => {
  it('duplicar un ejercicio lo pone debajo, con las mismas series y como nuevo', () => {
    const day = duplicateExercise(savedMonday(), 0);

    expect(day.exercises.map((item) => item.exerciseId)).toEqual([uuid(1), uuid(1), uuid(2)]);
    expect(day.exercises[0]?.id).toBe(uuid(101));
    expect(day.exercises[1]).toEqual(withoutIds(savedMonday())[0]);
  });

  it('pegar un ejercicio copiado lo añade al final, como nuevo', () => {
    const [copied] = savedMonday().exercises;
    if (copied === undefined) throw new Error('sin ejercicio');
    const day = pasteExercise({ ...savedMonday(), exercises: [] }, copied);

    expect(day.exercises).toEqual([
      { ...copied, id: null, sets: withoutIds(savedMonday())[0]?.sets },
    ]);
  });

  it('duplicar un día en otro lo deja igual, y el destino sigue siendo su día del ciclo', () => {
    const thursday: ProgramDay = {
      id: uuid(13),
      dayNumber: 4,
      kind: 'rest',
      name: null,
      subtitle: null,
      place: null,
      exercises: [],
    };
    const copied = copyDayOnto(thursday, savedMonday());

    expect(copied).toMatchObject({
      id: uuid(13),
      dayNumber: 4,
      kind: 'training',
      name: 'Torso',
      subtitle: 'Empuje',
      place: 'Casa',
    });
    expect(copied.exercises).toEqual(withoutIds(savedMonday()));
  });

  it('el editor duplica un ejercicio y un día, y pega lo copiado', () => {
    let document = editCycle(savedProgram(), { type: 'duplicateExercise', dayNumber: 1, index: 1 });
    expect(firstBlock(document)?.days[0]?.exercises).toHaveLength(3);

    document = editCycle(savedProgram(), {
      type: 'replaceDay',
      dayNumber: 4,
      source: savedMonday(),
    });
    expect(firstBlock(document)?.days[3]).toMatchObject({
      dayNumber: 4,
      name: 'Torso',
      id: uuid(13),
    });
    expect(firstBlock(document)?.days[0]).toEqual(savedMonday());

    const [copied] = savedMonday().exercises;
    if (copied === undefined) throw new Error('sin ejercicio');
    document = editCycle(document, { type: 'pasteExercise', dayNumber: 4, item: copied });
    expect(firstBlock(document)?.days[3]?.exercises).toHaveLength(3);
  });

  it('duplicar una plantilla crea otra igual, sin identificadores, y no toca la original', () => {
    const original = savedProgram();
    const copy = copyOfProgram(original, `Copia de ${'x'.repeat(90)}`);

    expect(copy).toMatchObject({ id: null, updatedAt: null, clientId: null });
    expect(copy.name).toHaveLength(80);
    expect(JSON.stringify(copy)).not.toContain('"id":"');
    expect(firstBlock(copy)?.days[0]?.exercises).toEqual(withoutIds(savedMonday()));
    expect(programDocumentSchema.safeParse(copy).success).toBe(true);
    expect(original).toEqual(savedProgram());
  });
});

describe('lo copiado, en el dispositivo (PR 2.11)', () => {
  beforeEach(() => localStorage.clear());

  it('se guarda para ese usuario y ese negocio, y se lee validado', () => {
    writeClipboard('user-a', 'tenant-1', { kind: 'day', day: savedMonday() });

    expect(readClipboard('user-a', 'tenant-1')).toEqual({ kind: 'day', day: savedMonday() });
    expect(readClipboard('user-a', 'tenant-2')).toBeNull();
    expect(readClipboard('user-b', 'tenant-1')).toBeNull();
  });

  it('lo que no pasa la validación cuenta como nada, y al cerrar sesión se olvida', () => {
    localStorage.setItem('athlete-core.draft.clipboard.user-a.tenant-1', '{"kind":"day","day":{}}');
    expect(readClipboard('user-a', 'tenant-1')).toBeNull();

    const [item] = savedMonday().exercises;
    if (item === undefined) throw new Error('sin ejercicio');
    writeClipboard('user-a', 'tenant-1', { kind: 'exercise', item });
    expect(readClipboard('user-a', 'tenant-1')?.kind).toBe('exercise');
    clearDeviceDrafts();
    expect(readClipboard('user-a', 'tenant-1')).toBeNull();
  });
});
