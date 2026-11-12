import { logger } from '../lib';

import { brandSchema } from './brand-schema';
import type { Brand } from './brand-schema';
import { DEFAULT_BRAND } from './default-brand';

/**
 * Valida la marca que llega de la base de datos. Si no es válida, la app sigue
 * funcionando con la marca por defecto en vez de romperse.
 */
export function parseBrand(input: unknown): Brand {
  const result = brandSchema.safeParse(input);
  if (!result.success) {
    logger.warn('Invalid tenant branding, falling back to the default brand', {
      issues: result.error.issues.map((issue) => issue.path.join('.')),
    });
    return DEFAULT_BRAND;
  }
  return result.data;
}
