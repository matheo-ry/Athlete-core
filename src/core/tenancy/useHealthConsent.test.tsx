import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { AuthProvider } from '../auth';
import { createFakeAuthService } from '@/test/fake-auth-service';
import { TEST_TENANTS, createFakeTenancySource } from '@/test/fake-tenancy-source';

import { TenancyProvider } from './TenancyProvider';
import { healthDataQueryKey, useHealthConsent } from './useHealthConsent';

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const auth = createFakeAuthService({ signedInAs: 'client@example.test' });
  const tenancy = createFakeTenancySource({
    currentEmail: () => auth.currentUser?.email ?? null,
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider service={auth}>
        <TenancyProvider source={tenancy}>{children}</TenancyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('retirar el consentimiento (D-126)', () => {
  it('vacía de la caché los datos de salud de ese espacio, y solo de ese', async () => {
    const { queryClient, wrapper } = setup();
    const iron = healthDataQueryKey(TEST_TENANTS.iron.id, 'workouts', 'client-health', 'user');
    const norte = healthDataQueryKey(TEST_TENANTS.norte.id, 'workouts', 'client-health', 'user');
    queryClient.setQueryData(iron, { weights: [85] });
    queryClient.setQueryData(norte, { weights: [70] });

    const { result } = renderHook(() => useHealthConsent(), { wrapper });
    await waitFor(() => {
      expect(result.current.isGranted).toBe(true);
    });

    await expect(result.current.withdraw()).resolves.toBe('ok');

    expect(queryClient.getQueryData(iron)).toBeUndefined();
    expect(queryClient.getQueryData(norte)).toEqual({ weights: [70] });
  });
});
