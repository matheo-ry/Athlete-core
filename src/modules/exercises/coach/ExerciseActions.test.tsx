import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAppAs } from '@/test/render-app';

import type { SaveExerciseResult } from '../api/exercises-api';
import type { ExerciseInput } from '../model/exercise-form';
import type { Exercise } from '../model/exercise-schema';

// Archivar, recuperar, duplicar y restaurar (PR 2.4b), con la base de datos
// sustituida por datos inventados.
const api = vi.hoisted(() => ({
  fetchExercises: vi.fn<(tenantId: string) => Promise<Exercise[]>>(),
  createExercise:
    vi.fn<
      (tenantId: string, userId: string, input: ExerciseInput) => Promise<SaveExerciseResult>
    >(),
  updateExercise: vi.fn<(id: string, input: ExerciseInput) => Promise<SaveExerciseResult>>(),
  setExerciseArchived: vi.fn<(id: string, archived: boolean) => Promise<SaveExerciseResult>>(),
}));
vi.mock('../api/exercises-api', () => api);

const ORIGINAL = {
  measurement: 'bodyweight_reps',
  isUnilateral: false,
  muscleGroup: 'chest',
  equipment: 'bodyweight',
} as const;

function fromLibrary(id: number, en: string, es: string, overrides: Partial<Exercise> = {}) {
  return {
    id: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    name: null,
    libraryKey: `key_${id}`,
    libraryName: { en, es },
    ...ORIGINAL,
    instructions: null,
    videoUrl: null,
    archivedAt: null,
    original: ORIGINAL,
    ...overrides,
  } satisfies Exercise;
}

const PUSH_UP = fromLibrary(1, 'Push-up', 'Flexiones');
const BURPEE = fromLibrary(2, 'Burpee', 'Burpees', { muscleGroup: 'full_body' });
const RENAMED = fromLibrary(3, 'Lat pulldown', 'Jalón al pecho', {
  name: 'Jalón agarre amplio',
  videoUrl: 'https://youtu.be/abc',
});

function rowNames(): string[] {
  return within(screen.getByRole('list'))
    .getAllByRole('listitem')
    .map((item) => item.querySelector('span > span')?.textContent ?? '');
}

describe('módulo exercises: archivar, recuperar, duplicar y restaurar (PR 2.4b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchExercises.mockResolvedValue([PUSH_UP, BURPEE, RENAMED]);
    api.setExerciseArchived.mockImplementation((id, archived) => {
      const exercise = [PUSH_UP, BURPEE, RENAMED].find((item) => item.id === id) ?? BURPEE;
      const archivedAt = archived ? '2026-11-15T10:00:00Z' : null;
      return Promise.resolve({ status: 'saved', exercise: { ...exercise, archivedAt } });
    });
  });

  it('archiva "Burpee", aparece en "Archivados" y "Recuperar" lo devuelve', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach/exercises');
    await user.click(await screen.findByRole('button', { name: /^Burpee/ }));
    await user.click(screen.getByRole('button', { name: 'Archive' }));

    expect(api.setExerciseArchived).toHaveBeenCalledWith(BURPEE.id, true);
    expect(await screen.findByRole('status')).toHaveTextContent('“Burpee” archived.');
    expect(rowNames()).toEqual(['Jalón agarre amplio', 'Push-up']);

    await user.click(screen.getByRole('button', { name: 'Archived 1' }));
    await user.click(screen.getByRole('button', { name: /^Burpee/ }));
    await user.click(screen.getByRole('button', { name: 'Recover' }));

    expect(api.setExerciseArchived).toHaveBeenLastCalledWith(BURPEE.id, false);
    expect(await screen.findByRole('status')).toHaveTextContent('“Burpee” is active again.');
    expect(screen.getByRole('button', { name: 'Active 3' })).toBeVisible();
  });

  it('si recuperar choca con el tope de 1.000, lo dice', async () => {
    api.fetchExercises.mockResolvedValue([{ ...BURPEE, archivedAt: '2026-11-15T10:00:00Z' }]);
    api.setExerciseArchived.mockResolvedValue({ status: 'limit_reached' });
    const { user } = await renderAppAs(
      'coach@example.test',
      `/coach/exercises?exercise=${BURPEE.id}`,
    );
    await user.click(await screen.findByRole('button', { name: 'Recover' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('1,000 active exercises');
  });

  it('duplica "Push-up": crea una copia propia y abre su formulario', async () => {
    const copy: Exercise = {
      ...PUSH_UP,
      id: '00000000-0000-4000-8000-000000000099',
      name: 'Push-up (copy)',
      libraryKey: null,
      libraryName: null,
      original: null,
    };
    api.createExercise.mockResolvedValue({ status: 'saved', exercise: copy });
    const { user } = await renderAppAs(
      'coach@example.test',
      `/coach/exercises?exercise=${PUSH_UP.id}`,
    );
    await user.click(await screen.findByRole('button', { name: 'Duplicate' }));

    expect(api.createExercise).toHaveBeenCalledWith(expect.any(String), expect.any(String), {
      name: 'Push-up (copy)',
      ...ORIGINAL,
      instructions: null,
      videoUrl: null,
    });
    expect(await screen.findByDisplayValue('Push-up (copy)')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Edit exercise' })).toHaveFocus();
    const copyRow = screen.getByRole('button', { name: /^Push-up \(copy\)/ });
    expect(copyRow).toHaveTextContent('Custom');
  });

  it('"Restaurar original" solo sale en los del catálogo que han cambiado, y pide confirmación', async () => {
    api.updateExercise.mockResolvedValue({
      status: 'saved',
      exercise: { ...RENAMED, name: null, videoUrl: null },
    });
    const { user } = await renderAppAs(
      'coach@example.test',
      `/coach/exercises?exercise=${PUSH_UP.id}`,
    );
    await screen.findByRole('button', { name: 'Duplicate' });
    expect(screen.queryByRole('button', { name: 'Restore original' })).toBeNull();

    await user.click(screen.getByRole('button', { name: /^Jalón agarre amplio/ }));
    await user.click(screen.getByRole('button', { name: 'Restore original' }));
    expect(screen.getByText(/It will go back to “Lat pulldown”/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Yes, restore' }));

    expect(api.updateExercise).toHaveBeenCalledWith(RENAMED.id, {
      name: null,
      ...ORIGINAL,
      instructions: null,
      videoUrl: null,
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      '“Lat pulldown” is back to the original.',
    );
    expect(rowNames()).toContain('Lat pulldown');
  });
});
