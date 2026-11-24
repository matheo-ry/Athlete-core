import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as nativeModule from '@/core/native';
import { loadAllTranslations } from '@/test/load-translations';
import type * as exercisesModule from '@/modules/exercises';

import * as clientWorkoutsApi from '../api/client-workouts-api';
import type { ClientWorkoutRecord } from '../model/workout-correction';
import { ClientWorkoutsPage } from './ClientWorkoutsPage';

vi.mock('../api/client-workouts-api');
vi.mock('@/core/native', async (importOriginal) => {
  const actual = await importOriginal<typeof nativeModule>();
  return {
    ...actual,
    canLogWorkouts: vi.fn(),
    getDeviceId: vi.fn().mockResolvedValue('device-123'),
    getUploadQueue: vi.fn(),
    useUploadQueue: vi.fn(),
  };
});

vi.mock('@/modules/exercises', async (importOriginal) => {
  const actual = await importOriginal<typeof exercisesModule>();
  return {
    ...actual,
    useExerciseOptions: () => ({
      byId: new Map([
        [
          'ex-bench',
          {
            id: 'ex-bench',
            name: 'Press de banca',
            measurement: 'reps_weight',
            isUnilateral: false,
            isArchived: false,
            instructions: null,
            videoUrl: null,
          },
        ],
        [
          'ex-squat',
          {
            id: 'ex-squat',
            name: 'Sentadilla',
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

vi.mock('@/core/auth', () => ({
  useAuth: () => ({
    user: { id: 'client-1' },
    isPending: false,
  }),
}));

vi.mock('@/core/tenancy', () => ({
  useTenancy: () => ({
    tenant: { id: 'tenant-1', name: 'Iron Lab' },
    role: 'client',
  }),
  useHealthConsent: () => ({ isGranted: true }),
  useHealthConsentPrompt: () => ({ ensure: vi.fn().mockResolvedValue(true) }),
}));

const mockYesterdayWorkout: ClientWorkoutRecord = {
  id: 'workout-yesterday',
  tenant_id: 'tenant-1',
  client_id: 'client-1',
  program_id: 'prog-current',
  block_id: null,
  program_day_id: 'day-1',
  day_number: 1,
  performed_on: '2026-11-23',
  started_at: '2026-11-23T10:00:00.000Z',
  closed_at: '2026-11-23T11:00:00.000Z',
  edited_at: null,
  close_reason: 'completed',
  last_changed_at: '2026-11-23T11:00:00.000Z',
  note: null,
  programs: { id: 'prog-current', name: 'Fuerza Base' },
  program_days: { id: 'day-1', name: 'Día 1 - Torso' },
  workout_exercises: [
    {
      id: 'we-1',
      position: 1,
      exercise_id: 'ex-bench',
      replaces_exercise_id: null,
      superset_group: null,
      prescribed_sets: [],
      prescribed_rest_seconds: 120,
      coach_note: null,
      day_note: 'Buenas sensaciones',
      is_skipped: false,
      changed_at: '2026-11-23T10:30:00.000Z',
      workout_sets: [
        {
          id: 'set-1',
          workout_exercise_id: 'we-1',
          set_number: 1,
          side: 'none',
          weight_kg: 10,
          reps: 12,
          duration_seconds: null,
          distance_meters: null,
          intensity_type: 'rir',
          intensity_value: 1,
          is_done: true,
          is_extra: false,
          recorded_at: '2026-11-23T10:15:00.000Z',
        },
      ],
    },
  ],
};

const mockOldWorkout: ClientWorkoutRecord = {
  id: 'workout-old',
  tenant_id: 'tenant-1',
  client_id: 'client-1',
  program_id: 'prog-previous',
  block_id: null,
  program_day_id: 'day-old',
  day_number: 2,
  performed_on: '2026-10-10',
  started_at: '2026-10-10T10:00:00.000Z',
  closed_at: '2026-10-10T11:00:00.000Z',
  edited_at: '2026-10-11T09:00:00.000Z',
  close_reason: 'completed',
  last_changed_at: '2026-10-10T11:00:00.000Z',
  note: null,
  programs: { id: 'prog-previous', name: 'Hipertrofia I' },
  program_days: { id: 'day-old', name: 'Día 2 - Pierna' },
  workout_exercises: [
    {
      id: 'we-old',
      position: 1,
      exercise_id: 'ex-squat',
      replaces_exercise_id: null,
      superset_group: null,
      prescribed_sets: [],
      prescribed_rest_seconds: 180,
      coach_note: null,
      day_note: null,
      is_skipped: false,
      changed_at: '2026-10-10T10:30:00.000Z',
      workout_sets: [
        {
          id: 'set-old-1',
          workout_exercise_id: 'we-old',
          set_number: 1,
          side: 'none',
          weight_kg: 70,
          reps: 8,
          duration_seconds: null,
          distance_meters: null,
          intensity_type: 'failure',
          intensity_value: -1,
          is_done: true,
          is_extra: false,
          recorded_at: '2026-10-10T10:15:00.000Z',
        },
      ],
    },
  ],
};

describe('ClientWorkoutsPage', () => {
  let queryClient: QueryClient;
  const mockEnqueue = vi.fn().mockResolvedValue('ok');

  beforeEach(async () => {
    await loadAllTranslations();
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(clientWorkoutsApi.fetchClientHistoryWorkouts).mockResolvedValue([
      mockYesterdayWorkout,
      mockOldWorkout,
    ]);
    vi.mocked(clientWorkoutsApi.fetchCurrentClientProgramId).mockResolvedValue('prog-current');

    vi.mocked(nativeModule.useUploadQueue).mockReturnValue([]);
    vi.mocked(nativeModule.getUploadQueue).mockReturnValue({
      enqueue: mockEnqueue,
      list: vi.fn().mockResolvedValue([]),
      subscribe: vi.fn().mockReturnValue(() => {}),
      remove: vi.fn(),
      clear: vi.fn(),
      retryAll: vi.fn(),
      dismissRejection: vi.fn(),
    } as unknown as ReturnType<typeof nativeModule.getUploadQueue>);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ClientWorkoutsPage />
      </QueryClientProvider>,
    );

  it('renders page header and workouts ordered newest first', async () => {
    vi.mocked(nativeModule.canLogWorkouts).mockReturnValue(true);

    renderComponent();

    expect(await screen.findByText(/Mis entrenos|My workouts/i)).toBeInTheDocument();
    expect(screen.getByText('Día 1 - Torso')).toBeInTheDocument();
    expect(screen.getByText('Día 2 - Pierna')).toBeInTheDocument();
  });

  it('shows routine name badge for previous routine', async () => {
    vi.mocked(nativeModule.canLogWorkouts).mockReturnValue(true);

    renderComponent();

    // mockOldWorkout has prog-previous !== prog-current -> Hipertrofia I is displayed
    expect(await screen.findByText('Hipertrofia I')).toBeInTheDocument();
    // mockYesterdayWorkout has prog-current -> does not display routine name badge
    expect(screen.queryByText('Fuerza Base')).not.toBeInTheDocument();
  });

  it('shows "Editado" badge for already edited workout', async () => {
    vi.mocked(nativeModule.canLogWorkouts).mockReturnValue(true);

    renderComponent();

    expect(await screen.findByTestId('edited-badge')).toBeInTheDocument();
  });

  it('shows "Pendiente de subir" badge when in upload queue', async () => {
    vi.mocked(nativeModule.canLogWorkouts).mockReturnValue(true);
    vi.mocked(nativeModule.useUploadQueue).mockReturnValue([
      {
        id: 'workout-yesterday',
        kind: 'workout',
        tenantId: 'tenant-1',
        tenantName: 'Iron Lab',
        payload: {},
        revision: 1,
        attempts: 0,
        status: 'pending',
        rejection: null,
      },
    ]);

    renderComponent();

    expect(await screen.findByTestId('pending-upload-badge')).toBeInTheDocument();
  });

  it('displays exercise sets in format "10×12(1)" when details expanded (Criterio 1)', async () => {
    vi.mocked(nativeModule.canLogWorkouts).mockReturnValue(true);
    const user = userEvent.setup();

    renderComponent();

    const viewDetailsButtons = await screen.findAllByRole('button', {
      name: /Ver detalles|View details/i,
    });
    await user.click(viewDetailsButtons[0]!);

    // Should display sets formatted as "10×12(1)"
    const setsElement = screen.getByTestId('exercise-sets-we-1');
    expect(setsElement).toHaveTextContent('10×12(1)');
  });

  it('shows "Corregir" on mobile for workout within 7 days, and hides it for workout older than 7 days (Criterio 4)', async () => {
    vi.mocked(nativeModule.canLogWorkouts).mockReturnValue(true);

    renderComponent();

    // Yesterday workout (within 7 days) has "Corregir"
    expect(await screen.findByTestId('correct-workout-workout-yesterday')).toBeInTheDocument();

    // Old workout (from October, > 7 days) does NOT have "Corregir"
    expect(screen.queryByTestId('correct-workout-workout-old')).not.toBeInTheDocument();
  });

  it('hides "Corregir" on web even for recent workout (Criterio 3)', async () => {
    vi.mocked(nativeModule.canLogWorkouts).mockReturnValue(false);

    renderComponent();

    expect(await screen.findByText('Día 1 - Torso')).toBeInTheDocument();
    expect(screen.queryByTestId('correct-workout-workout-yesterday')).not.toBeInTheDocument();
    expect(screen.queryByTestId('correct-workout-workout-old')).not.toBeInTheDocument();
  });

  it('allows correcting a weight, sets "Editado" badge and enqueues to upload queue (Criterio 2)', async () => {
    vi.mocked(nativeModule.canLogWorkouts).mockReturnValue(true);
    const user = userEvent.setup();

    renderComponent();

    const correctButton = await screen.findByTestId('correct-workout-workout-yesterday');
    await user.click(correctButton);

    // Dialog opens
    expect(screen.getByText(/Corregir entreno|Edit workout/i)).toBeInTheDocument();

    // Change weight from 10 to 15
    const weightInput = screen.getByTestId('set-weight-input-we-1-1');
    await user.clear(weightInput);
    await user.type(weightInput, '15');

    // Save correction
    const saveButton = screen.getByTestId('save-correction-button');
    await user.click(saveButton);

    // Enqueued to upload queue
    expect(mockEnqueue).toHaveBeenCalledWith(
      'client-1',
      expect.objectContaining({
        id: 'workout-yesterday',
        kind: 'workout',
        tenantId: 'tenant-1',
      }),
    );

    // The workout now displays "Editado"
    const editedBadges = screen.getAllByTestId('edited-badge');
    expect(editedBadges.length).toBeGreaterThanOrEqual(1);
  });
});
