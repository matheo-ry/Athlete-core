import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TEST_TENANTS, createFakeTenancySource } from '@/test/fake-tenancy-source';
import { renderAppAs } from '@/test/render-app';

import type { WorkoutActivityRecord } from '../model/workout-activity';
import { getOpenedWorkoutIds } from '../model/workout-activity';

const api = vi.hoisted(() => ({
  fetchCoachActivityWorkouts: vi.fn<() => Promise<WorkoutActivityRecord[]>>(),
}));
vi.mock('../api/workouts-api', () => api);

async function anaUserId(): Promise<string> {
  const members = await createFakeTenancySource().listMembers(TEST_TENANTS.iron.id);
  return members.find((member) => member.displayName === 'Ana Cliente')?.userId ?? '';
}

describe('módulo workouts: tarjeta de actividad del coach (PR 3.14)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('sin actividad enseña el texto vacío', async () => {
    api.fetchCoachActivityWorkouts.mockResolvedValue([]);

    await renderAppAs('coach@example.test', '/coach');

    expect(await screen.findByRole('heading', { name: 'Activity' })).toBeVisible();
    expect(screen.getByText('No workouts from your clients yet')).toBeVisible();
  });

  it('enseña el entreno con récords, cambios y notas, marcado como nuevo', async () => {
    const anaId = await anaUserId();
    const priorWorkout: WorkoutActivityRecord = {
      id: 'w-prev',
      clientId: anaId,
      performedOn: '2026-11-02',
      dayNumber: 1,
      dayName: null,
      exercises: [
        {
          id: 'we-p1',
          exerciseId: 'ex-laterales',
          replacesExerciseId: null,
          dayNote: null,
          isSkipped: false,
          sets: [
            {
              setNumber: 1,
              weightKg: 10,
              reps: 10,
              intensityType: 'rir',
              intensityValue: 1,
              isDone: true,
            },
          ],
        },
        {
          id: 'we-p2',
          exerciseId: 'ex-martillo',
          replacesExerciseId: null,
          dayNote: null,
          isSkipped: false,
          sets: [
            {
              setNumber: 1,
              weightKg: 12,
              reps: 10,
              intensityType: 'rir',
              intensityValue: 1,
              isDone: true,
            },
          ],
        },
      ],
    };

    const currentWorkout: WorkoutActivityRecord = {
      id: 'w-current',
      clientId: anaId,
      performedOn: '2026-11-09',
      dayNumber: 1,
      dayName: null,
      exercises: [
        {
          id: 'we-1',
          exerciseId: 'ex-laterales',
          replacesExerciseId: null,
          dayNote: null,
          isSkipped: false,
          sets: [
            {
              setNumber: 1,
              weightKg: 12,
              reps: 10,
              intensityType: 'rir',
              intensityValue: 1,
              isDone: true,
            },
          ],
        },
        {
          id: 'we-2',
          exerciseId: 'ex-martillo',
          replacesExerciseId: null,
          dayNote: null,
          isSkipped: false,
          sets: [
            {
              setNumber: 1,
              weightKg: 14,
              reps: 10,
              intensityType: 'rir',
              intensityValue: 1,
              isDone: true,
            },
          ],
        },
        {
          id: 'we-3',
          exerciseId: 'ex-banca',
          replacesExerciseId: 'ex-flexiones',
          dayNote: 'Molestia en el hombro, bajé un poco el peso',
          isSkipped: false,
          sets: [
            {
              setNumber: 1,
              weightKg: 40,
              reps: 10,
              intensityType: 'rir',
              intensityValue: 1,
              isDone: true,
            },
          ],
        },
      ],
    };

    api.fetchCoachActivityWorkouts.mockResolvedValue([currentWorkout, priorWorkout]);

    const { user } = await renderAppAs('coach@example.test', '/coach');

    expect(await screen.findByRole('heading', { name: 'Activity' })).toBeVisible();

    // Texto exacto en inglés:
    // "Ana Cliente finished Monday · 2 records · changed 1 exercise · 1 note"
    const lineText = /Ana Cliente finished Monday · 2 records · changed 1 exercise · 1 note/;
    expect(screen.getByText(lineText)).toBeVisible();

    // Marcado como "New" al principio
    expect(screen.getAllByText('New')).toHaveLength(2);

    // Al abrirlo (hacer click), se guarda en localStorage y deja de estar marcado
    await user.click(screen.getByText(lineText));

    await waitFor(() => {
      expect(screen.getAllByText('New')).toHaveLength(1);
    });

    const opened = getOpenedWorkoutIds(localStorage);
    expect(opened.has('w-current')).toBe(true);
  });
});
