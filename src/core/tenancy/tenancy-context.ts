import { createContext } from 'react';

import type { HomePath, Membership, TenancySource } from './membership';
import type { Tenancy } from './tenancy-types';

/** 'loading' mientras se piden los espacios; 'error' si no se pudieron pedir. */
export type TenancyStatus = 'loading' | 'ready' | 'error';

export interface TenancyContextValue {
  /** El espacio activo: negocio, rol y perfil. Sin espacio, todo `null`. */
  tenancy: Tenancy;
  /** Todos los espacios del usuario, también los dados de baja. */
  memberships: readonly Membership[];
  status: TenancyStatus;
  /** La pantalla de inicio que le toca: su zona, el selector o la bienvenida (D-056). */
  homePath: HomePath;
  /** Entrar en otro espacio. Se recuerda en el dispositivo hasta cerrar sesión (D-066). */
  selectTenant: (tenantId: string) => void;
  /** Vuelve a pedir los espacios (por ejemplo, después de unirse a un coach). */
  refresh: () => Promise<void>;
  /** De dónde salen los datos (para los hooks de unirse con código). */
  source: TenancySource;
}

export const TenancyContext = createContext<TenancyContextValue | null>(null);
