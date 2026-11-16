import { describe, expect, it } from 'vitest';

import { editCycle } from './cycle-editor';
import { newDayExercise } from './day-exercises';
import { newTemplate, restDay } from './program-document';
import type { ProgramDay, ProgramDocument } from './program-document';
import { canGroupWithNext, groupInfo, groupWithNext, normalizeGroups, ungroup } from './supersets';

const id = (n: number) => `00000000-0000-4000-8000-00000000000${String(n)}`;

/** Un día con N ejercicios sueltos; `groups` les pone grupo por puesto. */
function day(groups: (number | null)[]): ProgramDay {
  return {
    ...restDay(1),
    kind: 'training',
    exercises: groups.map((supersetGroup, index) => ({
      ...newDayExercise(id(index + 1)),
      supersetGroup,
    })),
  };
}

const groupsOf = (value: ProgramDay) => value.exercises.map((item) => item.supersetGroup);
const order = (value: ProgramDay) => value.exercises.map((item) => item.exerciseId.slice(-1));

describe('groupWithNext y ungroup', () => {
  it('dos seguidos son una superserie; un tercero la hace circuito', () => {
    const two = groupWithNext(day([null, null, null]), 0);
    expect(groupsOf(two)).toEqual([1, 1, null]);
    expect(groupInfo(two, 0)).toEqual({ kind: 'superset', size: 2, position: 1 });
    expect(groupInfo(two, 2)).toBeNull();

    const three = groupWithNext(two, 1);
    expect(groupsOf(three)).toEqual([1, 1, 1]);
    expect(groupInfo(three, 2)).toEqual({ kind: 'circuit', size: 3, position: 3 });
  });

  it('agrupar con el primero de otro grupo junta los dos grupos', () => {
    expect(groupsOf(groupWithNext(day([1, 1, 2, 2]), 1))).toEqual([1, 1, 1, 1]);
    expect(groupsOf(groupWithNext(day([null, 1, 1]), 0))).toEqual([1, 1, 1]);
  });

  it('dos grupos distintos en el mismo día se numeran por orden', () => {
    const result = groupWithNext(groupWithNext(day([null, null, null, null, null]), 3), 0);
    expect(groupsOf(result)).toEqual([1, 1, null, 2, 2]);
  });

  it('"Desagrupar" los deja sueltos y en el mismo orden', () => {
    const result = ungroup(day([1, 1, 1, null]), 1);
    expect(groupsOf(result)).toEqual([null, null, null, null]);
    expect(order(result)).toEqual(['1', '2', '3', '4']);
    expect(ungroup(day([null]), 0).exercises[0]?.supersetGroup).toBeNull();
  });

  it('solo se agrupa con el de debajo si existe y no están ya juntos', () => {
    expect(canGroupWithNext(day([null, null]), 0)).toBe(true);
    expect(canGroupWithNext(day([null, null]), 1)).toBe(false);
    expect(canGroupWithNext(day([1, 1, null]), 0)).toBe(false);
    expect(canGroupWithNext(day([1, 1, null]), 1)).toBe(true);
    expect(groupWithNext(day([null]), 0).exercises).toHaveLength(1);
  });
});

describe('normalizeGroups', () => {
  it('un grupo de uno deja de ser grupo', () => {
    expect(groupsOf(normalizeGroups(day([1, null, null])))).toEqual([null, null, null]);
  });

  it('un grupo partido en dos tramos: cada tramo es su grupo, y el suelto, ninguno', () => {
    expect(groupsOf(normalizeGroups(day([1, 1, null, 1])))).toEqual([1, 1, null, null]);
    expect(groupsOf(normalizeGroups(day([3, 3, null, 3, 3])))).toEqual([1, 1, null, 2, 2]);
  });

  it('si no cambia nada devuelve el mismo día', () => {
    const coherent = day([1, 1, null]);
    expect(normalizeGroups(coherent)).toBe(coherent);
  });
});

describe('editCycle mantiene los grupos coherentes (PR 2.17)', () => {
  function program(groups: (number | null)[]): ProgramDocument {
    const base = newTemplate('Prueba', 1);
    const [block] = base.blocks;
    if (block === undefined) throw new Error('falta el bloque');
    return { ...base, blocks: [{ ...block, days: [day(groups)] }] };
  }
  const first = (document: ProgramDocument) => {
    const value = document.blocks[0]?.days[0];
    if (value === undefined) throw new Error('falta el día');
    return value;
  };

  it('agrupar y desagrupar desde el editor', () => {
    const grouped = editCycle(program([null, null, null]), {
      type: 'groupWithNext',
      dayNumber: 1,
      index: 1,
    });
    expect(groupsOf(first(grouped))).toEqual([null, 1, 1]);
    const loose = editCycle(grouped, { type: 'ungroup', dayNumber: 1, index: 2 });
    expect(groupsOf(first(loose))).toEqual([null, null, null]);
  });

  it('quitar uno de tres deja una superserie; quitar otro, ninguno agrupado', () => {
    const two = editCycle(program([1, 1, 1]), { type: 'removeExercise', dayNumber: 1, index: 0 });
    expect(groupsOf(first(two))).toEqual([1, 1]);
    expect(groupInfo(first(two), 0)?.kind).toBe('superset');
    const one = editCycle(two, { type: 'removeExercise', dayNumber: 1, index: 0 });
    expect(groupsOf(first(one))).toEqual([null]);
  });

  it('sacar un ejercicio de su grupo al moverlo lo deja suelto', () => {
    const moved = editCycle(program([1, 1, null]), {
      type: 'moveExercise',
      dayNumber: 1,
      index: 1,
      direction: 1,
    });
    expect(order(first(moved))).toEqual(['1', '3', '2']);
    expect(groupsOf(first(moved))).toEqual([null, null, null]);
  });

  it('sustituir conserva el grupo, y duplicar mete la copia en él', () => {
    const replaced = editCycle(program([1, 1]), {
      type: 'replaceExercise',
      dayNumber: 1,
      index: 0,
      exerciseId: id(9),
    });
    expect(groupsOf(first(replaced))).toEqual([1, 1]);
    const duplicated = editCycle(program([1, 1]), {
      type: 'duplicateExercise',
      dayNumber: 1,
      index: 1,
    });
    expect(groupsOf(first(duplicated))).toEqual([1, 1, 1]);
  });
});
