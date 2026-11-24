import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/core/auth';
import { i18n } from '@/core/i18n';
import { createFakeAuthService } from '@/test/fake-auth-service';
import { loadAllTranslations } from '@/test/load-translations';

import type { ActiveExercise } from '../model/active-workout';
import type { PreviousPerformance } from '../model/offline-snapshot';
import { WarmupSection } from './WarmupSection';

function makeExercise(warmupsCount = 0): ActiveExercise {
  const warmups = Array.from({ length: warmupsCount }, (_, index) => ({
    id: `w-${index + 1}`,
    setNumber: index + 1,
    side: 'none' as const,
    weightKg: 20,
    reps: 10,
    durationSeconds: null,
    distanceMeters: null,
    intensityType: null,
    intensityValue: null,
    isDone: false,
    isExtra: false,
    isWarmup: true,
    recordedAt: null,
  }));
  return {
    id: 'we-1',
    position: 1,
    exerciseId: 'ex-1',
    programDayExerciseId: null,
    measurement: 'weight_reps',
    isUnilateral: true,
    supersetGroup: null,
    restSeconds: 120,
    coachNote: null,
    dayNote: null,
    prescribedSets: [],
    isSkipped: false,
    replacesExerciseId: null,
    changedAt: '2026-11-25T10:00:00Z',
    sets: warmups,
  };
}

async function renderWarmup(
  exercise: ActiveExercise,
  enabled: boolean,
  previous: PreviousPerformance | null = null,
) {
  await loadAllTranslations();
  const auth = createFakeAuthService({ signedInAs: 'client@example.test' });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onAdd = vi.fn();
  const onChange = vi.fn();
  const onCopy = vi.fn();
  const onRemove = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider service={auth}>
          <WarmupSection
            exercise={exercise}
            previous={previous}
            enabled={enabled}
            onAdd={onAdd}
            onChange={onChange}
            onCopy={onCopy}
            onRemove={onRemove}
          />
        </AuthProvider>
      </I18nextProvider>
    </QueryClientProvider>,
  );

  return { onAdd, onChange, onCopy, onRemove };
}

describe('WarmupSection (PR 3.19, D-ideas-2)', () => {
  it('no se muestra cuando el interruptor está apagado y no hay series previas', async () => {
    await renderWarmup(makeExercise(0), false);
    expect(screen.queryByTestId('warmup-section')).not.toBeInTheDocument();
  });

  it('muestra "+ Calentamiento" cuando está encendido', async () => {
    const { onAdd } = await renderWarmup(makeExercise(0), true);
    const addButton = screen.getByTestId('add-warmup-button');
    fireEvent.click(addButton);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('oculta el botón "+ Calentamiento" al llegar al máximo de 5', async () => {
    await renderWarmup(makeExercise(5), true);
    expect(screen.queryByTestId('add-warmup-button')).not.toBeInTheDocument();
  });

  it('muestra la referencia anterior, permite copiarla con Igual y quitar la serie', async () => {
    const previous: PreviousPerformance = {
      exerciseId: 'ex-1',
      programId: 'p-1',
      dayNumber: 1,
      performedOn: '2026-11-18',
      changedAt: '2026-11-18T10:00:00Z',
      sets: [
        {
          setNumber: 1,
          side: 'none',
          isWarmup: true,
          weightKg: 25,
          reps: 12,
          durationSeconds: null,
          distanceMeters: null,
          intensityType: null,
          intensityValue: null,
        },
      ],
    };
    const { onCopy, onRemove } = await renderWarmup(makeExercise(1), true, previous);
    expect(screen.getByText(/25 × 12/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /igual|same/i }));
    expect(onCopy).toHaveBeenCalledWith(1, expect.objectContaining({ weightKg: 25, reps: 12 }));

    fireEvent.click(screen.getByRole('button', { name: /quitar|remove/i }));
    expect(onRemove).toHaveBeenCalledWith(1);
  });
});
