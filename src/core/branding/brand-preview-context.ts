import { createContext } from 'react';

import type { Brand } from './brand-schema';

/**
 * Para pintar la app con una marca que todavía no es la del usuario: la del
 * coach de un código, en su vista previa (D-051 y D-057).
 */
export const BrandPreviewContext = createContext<(brand: Brand | null) => void>(() => undefined);
