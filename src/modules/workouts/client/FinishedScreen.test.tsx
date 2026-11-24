import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/core/auth';
import { i18n } from '@/core/i18n';
import { TenancyProvider } from '@/core/tenancy';
import type * as TenancyModule from '@/core/tenancy';
import { createFakeAuthService } from '@/test/fake-auth-service';
import { TEST_TENANTS, createFakeTenancySource } from '@/test/fake-tenancy-source';
import { loadAllTranslations } from '@/test/load-translations';

import type { ActiveWorkout } from '../model/active-workout';
import { FinishedScreen } from './FinishedScreen';

const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
vi.mock('../api/useActiveWorkout', () => ({
  useSaveActiveWorkout: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock('../api/useWorkoutMiniAchievements', () => ({
  useWorkoutMiniAchievements: () => 0,
}));

const mockEnsure = vi.fn().mockResolvedValue(true);
let mockIsGranted = true;
vi.mock('@/core/tenancy', async (importOriginal) => {
  const actual = await importOriginal<typeof TenancyModule>();
  return {
    ...actual,
    useHealthConsent: () => ({ isGranted: mockIsGranted }),
    useHealthConsentPrompt: () => ({ ensure: mockEnsure }),
  };
});

function makeClosedWorkout(overrides?: Partial<ActiveWorkout>): ActiveWorkout {
  return {
    id: 'w-finished',
    tenantId: TEST_TENANTS.iron.id,
    programId: 'prog-1',
    blockId: null,
    programDayId: null,
    dayNumber: 1,
    startedAt: '2026-11-24T10:00:00.000Z',
    lastChangedAt: '2026-11-24T10:45:00.000Z',
    closedAt: '2026-11-24T10:45:00.000Z',
    closeReason: 'completed',
    deviceSince: null,
    lastExercise: 1,
    note: null,
    exercises: [
      {
        id: 'we-1',
        position: 1,
        exerciseId: 'ex-1',
        programDayExerciseId: null,
        measurement: 'weight_reps',
        isUnilateral: false,
        supersetGroup: null,
        restSeconds: null,
        coachNote: null,
        dayNote: null,
        prescribedSets: [],
        isSkipped: false,
        replacesExerciseId: null,
        changedAt: '2026-11-24T10:00:00.000Z',
        sets: [
          {
            id: 's-1',
            setNumber: 1,
            side: 'none',
            weightKg: 80,
            reps: 8,
            durationSeconds: null,
            distanceMeters: null,
            intensityType: 'rir',
            intensityValue: 2,
            isDone: true,
            isExtra: false,
            recordedAt: '2026-11-24T10:15:00.000Z',
          },
        ],
      },
    ],
    ...overrides,
  };
}

async function renderFinished(workout: ActiveWorkout) {
  await loadAllTranslations();
  const email = 'client@example.test';
  const auth = createFakeAuthService({ signedInAs: email });
  const tenancy = createFakeTenancySource({
    currentEmail: () => auth.currentUser?.email ?? null,
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider service={auth}>
            <TenancyProvider source={tenancy}>
              <FinishedScreen workout={workout} />
            </TenancyProvider>
          </AuthProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('FinishedScreen · nota final del entreno (PR 3.10b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsGranted = true;
    mockEnsure.mockResolvedValue(true);
  });

  it('muestra la nota final automáticamente al terminar y permite saltarla', async () => {
    await renderFinished(makeClosedWorkout({ closeReason: 'manual' }));
    expect(screen.getByTestId('finished-workout-note')).toBeInTheDocument();

    const skipButton = screen.getByRole('button', { name: /saltar|skip/i });
    fireEvent.click(skipButton);

    expect(screen.queryByTestId('finished-workout-note')).not.toBeInTheDocument();
  });

  it('guarda la nota final cuando el cliente tiene consentimiento', async () => {
    await renderFinished(makeClosedWorkout({ closeReason: 'completed' }));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Muy buenas sensaciones hoy' } });

    const saveButton = screen.getByRole('button', { name: /guardar nota|save note/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'w-finished',
          note: 'Muy buenas sensaciones hoy',
        }),
      );
    });
  });

  it('pide consentimiento de salud si no está concedido y no guarda si se rechaza', async () => {
    mockIsGranted = false;
    mockEnsure.mockResolvedValue(false);

    await renderFinished(makeClosedWorkout());
    expect(screen.getByText(/consentimiento|consent/i)).toBeInTheDocument();

    const textarea = screen.getByRole('textbox');
    fireEvent.focus(textarea);

    await waitFor(() => {
      expect(mockEnsure).toHaveBeenCalled();
    });

    fireEvent.change(textarea, { target: { value: 'Nota sin permiso' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar nota|save note/i }));

    await waitFor(() => {
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });
});
