import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { SAMPLE_TENANTS, getSampleInitialRole } from './sample-tenancy';
import { TenancyContext } from './tenancy-context';
import type { TenancyContextValue } from './tenancy-context';
import { NO_TENANCY, profileForRole } from './tenancy-types';
import type { Role } from './tenancy-types';

interface TenancyProviderProps {
  children: ReactNode;
}

/**
 * Tenant activo y rol del usuario. En la Fase 0 salen de datos de ejemplo; en la
 * Fase 1 saldrán de la sesión y de la base de datos. Quien usa `useTenancy()` no
 * tendrá que cambiar.
 */
export function TenancyProvider({ children }: TenancyProviderProps) {
  const [tenantId, setTenantId] = useState<string | null>(SAMPLE_TENANTS[0].id);
  const [role, setRole] = useState<Role>(() => getSampleInitialRole(window.location.pathname));

  const value = useMemo<TenancyContextValue>(() => {
    const tenant = SAMPLE_TENANTS.find((candidate) => candidate.id === tenantId) ?? null;
    return {
      tenancy: tenant === null ? NO_TENANCY : { tenant, role, profile: profileForRole(role) },
      sampleControls: {
        tenants: SAMPLE_TENANTS,
        selectTenant: setTenantId,
        selectRole: (nextRole) => {
          setRole(nextRole);
          setTenantId((current) => current ?? SAMPLE_TENANTS[0].id);
        },
      },
    };
  }, [tenantId, role]);

  return <TenancyContext value={value}>{children}</TenancyContext>;
}
