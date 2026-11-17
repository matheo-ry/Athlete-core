import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAppAs } from '@/test/render-app';

import type { RawWorkout } from '../model/exercise-history';

const api = vi.hoisted(() => ({
  fetchClientWorkouts: vi.fn<(tenantId: string, clientId: string) => Promise<RawWorkout[]>>(),
  fetchCurrentClientProgramId:
    vi.fn<(tenantId: string, clientId: string) => Promise<string | null>>(),
}));
vi.mock('../api/progress-api', () => api);

const exercisesApi = vi.hoisted(() => ({
  fetchExercises: vi.fn(),
}));
vi.mock('@/modules/exercises/api/exercises-api', () => exercisesApi);

describe('ClientProgressPage (D-129, Criterio 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exercisesApi.fetchExercises.mockResolvedValue([
      {
        id: 'ex-flexiones',
        name: 'Flexiones con mochila',
        libraryKey: null,
        libraryName: null,
        muscleGroup: 'chest',
        equipment: 'bodyweight',
        measurement: 'weight_reps',
        isUnilateral: false,
        instructions: null,
        videoUrl: null,
        archivedAt: null,
      },
    ]);
  });

  it('muestra estado vacío si no hay entrenos', async () => {
    api.fetchClientWorkouts.mockResolvedValue([]);
    api.fetchCurrentClientProgramId.mockResolvedValue('prog-1');

    await renderAppAs('client@example.test', '/client/progress');

    expect(await screen.findByText('No workouts recorded yet')).toBeVisible();
  });

  it('criterio 1: Ana ve en Progreso sus ejercicios y en Flexiones con mochila su historial DIA 1 … DIA 3', async () => {
    const workouts: RawWorkout[] = [
      {
        id: 'w-1',
        performed_on: '2026-10-06',
        started_at: '2026-10-06T18:00:00Z',
        closed_at: '2026-10-06T19:00:00Z',
        day_number: 1,
        program_id: 'prog-1',
        programs: { id: 'prog-1', name: 'Casa + Gym' },
        workout_exercises: [
          {
            id: 'we-1',
            exercise_id: 'ex-flexiones',
            replaces_exercise_id: null,
            day_note: null,
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-1',
                set_number: 1,
                side: 'none',
                weight_kg: 45,
                reps: 8,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                recorded_at: '2026-10-06T18:03:00Z',
              },
              {
                id: 's-2',
                set_number: 2,
                side: 'none',
                weight_kg: 45,
                reps: 7,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                recorded_at: '2026-10-06T18:06:00Z',
              },
            ],
          },
        ],
      },
      {
        id: 'w-2',
        performed_on: '2026-10-13',
        started_at: '2026-10-13T18:00:00Z',
        closed_at: '2026-10-13T19:00:00Z',
        day_number: 1,
        program_id: 'prog-1',
        programs: { id: 'prog-1', name: 'Casa + Gym' },
        workout_exercises: [
          {
            id: 'we-2',
            exercise_id: 'ex-flexiones',
            replaces_exercise_id: null,
            day_note: 'Mochila cargada',
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-3',
                set_number: 1,
                side: 'none',
                weight_kg: 47.5,
                reps: 8,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                recorded_at: '2026-10-13T18:03:00Z',
              },
            ],
          },
        ],
      },
      {
        id: 'w-3',
        performed_on: '2026-10-20',
        started_at: '2026-10-20T18:00:00Z',
        closed_at: '2026-10-20T19:00:00Z',
        day_number: 1,
        program_id: 'prog-1',
        programs: { id: 'prog-1', name: 'Casa + Gym' },
        workout_exercises: [
          {
            id: 'we-3',
            exercise_id: 'ex-flexiones',
            replaces_exercise_id: null,
            day_note: null,
            is_skipped: false,
            position: 1,
            workout_sets: [
              {
                id: 's-4',
                set_number: 1,
                side: 'none',
                weight_kg: 50,
                reps: 8,
                duration_seconds: null,
                distance_meters: null,
                intensity_type: 'rir',
                intensity_value: 1,
                is_done: true,
                recorded_at: '2026-10-20T18:03:00Z',
              },
            ],
          },
        ],
      },
    ];

    api.fetchClientWorkouts.mockResolvedValue(workouts);
    api.fetchCurrentClientProgramId.mockResolvedValue('prog-1');

    await renderAppAs('client@example.test', '/client/progress');

    expect(await screen.findByRole('heading', { level: 1, name: 'Progress' })).toBeVisible();
    expect(await screen.findByRole('heading', { level: 2, name: 'Casa + Gym' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Flexiones con mochila' })).toBeVisible();

    // Récords visibles
    expect(screen.getByTestId('record-ex-flexiones')).toHaveTextContent('Record');
    expect(screen.getByTestId('record-ex-flexiones')).toHaveTextContent('50 kg');

    // Historial DIA 1 … DIA 3
    const historyList = screen.getByTestId('history-ex-flexiones');
    expect(historyList).toHaveTextContent('DAY 1: 45×8(1) / 45×7(1)');
    expect(historyList).toHaveTextContent('DAY 2: 47.5×8(1)');
    expect(historyList).toHaveTextContent('DAY 3: 50×8(1)');

    // Marca de nota
    expect(screen.getByTestId('note-mark')).toBeVisible();
    expect(screen.getByTestId('session-note')).toHaveTextContent('Mochila cargada');
  });
});
