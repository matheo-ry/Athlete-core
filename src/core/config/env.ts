import { z } from 'zod';

// Las variables de entorno son un dato que "entra de fuera": se validan aquí, una
// sola vez, y el resto de la app usa `env` ya tipado. Los nombres están en
// `.env.example`; los valores, en `.env.local` (que no se sube a Git).

// Un valor vacío en el archivo (`VITE_X=`) llega como '' y significa "sin definir".
const emptyToUndefined = (value: unknown): unknown => (value === '' ? undefined : value);

const rawEnvSchema = z.object({
  VITE_APP_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['local', 'staging', 'production']).default('local'),
  ),
  // Obligatorias desde la Fase 1 (DECISIONES D-025): sin base de datos no hay app.
  VITE_SUPABASE_URL: z.preprocess(emptyToUndefined, z.url()),
  // Clave PÚBLICA de Supabase (publishable / anon). La clave secreta de servicio nunca entra aquí.
  VITE_SUPABASE_PUBLISHABLE_KEY: z.preprocess(emptyToUndefined, z.string().min(1)),
});

export interface SupabaseEnv {
  url: string;
  publishableKey: string;
}

export interface AppEnv {
  appEnv: 'local' | 'staging' | 'production';
  supabase: SupabaseEnv;
}

export function parseEnv(raw: unknown): AppEnv {
  const result = rawEnvSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables (copy .env.example to .env.local and fill it in): ${z.prettifyError(result.error)}`,
    );
  }

  const { VITE_APP_ENV, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = result.data;
  return {
    appEnv: VITE_APP_ENV,
    supabase: { url: VITE_SUPABASE_URL, publishableKey: VITE_SUPABASE_PUBLISHABLE_KEY },
  };
}

export const env: AppEnv = parseEnv(import.meta.env);
