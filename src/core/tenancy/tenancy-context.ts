import { createContext } from 'react';

import type { Membership, TenancySource } from './membership';
import type { Tenancy } from './tenancy-types';

/** 'loading' mientras se piden los espacios; 'error' si no se pudieron pedir. */
export type TenancyStatus = 'loading' | 'ready' | 'error';

export interface TenancyContextValue {
  /** El espacio activo: negocio, rol y perfil. Sin espacio, todo `null`. */
  tenancy: Tenancy;
  /** Todos los espacios del usuario, también los dados de baja. */
  memberships: readonly Membership[];
  status: TenancyStatus;
  /** Entrar en otro espacio (lo usará el selector, PR 1.14). */
  selectTenant: (tenantId: string) => void;
  /** Vuelve a pedir los espacios (por ejemplo, después de unirse a un coach). */
  refresh: () => Promise<void>;
  /** De dónde salen los datos (para los hooks de unirse con código). */
  source: TenancySource;
}

export const TenancyContext = createContext<TenancyContextValue | null>(null);
