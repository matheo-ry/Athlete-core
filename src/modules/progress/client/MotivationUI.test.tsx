import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/core/auth';
import { i18n } from '@/core/i18n';
import { TenancyProvider } from '@/core/tenancy';
import { createFakeAuthService } from '@/test/fake-auth-service';
import { TEST_TENANTS, createFakeTenancySource } from '@/test/fake-tenancy-source';
import { loadAllTranslations } from '@/test/load-translations';

import type { RawWorkout } from '../model/exercise-history';
import { StreakCard } from './StreakCard';
import { AchievementsSection } from '../shared/AchievementsSection';
import { ProgressView } from '../shared/ProgressView';

const progressApi = vi.hoisted(() => ({
  fetchClientWorkouts: vi.fn<(tenantId: string, clientId: string) => Promise<RawWorkout[]>>(),
  fetchCurrentClientProgramId:
    vi.fn<(tenantId: string, clientId: string) => Promise<string | null>>(),
}));
vi.mock('../api/progress-api', () => progressApi);

const healthApi = vi.hoisted(() => ({ fetchClientHealthData: vi.fn() }));
vi.mock('@/modules/workouts/api/workouts-coach-api', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...healthApi,
}));

const exercisesApi = vi.hoisted(() => ({
  fetchExercises: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/modules/exercises/api/exercises-api', () => exercisesApi);

function mockWorkout(
  id: string,
  performedOn: string,
  startedAt = `${performedOn}T10:00:00Z`,
  closedAt = `${performedOn}T10:45:00Z`,
): RawWorkout {
  return {
    id,
    performed_on: performedOn,
    started_at: startedAt,
    closed_at: closedAt,
    day_number: 1,
    program_id: 'prog-1',
    programs: { id: 'prog-1', name: 'Casa + Gym' },
    workout_exercises: [
      {
        id: `we-${id}`,
        exercise_id: 'ex-bench',
        replaces_exercise_id: null,
        day_note: null,
        is_skipped: false,
        position: 1,
        workout_sets: [
          {
            id: `ws-${id}-1`,
            set_number: 1,
            side: 'none',
            weight_kg: 80,
            reps: 10,
            duration_seconds: null,
            distance_meters: null,
            intensity_type: 'rir',
            intensity_value: 1,
            is_done: true,
            recorded_at: startedAt,
          },
        ],
      },
    ],
  };
}

async function renderWithProviders(
  ui: React.ReactElement,
  options: { achievementsEnabled?: boolean } = {},
) {
  await loadAllTranslations();
  const email = 'client@example.test';
  const auth = createFakeAuthService({
    signedInAs: email,
    profiles: { [email]: { weightUnit: 'kg' } },
  });
  const tenancy = createFakeTenancySource({
    currentEmail: () => auth.currentUser?.email ?? null,
    initialSettings: {
      [TEST_TENANTS.iron.id]: {
        intensityScale: 'rir',
        achievementsEnabled: options.achievementsEnabled ?? true,
      },
    },
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider service={auth}>
          <TenancyProvider source={tenancy}>
            <MemoryRouter>{ui}</MemoryRouter>
          </TenancyProvider>
        </AuthProvider>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('Motivation & Achievements UI (PR 3.17, D-130)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    healthApi.fetchClientHealthData.mockResolvedValue({
      hasConsent: true,
      weights: [],
      measurements: [],
    });
    progressApi.fetchCurrentClientProgramId.mockResolvedValue('prog-1');
  });

  describe('StreakCard (Client Home)', () => {
    it('renders streak and week tracker with 7 days', async () => {
      progressApi.fetchClientWorkouts.mockResolvedValue([mockWorkout('w-1', '2026-11-23')]);

      await renderWithProviders(<StreakCard />);

      expect(await screen.findByTestId('week-tracker')).toBeInTheDocument();
      expect(screen.getByTestId('tracker-day-0')).toBeInTheDocument();
      expect(screen.getByTestId('tracker-day-6')).toBeInTheDocument();
      expect(screen.getByTestId('view-achievements-link')).toBeInTheDocument();
    });

    it('AC2: Ana completa los 4 días de su semana: su racha sube a 1 y tracker marca días hechos', async () => {
      progressApi.fetchClientWorkouts.mockResolvedValue([
        mockWorkout('w-1', '2026-11-23'),
        mockWorkout('w-2', '2026-11-24'),
        mockWorkout('w-3', '2026-11-25'),
        mockWorkout('w-4', '2026-11-26'),
      ]);

      await renderWithProviders(<StreakCard />);

      await screen.findByTestId('week-tracker');
      const count = screen.getByTestId('streak-count');
      expect(count).toHaveTextContent('1');
    });

    it('AC4: si el coach apaga los logros, StreakCard no se renderiza', async () => {
      progressApi.fetchClientWorkouts.mockResolvedValue([mockWorkout('w-1', '2026-11-23')]);

      await renderWithProviders(<StreakCard />, { achievementsEnabled: false });

      await waitFor(() => {
        expect(screen.queryByTestId('streak-card')).not.toBeInTheDocument();
      });
    });
  });

  describe('AchievementsSection & ProgressView', () => {
    it('AC3: tras el primer entreno: "Primer entreno" desbloqueado y nivel 1', async () => {
      const workouts = [mockWorkout('w-1', '2026-11-24')];

      await renderWithProviders(<AchievementsSection clientId="client-1" rawWorkouts={workouts} />);

      expect(await screen.findByTestId('level-title')).toHaveTextContent(/1/);

      const firstWorkoutAch = screen.getByTestId('achievement-first_workout');
      expect(firstWorkoutAch).toHaveAttribute('data-unlocked', 'true');

      const firstWeekAch = screen.getByTestId('achievement-first_full_week');
      expect(firstWeekAch).toHaveAttribute('data-unlocked', 'false');
    });

    it('renders all 18 achievements with locked and unlocked states', async () => {
      await renderWithProviders(<AchievementsSection clientId="client-1" rawWorkouts={[]} />);

      const section = await screen.findByTestId('achievements-section');
      expect(section).toBeInTheDocument();

      const achCount = screen.getByTestId('achievements-count');
      expect(achCount).toHaveTextContent(/0.*18|18/);
    });

    it('AC4: si el coach desactiva logros, ProgressView no enseña la pestaña de logros', async () => {
      await renderWithProviders(
        <ProgressView
          clientId="client-1"
          groups={[]}
          rawWorkouts={[]}
          isPending={false}
          isError={false}
          unit="kg"
        />,
        { achievementsEnabled: false },
      );

      await waitFor(() => {
        expect(screen.queryByTestId('tab-achievements')).not.toBeInTheDocument();
      });
    });

    it('si el coach tiene activados logros, ProgressView enseña la pestaña de logros', async () => {
      await renderWithProviders(
        <ProgressView
          clientId="client-1"
          groups={[]}
          rawWorkouts={[]}
          isPending={false}
          isError={false}
          unit="kg"
        />,
        { achievementsEnabled: true },
      );

      expect(await screen.findByTestId('tab-achievements')).toBeInTheDocument();
    });
  });
});
