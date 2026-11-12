import { createContext } from 'react';

import type { Brand } from './brand-schema';
import { DEFAULT_BRAND } from './default-brand';

export const BrandContext = createContext<Brand>(DEFAULT_BRAND);
