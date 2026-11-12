import { createContext } from 'react';

import type { Role, Tenancy, Tenant } from './tenancy-types';

/** Solo para el selector de desarrollo (Fase 0). Desaparece con los datos reales. */
export interface SampleTenancyControls {
  tenants: readonly Tenant[];
  selectTenant: (tenantId: string) => void;
  selectRole: (role: Role) => void;
}

export interface TenancyContextValue {
  tenancy: Tenancy;
  sampleControls: SampleTenancyControls;
}

export const TenancyContext = createContext<TenancyContextValue | null>(null);
