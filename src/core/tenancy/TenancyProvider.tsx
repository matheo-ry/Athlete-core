import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { SAMPLE_INITIAL_ROLE, SAMPLE_TENANTS } from './sample-tenancy';
import { TenancyContext } from './tenancy-context';
import type { TenancyContextValue } from './tenancy-context';
import { profileForRole } from './tenancy-types';
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
  const [tenantId, setTenantId] = useState(SAMPLE_TENANTS[0].id);
  const [role, setRole] = useState<Role>(SAMPLE_INITIAL_ROLE);

  const value = useMemo<TenancyContextValue>(() => {
    const tenant = SAMPLE_TENANTS.find((candidate) => candidate.id === tenantId) ?? null;
    return {
      tenancy: { tenant, role, profile: profileForRole(role) },
      sampleControls: {
        tenants: SAMPLE_TENANTS,
        selectTenant: setTenantId,
        selectRole: setRole,
      },
    };
  }, [tenantId, role]);

  return <TenancyContext value={value}>{children}</TenancyContext>;
}
