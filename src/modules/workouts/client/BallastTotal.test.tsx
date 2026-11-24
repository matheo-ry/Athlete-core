import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/core/auth';
import { i18n } from '@/core/i18n';
import { TenancyProvider } from '@/core/tenancy';
import type { HealthConsentState } from '@/core/tenancy';
import { createFakeAuthService } from '@/test/fake-auth-service';
import { createFakeTenancySource } from '@/test/fake-tenancy-source';
import { loadAllTranslations } from '@/test/load-translations';

import type { ClientHealthData } from '../api/workouts-coach-api';
import { BallastTotal } from './BallastTotal';

// "Lastre 10 · Total 95 kg" (PR 3.9b, D-126, D-127): solo con consentimiento y peso apuntado.
const remote = vi.hoisted(() => ({ fetchClientHealthData: vi.fn() }));
vi.mock('../api/workouts-coach-api', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...remote,
}));

const GRANTED: HealthConsentState = {
  status: 'granted',
  grantedAt: '2026-11-16T10:00:00Z',
  textVersion: '2026-11-draft',
};
const WITH_WEIGHT: ClientHealthData = {
  hasConsent: true,
  weights: [
    { id: '00000000-0000-4000-8000-000000000001', measured_on: '2026-11-01', weight_kg: 86 },
    { id: '00000000-0000-4000-8000-000000000002', measured_on: '2026-11-16', weight_kg: 85 },
  ],
  measurements: [],
};

async function renderBallast(options: {
  consent: HealthConsentState;
  data: ClientHealthData;
  ballastKg?: number | null;
  isReference?: boolean;
  weightUnit?: 'kg' | 'lb';
}) {
  await loadAllTranslations();
  remote.fetchClientHealthData.mockResolvedValue(options.data);
  const email = 'client@example.test';
  const auth = createFakeAuthService({
    signedInAs: email,
    profiles: { [email]: { weightUnit: options.weightUnit ?? 'kg' } },
  });
  const tenancy = createFakeTenancySource({
    currentEmail: () => auth.currentUser?.email ?? null,
    initialHealthConsent: options.consent,
  });
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <I18nextProvider i18n={i18n}>
        <AuthProvider service={auth}>
          <TenancyProvider source={tenancy}>
            <BallastTotal
              ballastKg={options.ballastKg === undefined ? 10 : options.ballastKg}
              isReference={options.isReference ?? false}
            />
          </TenancyProvider>
        </AuthProvider>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BallastTotal', () => {
  it('Criterio 2: con consentimiento y peso apuntado, enseña el lastre y el total', async () => {
    await renderBallast({ consent: GRANTED, data: WITH_WEIGHT });
    expect(await screen.findByTestId('ballast-total')).toHaveTextContent(
      'Added load 10 · Total 95 kg',
    );
  });

  it('usa el último peso apuntado, no el primero', async () => {
    await renderBallast({ consent: GRANTED, data: WITH_WEIGHT, ballastKg: 0 });
    expect(await screen.findByTestId('ballast-total')).toHaveTextContent(
      'Added load 0 · Total 85 kg',
    );
  });

  it('en libras, enseña el lastre y el total en libras', async () => {
    await renderBallast({ consent: GRANTED, data: WITH_WEIGHT, weightUnit: 'lb' });
    // 10 kg = 22 lb; 95 kg = 209.4 lb.
    expect(await screen.findByTestId('ballast-total')).toHaveTextContent(
      'Added load 22 · Total 209.4 lb',
    );
  });

  it('sin consentimiento no suma el peso: solo queda el lastre del campo', async () => {
    await renderBallast({ consent: { status: 'none' }, data: WITH_WEIGHT });
    await waitFor(() => {
      expect(remote.fetchClientHealthData).not.toHaveBeenCalled();
    });
    expect(screen.queryByTestId('ballast-total')).toBeNull();
  });

  it('con el consentimiento retirado, tampoco', async () => {
    await renderBallast({
      consent: { status: 'withdrawn', withdrawnAt: '2026-11-17T10:00:00Z' },
      data: WITH_WEIGHT,
    });
    await waitFor(() => {
      expect(remote.fetchClientHealthData).not.toHaveBeenCalled();
    });
    expect(screen.queryByTestId('ballast-total')).toBeNull();
  });

  it('sin peso apuntado no hay total', async () => {
    await renderBallast({
      consent: GRANTED,
      data: { hasConsent: true, weights: [], measurements: [] },
    });
    await waitFor(() => {
      expect(remote.fetchClientHealthData).toHaveBeenCalled();
    });
    expect(screen.queryByTestId('ballast-total')).toBeNull();
  });

  it('sin lastre (ni gris ni apuntado) no hay nada que sumar', async () => {
    await renderBallast({ consent: GRANTED, data: WITH_WEIGHT, ballastKg: null });
    await waitFor(() => {
      expect(remote.fetchClientHealthData).toHaveBeenCalled();
    });
    expect(screen.queryByTestId('ballast-total')).toBeNull();
  });

  it('con lo gris (aún sin apuntar) sale atenuado', async () => {
    await renderBallast({ consent: GRANTED, data: WITH_WEIGHT, isReference: true });
    expect(await screen.findByTestId('ballast-total')).toHaveClass('text-muted');
  });
});
