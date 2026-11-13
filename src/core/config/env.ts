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
  // Opcionales en la Fase 0: todavía no hay base de datos. En la Fase 1 pasan a
  // ser obligatorias.
  VITE_SUPABASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  // Clave PÚBLICA de Supabase (publishable / anon). La clave secreta de servicio nunca entra aquí.
  VITE_SUPABASE_PUBLISHABLE_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export interface SupabaseEnv {
  url: string;
  publishableKey: string;
}

export interface AppEnv {
  appEnv: 'local' | 'staging' | 'production';
  /** `null` mientras no se configuren las dos variables de Supabase. */
  supabase: SupabaseEnv | null;
}

export function parseEnv(raw: unknown): AppEnv {
  const result = rawEnvSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid environment variables: ${z.prettifyError(result.error)}`);
  }

  const { VITE_APP_ENV, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = result.data;
  const hasUrl = VITE_SUPABASE_URL !== undefined;
  const hasKey = VITE_SUPABASE_PUBLISHABLE_KEY !== undefined;

  if (hasUrl !== hasKey) {
    throw new Error(
      'Invalid environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set together',
    );
  }

  return {
    appEnv: VITE_APP_ENV,
    supabase:
      hasUrl && hasKey
        ? { url: VITE_SUPABASE_URL, publishableKey: VITE_SUPABASE_PUBLISHABLE_KEY }
        : null,
  };
}

export const env: AppEnv = parseEnv(import.meta.env);
