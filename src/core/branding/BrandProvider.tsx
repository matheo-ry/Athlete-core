import { useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { useTenancy } from '../tenancy';

import { BrandContext } from './brand-context';
import { BrandPreviewContext } from './brand-preview-context';
import type { Brand } from './brand-schema';
import { applyBrandToElement } from './brand-to-css-vars';
import { DEFAULT_BRAND } from './default-brand';

interface BrandProviderProps {
  children: ReactNode;
}

/**
 * Pinta la app con la marca que toca (ARQUITECTURA §10, DECISIONES D-057):
 * 1. la de una vista previa abierta (el coach de un código),
 * 2. si no, la del tenant activo,
 * 3. si no hay ninguna, la de la plataforma.
 */
export function BrandProvider({ children }: BrandProviderProps) {
  const { tenant } = useTenancy();
  const [preview, setPreview] = useState<Brand | null>(null);
  const brand = preview ?? tenant?.branding ?? DEFAULT_BRAND;

  // `useLayoutEffect` y no `useEffect`: la marca se aplica ANTES de que el
  // navegador pinte, para que no se vea un destello con los colores anteriores.
  useLayoutEffect(() => {
    applyBrandToElement(brand, document.documentElement);
  }, [brand]);

  return (
    <BrandPreviewContext value={setPreview}>
      <BrandContext value={brand}>{children}</BrandContext>
    </BrandPreviewContext>
  );
}
