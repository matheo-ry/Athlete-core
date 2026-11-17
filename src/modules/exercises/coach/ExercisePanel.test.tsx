import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAppAs } from '@/test/render-app';

import type { SaveExerciseResult } from '../api/exercises-api';
import type { ExerciseInput } from '../model/exercise-form';
import type { Exercise } from '../model/exercise-schema';

// Crear y editar (PR 2.4a), con la base de datos sustituida por datos
// inventados. Las reglas de validación tienen sus tests en model/.
const api = vi.hoisted(() => ({
  fetchExercises: vi.fn<(tenantId: string) => Promise<Exercise[]>>(),
  isExerciseInUse: vi.fn<(id: string) => Promise<boolean>>(() => Promise.resolve(false)),
  createExercise:
    vi.fn<
      (tenantId: string, userId: string, input: ExerciseInput) => Promise<SaveExerciseResult>
    >(),
  updateExercise: vi.fn<(id: string, input: ExerciseInput) => Promise<SaveExerciseResult>>(),
}));
vi.mock('../api/exercises-api', () => api);

const LAT_PULLDOWN: Exercise = {
  id: '00000000-0000-4000-8000-000000000001',
  name: null,
  libraryKey: 'lat_pulldown',
  libraryName: { en: 'Lat pulldown', es: 'Jalón al pecho' },
  muscleGroup: 'back',
  equipment: 'cable',
  measurement: 'weight_reps',
  isUnilateral: false,
  instructions: null,
  videoUrl: null,
  archivedAt: null,
  original: {
    measurement: 'weight_reps',
    isUnilateral: false,
    muscleGroup: 'back',
    equipment: 'cable',
  },
};

function saved(exercise: Exercise, input: ExerciseInput): SaveExerciseResult {
  return { status: 'saved', exercise: { ...exercise, ...input } };
}

function rowNames(): string[] {
  return within(screen.getByRole('list'))
    .getAllByRole('listitem')
    .map((item) => item.querySelector('span > span')?.textContent ?? '');
}

describe('módulo exercises: crear y editar (PR 2.4a)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchExercises.mockResolvedValue([LAT_PULLDOWN]);
    api.createExercise.mockImplementation((_tenant, _user, input) =>
      Promise.resolve(
        saved(
          {
            ...LAT_PULLDOWN,
            id: '00000000-0000-4000-8000-000000000099',
            libraryKey: null,
            libraryName: null,
            original: null,
          },
          input,
        ),
      ),
    );
    api.updateExercise.mockImplementation((_id, input) =>
      Promise.resolve(saved(LAT_PULLDOWN, input)),
    );
  });

  it('"Nuevo ejercicio": lo crea y aparece en la lista con la etiqueta "Propio"', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach/exercises');
    await user.click(await screen.findByRole('button', { name: 'New exercise' }));

    await user.type(screen.getByLabelText('Name'), 'Flexiones con mochila');
    await user.click(screen.getByRole('radio', { name: /Bodyweight and reps/ }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(api.createExercise).toHaveBeenCalledWith(expect.any(String), expect.any(String), {
      name: 'Flexiones con mochila',
      measurement: 'bodyweight_reps',
      isUnilateral: false,
      muscleGroup: null,
      equipment: null,
      instructions: null,
      videoUrl: null,
    });
    expect(await screen.findByRole('status')).toHaveTextContent('“Flexiones con mochila” saved.');
    expect(rowNames()).toEqual(['Flexiones con mochila', 'Lat pulldown']);
    expect(within(screen.getByRole('list')).getByText('Custom')).toBeVisible();
    // El panel se cierra justo después del aviso: se espera, no se da por hecho.
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'New exercise' })).toBeNull();
    });
  });

  it('sin nombre ni forma de medir, o con un enlace que no es https://, no guarda y dice por qué', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach/exercises?exercise=new');
    await user.click(await screen.findByRole('button', { name: 'Save' }));
    expect(screen.getByText('Write the name of the exercise.')).toBeVisible();
    expect(screen.getByText('Choose how it is measured.')).toBeVisible();

    await user.type(screen.getByLabelText('Name'), 'Plancha');
    await user.click(screen.getByRole('radio', { name: /Time/ }));
    await user.type(screen.getByLabelText('Video link (optional)'), 'http://youtu.be/abc');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByLabelText('Video link (optional)')).toHaveAccessibleDescription(
      /The link must start with https:\/\/ and have no spaces\./,
    );
    expect(api.createExercise).not.toHaveBeenCalled();
  });

  it('una búsqueda sin resultados ofrece "Crear «lo escrito»" con el nombre ya puesto', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach/exercises');
    await user.type(await screen.findByLabelText('Search by name'), 'sentadilla lateral');
    await user.click(screen.getByRole('button', { name: 'Create “sentadilla lateral”' }));

    // El foco se pone en un efecto, justo después de pintar el panel.
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'New exercise' })).toHaveFocus(),
    );
    expect(screen.getByLabelText('Name')).toHaveValue('sentadilla lateral');
  });

  it('edita uno del catálogo: el formulario sale relleno y guarda el nombre nuevo', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach/exercises');
    await user.click(await screen.findByRole('button', { name: /Lat pulldown/ }));

    expect(screen.getByRole('heading', { name: 'Edit exercise' })).toBeVisible();
    expect(screen.getByRole('radio', { name: /Weight and reps/ })).toBeChecked();
    expect(screen.getByLabelText('Muscle group', { selector: 'form select' })).toHaveValue('back');
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Jalón agarre amplio');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(api.updateExercise).toHaveBeenCalledWith(
      LAT_PULLDOWN.id,
      expect.objectContaining({ name: 'Jalón agarre amplio', muscleGroup: 'back' }),
    );
    expect(await screen.findByRole('status')).toBeVisible();
    expect(rowNames()).toEqual(['Jalón agarre amplio']);
  });

  it('si no se puede guardar, lo dice y deja el formulario como estaba', async () => {
    api.updateExercise.mockResolvedValue({ status: 'error' });
    const { user } = await renderAppAs(
      'coach@example.test',
      `/coach/exercises?exercise=${LAT_PULLDOWN.id}`,
    );
    await user.click(await screen.findByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByLabelText('Name')).toHaveValue('Lat pulldown');
  });

  it('"Cancelar" cierra el formulario sin guardar', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach/exercises?exercise=new');
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('heading', { name: 'New exercise' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Exercises' })).toBeVisible();
    expect(api.createExercise).not.toHaveBeenCalled();
  });
});

describe('módulo exercises: un ejercicio que ya está en una rutina (PR 2.9b, D-072)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchExercises.mockResolvedValue([LAT_PULLDOWN]);
    api.isExerciseInUse.mockResolvedValue(true);
  });

  it('no deja cambiar la forma de medir ni "unilateral", y dice que se duplique', async () => {
    await renderAppAs('coach@example.test', `/coach/exercises?exercise=${LAT_PULLDOWN.id}`);

    expect(
      await screen.findByText(
        'This exercise is already in a program. To change how it is measured, duplicate it.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('radio', { name: /Time/ })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /Unilateral/ })).toBeDisabled();
    expect(screen.getByLabelText('Name')).toBeEnabled();
    expect(api.isExerciseInUse).toHaveBeenCalledWith(LAT_PULLDOWN.id);
  });
});
