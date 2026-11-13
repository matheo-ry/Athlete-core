import { use } from 'react';

import { BrandContext } from './brand-context';
import type { Brand } from './brand-schema';

/** La marca que se está mostrando: la del coach o la de la plataforma. */
export function useBrand(): Brand {
  return use(BrandContext);
}
