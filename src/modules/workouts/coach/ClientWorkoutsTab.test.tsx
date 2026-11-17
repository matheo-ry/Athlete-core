import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadAllTranslations } from '@/test/load-translations';
import type * as exercisesModule from '@/modules/exercises';
import * as coachApi from '../api/workouts-coach-api';
import { ClientWorkoutsTab } from './ClientWorkoutsTab';
import type { WorkoutRecord } from '../model/workout-types';

vi.mock('../api/workouts-coach-api');

// Mock de exercises options
vi.mock('@/modules/exercises', async (importOriginal) => {
  const actual = await importOriginal<typeof exercisesModule>();
  return {
    ...actual,
    useExerciseOptions: () => ({
      byId: new Map([
        [
          '00000000-0000-0000-0000-000000000100',
          {
            id: '00000000-0000-0000-0000-000000000100',
            name: 'Press de banca',
            measurement: 'reps_weight',
            isUnilateral: false,
            isArchived: false,
            instructions: null,
            videoUrl: null,
          },
        ],
        [
          '00000000-0000-0000-0000-000000000200',
          {
            id: '00000000-0000-0000-0000-000000000200',
            name: 'Press con mancuernas',
            measurement: 'reps_weight',
            isUnilateral: false,
            isArchived: false,
            instructions: null,
            videoUrl: null,
          },
        ],
        [
          '00000000-0000-0000-0000-000000000300',
          {
            id: '00000000-0000-0000-0000-000000000300',
            name: 'Dominadas',
            measurement: 'reps_weight',
            isUnilateral: false,
            isArchived: false,
            instructions: null,
            videoUrl: null,
          },
        ],
      ]),
      isPending: false,
      isError: false,
    }),
  };
});

// Mock de auth useProfile
vi.mock('@/core/auth', () => ({
  useProfile: () => ({
    data: { weightUnit: 'kg' },
    isPending: false,
  }),
}));

// Mock de tenancy useTenancy
vi.mock('@/core/tenancy', () => ({
  useTenancy: () => ({
    tenant: { id: '11111111-1111-1111-1111-111111111111' },
    role: 'owner',
  }),
}));

const mockWorkout: WorkoutRecord = {
  id: 'w1',
  tenant_id: '11111111-1111-1111-1111-111111111111',
  client_id: 'c1',
  program_id: 'p1',
  block_id: null,
  program_day_id: 'd1',
  day_number: 1,
  performed_on: '2026-11-16',
  started_at: '2026-11-16T10:00:00Z',
  closed_at: '2026-11-16T10:45:00Z',
  edited_at: null,
  close_reason: 'completed',
  last_changed_at: '2026-11-16T10:45:00Z',
  workout_exercises: [
    {
      id: 'we1',
      workout_id: 'w1',
      position: 1,
      exercise_id: '00000000-0000-0000-0000-000000000100',
      replaces_exercise_id: null,
      superset_group: null,
      prescribed_sets: [],
      prescribed_rest_seconds: 120,
      coach_note: 'Mantén los codos a 45 grados',
      day_note: 'Sensaciones geniales hoy',
      is_skipped: false,
      changed_at: '2026-11-16T10:15:00Z',
      workout_sets: [
        {
          id: 'ws1',
          workout_exercise_id: 'we1',
          set_number: 1,
          side: 'none',
          weight_kg: 80,
          reps: 8,
          duration_seconds: null,
          distance_meters: null,
          intensity_type: 'rir',
          intensity_value: 1,
          is_done: true,
          is_extra: false,
          recorded_at: '2026-11-16T10:05:00Z',
        },
        {
          id: 'ws2',
          workout_exercise_id: 'we1',
          set_number: 2,
          side: 'none',
          weight_kg: 80,
          reps: 7,
          duration_seconds: null,
          distance_meters: null,
          intensity_type: 'rir',
          intensity_value: 1,
          is_done: true,
          is_extra: false,
          recorded_at: '2026-11-16T10:10:00Z',
        },
      ],
    },
  ],
};

function renderTab(clientId = 'c1', clientName = 'Ana Cliente') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ClientWorkoutsTab clientId={clientId} clientName={clientName} isActive={true} />
    </QueryClientProvider>,
  );
}

describe('ClientWorkoutsTab (PR 3.13, D-124, D-126, D-127, D-128)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await loadAllTranslations();

    vi.mocked(coachApi.fetchClientWorkouts).mockResolvedValue([mockWorkout]);
    vi.mocked(coachApi.fetchClientMissedDays).mockResolvedValue([]);
    vi.mocked(coachApi.fetchProgramDays).mockResolvedValue([
      { id: 'd1', name: 'Lunes - Pecho', day_number: 1 },
    ]);
    vi.mocked(coachApi.fetchClientSetups).mockResolvedValue([
      { exercise_id: '00000000-0000-0000-0000-000000000100', setup: 'Banco en el 3' },
    ]);
    vi.mocked(coachApi.fetchClientHealthData).mockResolvedValue({
      hasConsent: true,
      weights: [{ id: 'bw1', measured_on: '2026-11-16', weight_kg: 85 }],
      measurements: [
        { id: 'bm1', measured_on: '2026-11-16', kind: 'waist', side: null, value_cm: 75 },
        { id: 'bm2', measured_on: '2026-11-16', kind: 'arm', side: 'right', value_cm: 32 },
      ],
    });
  });

  it('Criterio 1: Ana hace un entreno; como coach.iron, en su ficha → "Entrenos", lo veo con sus series y su nota', async () => {
    const user = userEvent.setup();
    renderTab('c1', 'Ana');

    expect(await screen.findByText('Lunes - Pecho')).toBeVisible();
    expect(screen.getByText(/2 sets|2 series/i)).toBeVisible();

    // Desplegar detalles
    const toggleButton = screen.getByRole('button', { name: /Ver detalles|View details/i });
    await user.click(toggleButton);

    // Se ve el ejercicio, las series como en Excel y la nota del día
    expect(await screen.findByText('Press de banca')).toBeVisible();
    expect(screen.getByText('80×8(1) / 80×7(1)')).toBeVisible();
    expect(screen.getByText(/Sensaciones geniales hoy/)).toBeVisible();
    expect(screen.getByText(/Banco en el 3/)).toBeVisible();
    expect(screen.getByText(/Duración: 45 min|Duration: 45 min/i)).toBeVisible();
  });

  it('Criterio 2: Un entreno a medias de Ana, ya subido, sale "En curso"', async () => {
    const inProgressWorkout: WorkoutRecord = {
      ...mockWorkout,
      id: 'w2',
      closed_at: null,
    };
    vi.mocked(coachApi.fetchClientWorkouts).mockResolvedValue([inProgressWorkout]);

    renderTab('c1', 'Ana');

    expect(await screen.findByText(/En curso|In progress/i)).toBeVisible();
  });

  it('Muestra la marca "Editado" si el entreno fue corregido', async () => {
    const editedWorkout: WorkoutRecord = {
      ...mockWorkout,
      id: 'w3',
      edited_at: '2026-11-17T09:00:00Z',
    };
    vi.mocked(coachApi.fetchClientWorkouts).mockResolvedValue([editedWorkout]);

    renderTab('c1', 'Ana');

    expect(await screen.findByText(/Editado|Edited/i)).toBeVisible();
  });

  it('Muestra los días faltados con la marca "Faltado"', async () => {
    vi.mocked(coachApi.fetchClientMissedDays).mockResolvedValue([
      {
        id: 'md1',
        tenant_id: '11111111-1111-1111-1111-111111111111',
        program_id: 'p1',
        block_id: null,
        program_day_id: 'd1',
        day_number: 1,
        missed_on: '2026-11-15',
      },
    ]);

    renderTab('c1', 'Ana');

    const badges = await screen.findAllByText(/Faltado|Missed/i);
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0]).toBeVisible();
  });

  it('Criterio 3: Veo su peso (85 kg) y sus medidas', async () => {
    renderTab('c1', 'Ana');

    expect(await screen.findByText(/85 kg/)).toBeVisible();
    expect(screen.getByText(/75 cm/)).toBeVisible();
    expect(screen.getByText(/32 cm/)).toBeVisible();
  });

  it('Criterio 4: Bruno no ha dado el consentimiento: sale el aviso y no veo nada de salud', async () => {
    vi.mocked(coachApi.fetchClientHealthData).mockResolvedValue({
      hasConsent: false,
      weights: [],
      measurements: [],
    });

    renderTab('c2', 'Bruno');

    const notice = await screen.findByTestId('health-consent-notice');
    expect(notice).toBeVisible();
    expect(notice).toHaveTextContent(
      /Tu cliente no ha dado permiso para compartir sus datos de salud|Your client has not given permission to share health data/,
    );
    expect(screen.queryByText(/85 kg/)).toBeNull();
  });

  it('Muestra estado vacío si el cliente no tiene entrenos ni días faltados', async () => {
    vi.mocked(coachApi.fetchClientWorkouts).mockResolvedValue([]);
    vi.mocked(coachApi.fetchClientMissedDays).mockResolvedValue([]);

    renderTab('c1', 'Ana');

    expect(await screen.findByText(/Aún no hay entrenos|No workouts yet/i)).toBeVisible();
  });

  it('Muestra estado de error con botón de reintentar si falla la carga', async () => {
    vi.mocked(coachApi.fetchClientWorkouts).mockRejectedValue(new Error('Network error'));

    renderTab('c1', 'Ana');

    expect(await screen.findByRole('button', { name: /Reintentar|Try again/i })).toBeVisible();
  });
});
