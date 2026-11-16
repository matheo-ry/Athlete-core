import { describe, expect, it } from 'vitest';

import { MAX_BLOCKS, blockLengthDays, copyOfBlock, editProgram } from './blocks-editor';
import { editCycle } from './cycle-editor';
import { newTemplate } from './program-document';
import type { ProgramDocument } from './program-document';

const EXERCISE = '00000000-0000-4000-8000-000000000001';

/** "Prueba": semanal, sin fin, con el lunes de entreno y un ejercicio. */
function prueba(): ProgramDocument {
  let document: ProgramDocument = { ...newTemplate('Prueba', 7), id: 'p', updatedAt: 'x' };
  document = editCycle(document, { type: 'setDayKind', dayNumber: 1, kind: 'training' });
  document = editCycle(document, { type: 'addExercise', dayNumber: 1, exerciseId: EXERCISE });
  const [block] = document.blocks;
  if (block === undefined) throw new Error('falta el bloque');
  const days = block.days.map((day) => ({ ...day, id: `d${String(day.dayNumber)}` }));
  return { ...document, blocks: [{ ...block, id: 'b1', days }] };
}

const laps = (document: ProgramDocument) => document.blocks.map((block) => block.laps);

describe('editProgram: bloques (PR 2.16)', () => {
  it('"Duplicar el anterior" añade un bloque igual, sin identificadores, y da duración al que ya no es el último', () => {
    const result = editProgram(prueba(), { type: 'addBlock', from: 'previous' });
    expect(result.blocks).toHaveLength(2);
    expect(laps(result)).toEqual([4, null]);
    const [first, second] = result.blocks;
    expect(second?.id).toBeNull();
    expect(second?.days[0]?.id).toBeNull();
    expect(second?.days[0]?.exercises[0]?.exerciseId).toBe(EXERCISE);
    expect(second?.days[0]?.exercises[0]?.id).toBeNull();
    // El original conserva los suyos.
    expect(first?.id).toBe('b1');
  });

  it('un bloque vacío nace semanal, con todos los días de descanso', () => {
    const result = editProgram(prueba(), { type: 'addBlock', from: 'empty' });
    expect(result.blocks[1]?.cycleDays).toBe(7);
    expect(result.blocks[1]?.days.every((day) => day.kind === 'rest')).toBe(true);
  });

  it('un cambio dentro de un bloque no toca los demás', () => {
    const two = editProgram(prueba(), { type: 'addBlock', from: 'previous' });
    const result = editProgram(two, {
      type: 'inBlock',
      blockIndex: 1,
      action: { type: 'setCycleDays', cycleDays: 8 },
    });
    expect(result.blocks.map((block) => block.cycleDays)).toEqual([7, 8]);
    expect(result.blocks[0]).toBe(two.blocks[0]);
  });

  it('subir el último bloque: solo el nuevo último puede quedar sin fin', () => {
    const two = editProgram(prueba(), { type: 'addBlock', from: 'empty' });
    const named = editProgram(two, { type: 'setBlockName', index: 1, name: 'Descarga' });
    const result = editProgram(named, { type: 'moveBlock', index: 1, direction: -1 });
    expect(result.blocks.map((block) => block.name)).toEqual(['Descarga', null]);
    expect(laps(result)).toEqual([4, 4]);
    // Fuera de los límites no hace nada.
    expect(editProgram(result, { type: 'moveBlock', index: 0, direction: -1 })).toBe(result);
  });

  it('las vueltas van de 1 a 52, y "sin fin" solo vale en el último', () => {
    const two = editProgram(prueba(), { type: 'addBlock', from: 'empty' });
    expect(laps(editProgram(two, { type: 'setBlockLaps', index: 0, laps: 99 }))).toEqual([
      52,
      null,
    ]);
    expect(laps(editProgram(two, { type: 'setBlockLaps', index: 0, laps: null }))).toEqual([
      4,
      null,
    ]);
    expect(laps(editProgram(two, { type: 'setBlockLaps', index: 1, laps: 2 }))).toEqual([4, 2]);
  });

  it('quitar un bloque; el único que queda no se puede quitar', () => {
    const two = editProgram(prueba(), { type: 'addBlock', from: 'empty' });
    const one = editProgram(two, { type: 'removeBlock', index: 0 });
    expect(one.blocks).toHaveLength(1);
    expect(editProgram(one, { type: 'removeBlock', index: 0 })).toBe(one);
  });

  it('duplicar un bloque lo pone justo detrás; pegar, al final', () => {
    const two = editProgram(prueba(), { type: 'addBlock', from: 'empty' });
    const duplicated = editProgram(two, { type: 'duplicateBlock', index: 0 });
    expect(duplicated.blocks.map((block) => block.days[0]?.kind)).toEqual([
      'training',
      'training',
      'rest',
    ]);
    const source = prueba().blocks[0];
    if (source === undefined) throw new Error('falta el bloque');
    const pasted = editProgram(two, { type: 'pasteBlock', block: source });
    expect(pasted.blocks.at(-1)?.days[0]?.exercises).toHaveLength(1);
    expect(pasted.blocks.at(-1)?.id).toBeNull();
  });

  it('el tope de 12 bloques (D-086)', () => {
    let document = prueba();
    for (let count = 0; count < 20; count += 1) {
      document = editProgram(document, { type: 'addBlock', from: 'empty' });
    }
    expect(document.blocks).toHaveLength(MAX_BLOCKS);
  });

  it('"replace" pone el documento recuperado', () => {
    const other = newTemplate('Otra', 3);
    expect(editProgram(prueba(), { type: 'replace', document: other })).toBe(other);
  });
});

describe('blockLengthDays y copyOfBlock', () => {
  it('2 vueltas de un ciclo de 8 días son 16 días; sin vueltas, sin fin', () => {
    const [block] = newTemplate('x', 8).blocks;
    if (block === undefined) throw new Error('falta el bloque');
    expect(blockLengthDays({ ...block, laps: 2 })).toBe(16);
    expect(blockLengthDays(block)).toBeNull();
    expect(copyOfBlock({ ...block, id: 'b' }).id).toBeNull();
  });
});
