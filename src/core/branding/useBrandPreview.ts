import { use, useEffect } from 'react';

import { BrandPreviewContext } from './brand-preview-context';
import type { Brand } from './brand-schema';

/**
 * Mientras la pantalla que lo usa está abierta, la app se pinta con `brand` (por
 * ejemplo, la vista previa de un coach). Al salir, vuelve la marca de siempre.
 */
export function useBrandPreview(brand: Brand | null): void {
  const setPreview = use(BrandPreviewContext);
  useEffect(() => {
    setPreview(brand);
    return () => setPreview(null);
  }, [brand, setPreview]);
}
