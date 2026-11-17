import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_TENANTS, createFakeTenancySource } from '@/test/fake-tenancy-source';
import { renderAppAs } from '@/test/render-app';

import type { RawWorkout } from '../model/exercise-history';

const api = vi.hoisted(() => ({
  fetchClientWorkouts: vi.fn<(tenantId: string, clientId: string) => Promise<RawWorkout[]>>(),
  fetchCurrentClientProgramId:
    vi.fn<(tenantId: string, clientId: string) => Promise<string | null>>(),
}));
vi.mock('../api/progress-api', () => api);

// El peso y las medidas los carga el módulo workouts (D-127).
const healthApi = vi.hoisted(() => ({ fetchClientHealthData: vi.fn() }));
vi.mock('@/modules/workouts/api/workouts-coach-api', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...healthApi,
}));

const exercisesApi = vi.hoisted(() => ({
  fetchExercises: vi.fn(),
}));
vi.mock('@/modules/exercises/api/exercises-api', () => exercisesApi);

const assignments = vi.hoisted(() => ({
  fetchClientPrograms: vi.fn(),
  fetchProgramsOfClient: vi.fn(),
  assignProgram: vi.fn(),
}));
vi.mock('@/modules/programs/api/assignments-api', () => assignments);

const excelMock = vi.hoisted(() => ({
  exportWorkoutsToExcel: vi
    .fn<(options: { clientName?: string }) => Promise<string>>()
    .mockResolvedValue('downloaded'),
}));
vi.mock('../model/export-excel', () => excelMock);

async function anaUserId(): Promise<string> {
  const members = await createFakeTenancySource().listMembers(TEST_TENANTS.iron.id);
  return members.find((member) => member.displayName === 'Ana Cliente')?.userId ?? '';
}

describe('ClientProgressTab (D-129, Criterio 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    healthApi.fetchClientHealthData.mockResolvedValue({
      hasConsent: false,
      weights: [],
      measurements: [],
    });
    assignments.fetchProgramsOfClient.mockResolvedValue([]);

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

  it('criterio 4: el coach ve lo mismo en la pestaña Progreso de Ana', async () => {
    const ana = await anaUserId();

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
            ],
          },
        ],
      },
    ];

    api.fetchClientWorkouts.mockResolvedValue(workouts);
    api.fetchCurrentClientProgramId.mockResolvedValue('prog-1');

    const { user } = await renderAppAs('coach@example.test', `/coach/clients/${ana}`);

    // La pestaña "Progress" debe estar en la ficha
    const progressTab = await screen.findByRole('button', { name: 'Progress' });
    expect(progressTab).toBeVisible();

    // Cambiar a la pestaña "Progress"
    await user.click(progressTab);

    // Enseña la rutina, el ejercicio y el historial
    expect(await screen.findByRole('heading', { level: 2, name: 'Casa + Gym' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Flexiones con mochila' })).toBeVisible();

    const historyList = screen.getByTestId('history-ex-flexiones');
    expect(historyList).toHaveTextContent('DAY 1: 45×8(1)');
  });

  it('criterio 2: Como coach.iron, descargo el Excel de Ana desde su ficha', async () => {
    const ana = await anaUserId();

    api.fetchClientWorkouts.mockResolvedValue([
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
            day_note: 'Primera sesión',
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
            ],
          },
        ],
      },
    ]);
    api.fetchCurrentClientProgramId.mockResolvedValue('prog-1');

    const { user } = await renderAppAs('coach@example.test', `/coach/clients/${ana}`);

    const progressTab = await screen.findByRole('button', { name: 'Progress' });
    await user.click(progressTab);

    const downloadBtn = await screen.findByTestId('download-excel-btn');
    expect(downloadBtn).toBeVisible();

    await user.click(downloadBtn);
    expect(excelMock.exportWorkoutsToExcel).toHaveBeenCalledWith(
      expect.objectContaining({
        clientName: 'Ana Cliente',
      }),
    );
  });
});
