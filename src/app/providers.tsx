import { QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { AuthProvider, ProfileLanguageSync, createSupabaseAuthService } from '@/core/auth';
import type { AuthService } from '@/core/auth';
import { BrandProvider } from '@/core/branding';
import { FlagsProvider } from '@/core/flags';
import type { FlagsSource } from '@/core/flags';
import { i18n } from '@/core/i18n';
import { TenancyProvider } from '@/core/tenancy';
import type { TenancySource } from '@/core/tenancy';

import { createQueryClient } from './query-client';

interface AppProvidersProps {
  children: ReactNode;
  /** Solo para tests: un cliente propio, sin caché compartida ni reintentos. */
  queryClient?: QueryClient;
  /** Solo para tests: una sesión falsa, sin Supabase. */
  authService?: AuthService;
  /** Solo para tests: espacios falsos, sin Supabase. */
  tenancySource?: TenancySource;
  /** Solo para tests: flags falsos, sin Supabase. */
  flagsSource?: FlagsSource;
}

/**
 * Proveedores globales, de fuera hacia dentro: datos del servidor, idioma,
 * sesión, tenant, flags y marca. El orden importa: el tenant depende de la
 * sesión, y la marca y los flags dependen del tenant activo.
 */
export function AppProviders({
  children,
  queryClient,
  authService,
  tenancySource,
  flagsSource,
}: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  const [service] = useState(() => authService ?? createSupabaseAuthService());

  return (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider service={service}>
          {/* El idioma de la app y el del perfil, a la par (D-058). */}
          <ProfileLanguageSync />
          <TenancyProvider source={tenancySource}>
            <FlagsProvider source={flagsSource}>
              <BrandProvider>{children}</BrandProvider>
            </FlagsProvider>
          </TenancyProvider>
        </AuthProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
