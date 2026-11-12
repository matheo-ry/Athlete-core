import { use } from 'react';

import { TenancyContext } from './tenancy-context';
import type { TenancyContextValue } from './tenancy-context';
import type { Tenancy } from './tenancy-types';

export function useTenancyContext(): TenancyContextValue {
  const value = use(TenancyContext);
  if (value === null) {
    throw new Error('useTenancy must be used inside <TenancyProvider>');
  }
  return value;
}

/** Tenant activo, rol del usuario y perfil (coach o cliente) que le corresponde. */
export function useTenancy(): Tenancy {
  return useTenancyContext().tenancy;
}
