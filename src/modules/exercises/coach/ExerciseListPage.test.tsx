import { act, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@/core/i18n';
import { renderAppAs } from '@/test/render-app';

import type { Exercise } from '../model/exercise-schema';

// La pantalla entera, con la consulta a la base de datos sustituida por datos
// inventados. La lógica de búsqueda y filtros tiene sus propios tests en model/.
const fetchExercises = vi.hoisted(() => vi.fn<(tenantId: string) => Promise<Exercise[]>>());
vi.mock('../api/exercises-api', () => ({ fetchExercises }));

function exercise(id: number, en: string, es: string, overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    name: null,
    libraryKey: `key_${id}`,
    libraryName: { en, es },
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
    ...overrides,
  };
}

const EXERCISES = [
  exercise(1, 'Lat pulldown', 'Jalón al pecho'),
  exercise(2, 'Machine chest press', 'Press de pecho en máquina', {
    muscleGroup: 'chest',
    equipment: 'machine',
  }),
  exercise(3, 'Dumbbell row', 'Remo con mancuerna', { equipment: 'dumbbells', isUnilateral: true }),
  exercise(4, '', '', {
    name: 'Remo Gironda agarre amplio',
    libraryKey: null,
    libraryName: null,
    original: null,
  }),
  exercise(5, 'Burpee', 'Burpees', { archivedAt: '2026-11-15T10:00:00Z' }),
];

function rowNames(): string[] {
  return within(screen.getByRole('list'))
    .getAllByRole('listitem')
    .map((item) => item.querySelector('span > span')?.textContent ?? '');
}

describe('módulo exercises: lista, buscador y filtros (PR 2.3)', () => {
  beforeEach(() => {
    fetchExercises.mockReset();
    fetchExercises.mockResolvedValue(EXERCISES);
  });

  it('el coach ve "Ejercicios" en el menú y, dentro, los activos por orden alfabético', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach');

    const [menuLink] = await screen.findAllByRole('link', { name: 'Exercises' });
    await user.click(menuLink as HTMLElement);

    expect(await screen.findByRole('heading', { name: 'Exercises' })).toBeVisible();
    await screen.findByRole('list');
    expect(rowNames()).toEqual([
      'Dumbbell row',
      'Lat pulldown',
      'Machine chest press',
      'Remo Gironda agarre amplio',
    ]);
    expect(screen.getByRole('button', { name: 'Active 4' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Archived 1' })).toBeVisible();
    const [row] = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(row).toHaveTextContent('Back · Dumbbells');
    expect(row).toHaveTextContent('Unilateral');
    expect(screen.getByText('Custom')).toBeVisible();
  });

  it('en español, los del catálogo se ven en español y el buscador no mira las tildes', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach/exercises');
    await screen.findByRole('list');

    await act(() => i18n.changeLanguage('es'));
    expect(rowNames()[0]).toBe('Jalón al pecho');

    await user.type(screen.getByLabelText('Buscar por nombre'), 'jalon');
    expect(rowNames()).toEqual(['Jalón al pecho']);
  });

  it('los filtros se combinan, y sin resultados lo dice', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach/exercises');
    await screen.findByRole('list');

    await user.selectOptions(screen.getByLabelText('Muscle group'), 'Chest');
    await user.selectOptions(screen.getByLabelText('Equipment'), 'Machine');
    expect(rowNames()).toEqual(['Machine chest press']);

    await user.selectOptions(screen.getByLabelText('Origin'), 'Mine');
    expect(screen.getByText('No exercise matches')).toBeVisible();
  });

  it('la pestaña "Archivados"', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach/exercises');
    await user.click(await screen.findByRole('button', { name: 'Archived 1' }));
    expect(rowNames()).toEqual(['Burpee']);
  });

  it('sin archivados, su pestaña lo dice', async () => {
    fetchExercises.mockResolvedValue(EXERCISES.filter((item) => item.archivedAt === null));
    const { user } = await renderAppAs('coach@example.test', '/coach/exercises');
    await user.click(await screen.findByRole('button', { name: 'Archived 0' }));
    expect(screen.getByText('No archived exercises')).toBeVisible();
  });

  it('si falla la carga, un error con "Reintentar" que vuelve a pedirla', async () => {
    fetchExercises.mockRejectedValueOnce(new Error('offline'));
    const { user } = await renderAppAs('coach@example.test', '/coach/exercises');

    await user.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('list')).toBeVisible();
    expect(fetchExercises).toHaveBeenCalledTimes(2);
  });

  it('un cliente no ve "Ejercicios" y /coach/exercises lo devuelve a su zona', async () => {
    const { router } = await renderAppAs('client@example.test', '/coach/exercises');

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/client');
    expect(screen.queryByRole('link', { name: 'Exercises' })).toBeNull();
    expect(fetchExercises).not.toHaveBeenCalled();
  });
});
