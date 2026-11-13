import { QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { BrandProvider } from '@/core/branding';
import { FlagsProvider } from '@/core/flags';
import { i18n } from '@/core/i18n';
import { TenancyProvider } from '@/core/tenancy';

import { createQueryClient } from './query-client';

interface AppProvidersProps {
  children: ReactNode;
  /** Solo para tests: un cliente propio, sin caché compartida ni reintentos. */
  queryClient?: QueryClient;
}

/**
 * Proveedores globales, de fuera hacia dentro: datos del servidor, idioma,
 * tenant, flags y marca. El orden importa: la marca y los flags dependen del
 * tenant activo. La sesión (core/auth) se añadirá en la Fase 1.
 */
export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient());

  return (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <TenancyProvider>
          <FlagsProvider>
            <BrandProvider>{children}</BrandProvider>
          </FlagsProvider>
        </TenancyProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
