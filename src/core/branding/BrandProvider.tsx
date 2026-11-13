import { useLayoutEffect } from 'react';
import type { ReactNode } from 'react';

import { useTenancy } from '../tenancy';

import { BrandContext } from './brand-context';
import { applyBrandToElement } from './brand-to-css-vars';
import { DEFAULT_BRAND } from './default-brand';

interface BrandProviderProps {
  children: ReactNode;
}

/**
 * Pinta la app con la marca del tenant activo. Sin tenant (antes de unirse a un
 * coach) se ve la marca por defecto de la plataforma.
 */
export function BrandProvider({ children }: BrandProviderProps) {
  const { tenant } = useTenancy();
  const brand = tenant?.branding ?? DEFAULT_BRAND;

  // `useLayoutEffect` y no `useEffect`: la marca se aplica ANTES de que el
  // navegador pinte, para que no se vea un destello con los colores anteriores.
  useLayoutEffect(() => {
    applyBrandToElement(brand, document.documentElement);
  }, [brand]);

  return <BrandContext value={brand}>{children}</BrandContext>;
}
