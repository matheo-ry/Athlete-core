import { createContext } from 'react';

import type { Membership } from './membership';
import type { Tenancy } from './tenancy-types';

export interface TenancyContextValue {
  /** El espacio activo: negocio, rol y perfil. Sin espacio, todo `null`. */
  tenancy: Tenancy;
  /** Todos los espacios del usuario, también los dados de baja. */
  memberships: readonly Membership[];
  /** Entrar en otro espacio (lo usará el selector, PR 1.14). */
  selectTenant: (tenantId: string) => void;
  /** Vuelve a pedir los espacios (por ejemplo, después de unirse a un coach). */
  refresh: () => Promise<void>;
}

export const TenancyContext = createContext<TenancyContextValue | null>(null);
