import { createContext } from 'react';

import type { Role, Tenancy, Tenant } from './tenancy-types';

/** Solo para el selector de desarrollo (Fase 0). Desaparece con los datos reales. */
export interface SampleTenancyControls {
  tenants: readonly Tenant[];
  /** `null` simula a un usuario que todavía no pertenece a ningún tenant. */
  selectTenant: (tenantId: string | null) => void;
  /** Si no había tenant, entra en el primero de ejemplo. */
  selectRole: (role: Role) => void;
}

export interface TenancyContextValue {
  tenancy: Tenancy;
  sampleControls: SampleTenancyControls;
}

export const TenancyContext = createContext<TenancyContextValue | null>(null);
