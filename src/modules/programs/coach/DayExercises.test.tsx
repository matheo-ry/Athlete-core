import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAppAs } from '@/test/render-app';

import type { SaveProgramResult } from '../api/programs-api';
import { editCycle } from '../model/cycle-editor';
import { newTemplate } from '../model/program-document';
import type { ProgramDocument } from '../model/program-document';

// Los ejercicios de cada día (PR 2.9), con las dos bases de datos (rutinas y
// ejercicios) sustituidas por datos inventados.
const api = vi.hoisted(() => ({
  fetchTemplates: vi.fn(),
  fetchProgram: vi.fn<(tenantId: string, id: string) => Promise<ProgramDocument>>(),
  saveProgram: vi.fn<(tenantId: string, document: ProgramDocument) => Promise<SaveProgramResult>>(),
  setTemplateArchived: vi.fn(),
}));
vi.mock('../api/programs-api', () => api);

const exercisesApi = vi.hoisted(() => ({
  fetchExercises: vi.fn(),
  createExercise: vi.fn(),
  updateExercise: vi.fn(),
  setExerciseArchived: vi.fn(),
  isExerciseInUse: vi.fn(() => Promise.resolve(false)),
}));
vi.mock('@/modules/exercises/api/exercises-api', () => exercisesApi);

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ID = uuid(1);

function exercise(
  n: number,
  en: string,
  measurement = 'weight_reps',
  archivedAt: string | null = null,
) {
  return {
    id: uuid(100 + n),
    name: null,
    libraryKey: `key_${String(n)}`,
    libraryName: { en, es: en },
    muscleGroup: 'back',
    equipment: 'cable',
    measurement,
    isUnilateral: false,
    instructions: null,
    videoUrl: null,
    archivedAt,
    original: { measurement, isUnilateral: false, muscleGroup: 'back', equipment: 'cable' },
  };
}

const LAT = exercise(1, 'Lat pulldown');
const LEG = exercise(2, 'Leg press');
const ROW = exercise(3, 'Barbell row');
const PLANK = exercise(4, 'Plank', 'time');

/** "Prueba", semanal, con el lunes de entreno: remo y jalón, en ese orden. */
function prueba(): ProgramDocument {
  let document = editCycle(
    { ...newTemplate('Prueba', 7), id: ID, updatedAt: '2026-11-15T10:00:00.000Z' },
    { type: 'setDayKind', dayNumber: 1, kind: 'training' },
  );
  for (const item of [ROW, LAT]) {
    document = editCycle(document, { type: 'addExercise', dayNumber: 1, exerciseId: item.id });
  }
  return document;
}

const exerciseList = () => screen.getByRole('list', { name: 'Exercises of the day' });
const names = () =>
  within(exerciseList())
    .getAllByRole('listitem')
    .map((item) => item.textContent ?? '');

async function openMonday() {
  const view = await renderAppAs('coach@example.test', `/coach/programs/${ID}?day=1`);
  await screen.findByRole('heading', { name: 'Monday', level: 2 });
  return view;
}

describe('módulo programs: los ejercicios de cada día (PR 2.9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.fetchProgram.mockResolvedValue(prueba());
    api.saveProgram.mockResolvedValue({
      status: 'saved',
      id: ID,
      updatedAt: '2026-11-15T11:00:00Z',
    });
    exercisesApi.fetchExercises.mockResolvedValue([LAT, LEG, ROW, PLANK]);
  });

  it('enseña los ejercicios del día en orden, con su nombre y el total arriba', async () => {
    await openMonday();

    expect(await screen.findByText('1. Barbell row')).toBeVisible();
    expect(names()).toHaveLength(2);
    expect(names()[0]).toMatch(/^1\. Barbell row3 sets$/);
    expect(names()[1]).toMatch(/^2\. Lat pulldown3 sets$/);
    expect(screen.getByText('2 exercises · 6 sets', { selector: 'p' })).toBeVisible();
  });

  it('se ve un ejercicio cada vez: se elige por su número o deslizando (D-106)', async () => {
    const { user } = await openMonday();
    const first = await screen.findByText('1. Barbell row');
    expect(screen.queryByText('2. Lat pulldown')).toBeNull();

    await user.click(screen.getByRole('button', { name: /^2\. Lat pulldown/ }));
    expect(screen.getByText('2. Lat pulldown')).toBeVisible();
    expect(first).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^2\. Lat pulldown/ })).toHaveAttribute(
      'aria-current',
      'true',
    );

    // Deslizar a la derecha vuelve al anterior; a la izquierda, al siguiente.
    const swipe = (element: HTMLElement, fromX: number, toX: number, toY = 110) => {
      fireEvent.touchStart(element, { touches: [{ clientX: fromX, clientY: 100 }] });
      fireEvent.touchEnd(element, { changedTouches: [{ clientX: toX, clientY: toY }] });
    };
    swipe(screen.getByText('2. Lat pulldown'), 100, 300);
    expect(screen.getByText('1. Barbell row')).toBeVisible();
    swipe(screen.getByText('1. Barbell row'), 300, 100);
    expect(screen.getByText('2. Lat pulldown')).toBeVisible();
    // Un gesto hacia abajo no cambia de ejercicio.
    swipe(screen.getByText('2. Lat pulldown'), 300, 220, 400);
    expect(screen.getByText('2. Lat pulldown')).toBeVisible();
  });

  it('"Añadir ejercicio" busca en los ejercicios sin salir de la rutina y lo añade con 3 series', async () => {
    const { user, router } = await openMonday();
    await user.click(screen.getByRole('button', { name: 'Add exercise' }));
    await user.type(screen.getByLabelText('Search by name'), 'leg');
    await user.click(screen.getByRole('button', { name: /^Leg press/ }));

    expect(router.state.location.pathname).toBe(`/coach/programs/${ID}`);
    expect(names().at(-1)).toMatch(/^3\. Leg press3 sets/);
    // Se pasa al recién añadido.
    expect(screen.getByText('3. Leg press')).toBeVisible();
    expect(screen.getByText('3 exercises · 9 sets', { selector: 'p' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  it('si no existe, "Crear «lo escrito»" lo crea aquí mismo y lo añade al día', async () => {
    const created = {
      ...exercise(9, 'x'),
      name: 'Remo con goma',
      libraryKey: null,
      libraryName: null,
      original: null,
    };
    exercisesApi.createExercise.mockResolvedValue({ status: 'saved', exercise: created });
    const { user } = await openMonday();
    await user.click(screen.getByRole('button', { name: 'Add exercise' }));
    await user.type(screen.getByLabelText('Search by name'), 'remo con goma');
    await user.click(screen.getByRole('button', { name: 'Create “remo con goma”' }));

    expect(screen.getByLabelText('Name')).toHaveValue('remo con goma');
    await user.click(screen.getByRole('radio', { name: /Weight and reps/ }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(exercisesApi.createExercise).toHaveBeenCalled();
    expect(await screen.findByText('3. Remo con goma')).toBeVisible();
  });

  it('"Subir", "Bajar" y "Quitar" ordenan el día, y se guarda en ese orden', async () => {
    const { user } = await openMonday();
    await user.click(await screen.findByRole('button', { name: /^2\. Lat pulldown/ }));
    await user.click(screen.getByRole('button', { name: 'Move up: Lat pulldown' }));
    expect(names().map((name) => name.slice(0, 16))).toEqual([
      '1. Lat pulldown3',
      '2. Barbell row3 ',
    ]);
    // Sigue viéndose el que se movió.
    expect(screen.getByText('1. Lat pulldown')).toBeVisible();

    await user.click(screen.getByRole('button', { name: /^2\. Barbell row/ }));
    await user.click(screen.getByRole('button', { name: 'Remove: Barbell row' }));
    expect(names()).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    const sent = api.saveProgram.mock.calls[0]?.[1];
    expect(sent?.blocks[0]?.days[0]?.exercises.map((item) => item.exerciseId)).toEqual([LAT.id]);
  });

  it('quitar un ejercicio con la prescripción escrita pide confirmación', async () => {
    const document = prueba();
    const day = document.blocks[0]?.days[0];
    const row = day?.exercises[0];
    if (day === undefined || row === undefined) throw new Error('faltan datos');
    day.exercises[0] = { ...row, restSeconds: 120 };
    api.fetchProgram.mockResolvedValue(document);
    const { user } = await openMonday();
    await user.click(await screen.findByRole('button', { name: 'Remove: Barbell row' }));

    expect(
      screen.getByText(
        '“Barbell row” already has a prescription written. Remove it from this day?',
      ),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(names()).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Remove: Barbell row' }));
    await user.click(screen.getByRole('button', { name: 'Yes, remove' }));
    expect(names()).toHaveLength(1);
  });
});

describe('módulo programs: sustituir, nota y archivados (PR 2.9b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.fetchProgram.mockResolvedValue(prueba());
    api.saveProgram.mockResolvedValue({
      status: 'saved',
      id: ID,
      updatedAt: '2026-11-15T11:00:00Z',
    });
    exercisesApi.fetchExercises.mockResolvedValue([LAT, LEG, ROW, PLANK]);
    exercisesApi.isExerciseInUse.mockResolvedValue(false);
  });

  it('"Sustituir" solo ofrece los que se miden igual, y conserva el sitio y las series', async () => {
    const { user } = await openMonday();
    await user.click(await screen.findByRole('button', { name: 'Replace: Barbell row' }));

    const picker = screen.getByRole('list', { name: 'Replace “Barbell row”' });
    expect(within(picker).queryByRole('button', { name: /^Plank/ })).toBeNull();
    await user.click(within(picker).getByRole('button', { name: /^Leg press/ }));

    expect(names()[0]).toMatch(/^1\. Leg press3 sets/);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    const sent = api.saveProgram.mock.calls[0]?.[1]?.blocks[0]?.days[0]?.exercises;
    expect(sent?.map((item) => item.exerciseId)).toEqual([LEG.id, LAT.id]);
    expect(sent?.[0]?.sets).toHaveLength(3);
  });

  it('la nota del ejercicio se escribe y se guarda', async () => {
    const { user } = await openMonday();
    await screen.findByText('1. Barbell row');
    await user.click(screen.getByRole('button', { name: 'Add a note' }));
    await user.type(screen.getByLabelText('Note for “Barbell row”'), 'Pausa arriba');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    const sent = api.saveProgram.mock.calls[0]?.[1]?.blocks[0]?.days[0]?.exercises;
    expect(sent?.[0]?.note).toBe('Pausa arriba');
  });

  it('un ejercicio archivado sigue en la rutina con su etiqueta, y no sale en el buscador', async () => {
    exercisesApi.fetchExercises.mockResolvedValue([
      { ...LAT, archivedAt: '2026-11-15T09:00:00Z' },
      LEG,
      ROW,
      PLANK,
    ]);
    const { user } = await openMonday();

    await user.click(
      await screen.findByRole('button', { name: /^2\. Lat pulldown3 setsArchived/ }),
    );
    expect(screen.getAllByText('Archived').at(-1)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Add exercise' }));
    const picker = screen.getByRole('list', { name: 'Add exercise' });
    expect(within(picker).queryByRole('button', { name: /^Lat pulldown/ })).toBeNull();
    expect(within(picker).getByRole('button', { name: /^Leg press/ })).toBeVisible();
  });
});
