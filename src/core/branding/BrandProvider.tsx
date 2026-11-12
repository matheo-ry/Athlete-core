import { useEffect } from 'react';
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

  useEffect(() => {
    applyBrandToElement(brand, document.documentElement);
  }, [brand]);

  return <BrandContext value={brand}>{children}</BrandContext>;
}
