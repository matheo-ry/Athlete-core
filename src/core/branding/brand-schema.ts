import { z } from 'zod';

// Forma de `tenants.branding` (ARQUITECTURA §10). Lo edita el coach, así que es un
// dato que entra de fuera: se valida siempre antes de usarlo.

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a color like #1E5BD8');

export const brandSchema = z.object({
  appName: z.string().trim().min(1).max(40),
  logoPath: z.string().min(1).nullable(),
  colors: z.object({
    primary: hexColorSchema,
    accent: hexColorSchema,
  }),
  mode: z.enum(['light', 'dark']),
});

export type Brand = z.infer<typeof brandSchema>;

export type BrandMode = Brand['mode'];
