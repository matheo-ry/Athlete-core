import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/core/auth';
import { i18n } from '@/core/i18n';
import { TenancyProvider } from '@/core/tenancy';
import { createFakeAuthService } from '@/test/fake-auth-service';
import { TEST_TENANTS, createFakeTenancySource } from '@/test/fake-tenancy-source';
import { loadAllTranslations } from '@/test/load-translations';

import type { ActiveExercise, ActiveSet, PreviousSetValues } from '../model/active-workout';
import { SetEditor } from './SetEditor';

const mockExercise: ActiveExercise = {
  id: 'we-1',
  exerciseId: 'ex-bench',
  programDayExerciseId: null,
  position: 1,
  measurement: 'weight_reps',
  isUnilateral: false,
  supersetGroup: null,
  restSeconds: null,
  coachNote: null,
  prescribedSets: [],
  isSkipped: false,
  replacesExerciseId: null,
  changedAt: '2026-11-24T10:00:00Z',
  sets: [],
};

async function renderSetEditor(options: {
  currentSet: ActiveSet;
  previous?: PreviousSetValues | null;
  achievementsEnabled?: boolean;
}) {
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
            <SetEditor
              exercise={mockExercise}
              sets={[options.currentSet]}
              previous={{ none: options.previous ?? null }}
              copySource={{ none: null }}
              onChange={vi.fn()}
              onCopy={vi.fn()}
              onUnmark={vi.fn()}
            />
          </TenancyProvider>
        </AuthProvider>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('SetEditor - Minilogros (PR 3.17, D-130)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AC1: Ana hizo la vez anterior 80x12; hoy apunta 80x13: aparece un minilogro', async () => {
    const previous: PreviousSetValues = {
      weightKg: 80,
      reps: 12,
      durationSeconds: null,
      distanceMeters: null,
      intensityType: 'rir',
      intensityValue: 1,
    };
    const currentSet: ActiveSet = {
      id: 's-1',
      setNumber: 1,
      side: 'none',
      weightKg: 80,
      reps: 13,
      durationSeconds: null,
      distanceMeters: null,
      intensityType: 'rir',
      intensityValue: 1,
      isDone: true,
      isExtra: false,
      recordedAt: '2026-11-24T10:15:00Z',
    };

    await renderSetEditor({ currentSet, previous, achievementsEnabled: true });

    const badge = await screen.findByTestId('minilogro-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/minilogro|mini-achievement/i);
  });

  it('no muestra minilogro si no mejoró (e.g. 80x12 -> 80x12)', async () => {
    const previous: PreviousSetValues = {
      weightKg: 80,
      reps: 12,
      durationSeconds: null,
      distanceMeters: null,
      intensityType: 'rir',
      intensityValue: 1,
    };
    const currentSet: ActiveSet = {
      id: 's-1',
      setNumber: 1,
      side: 'none',
      weightKg: 80,
      reps: 12,
      durationSeconds: null,
      distanceMeters: null,
      intensityType: 'rir',
      intensityValue: 1,
      isDone: true,
      isExtra: false,
      recordedAt: '2026-11-24T10:15:00Z',
    };

    await renderSetEditor({ currentSet, previous, achievementsEnabled: true });

    expect(screen.queryByTestId('minilogro-badge')).not.toBeInTheDocument();
  });

  it('AC4: si el coach desactiva los logros, Ana no ve el badge de minilogro', async () => {
    const previous: PreviousSetValues = {
      weightKg: 80,
      reps: 12,
      durationSeconds: null,
      distanceMeters: null,
      intensityType: 'rir',
      intensityValue: 1,
    };
    const currentSet: ActiveSet = {
      id: 's-1',
      setNumber: 1,
      side: 'none',
      weightKg: 80,
      reps: 13,
      durationSeconds: null,
      distanceMeters: null,
      intensityType: 'rir',
      intensityValue: 1,
      isDone: true,
      isExtra: false,
      recordedAt: '2026-11-24T10:15:00Z',
    };

    await renderSetEditor({ currentSet, previous, achievementsEnabled: false });

    await waitFor(() => {
      expect(screen.queryByTestId('minilogro-badge')).not.toBeInTheDocument();
    });
  });
});
