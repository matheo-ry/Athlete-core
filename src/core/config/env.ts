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
  // Opcional: la dirección pública de la web, para los enlaces de invitación
  // (/join?code=…). Sin ella se usa la dirección desde la que se ve la app.
  VITE_PUBLIC_APP_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  // Solo para desarrollo y tests: deja registrar entrenos en el navegador, que
  // normalmente solo se puede en la app del móvil (DECISIONES D-116).
  VITE_ALLOW_WEB_WORKOUTS: z.preprocess(
    emptyToUndefined,
    z.enum(['true', 'false']).default('false'),
  ),
  // Lo pone Vite: `true` en cualquier `vite build` (la web publicada o la app).
  PROD: z.boolean().default(false),
});

export interface SupabaseEnv {
  url: string;
  publishableKey: string;
}

export interface AppEnv {
  appEnv: 'local' | 'staging' | 'production';
  supabase: SupabaseEnv;
  /** Sin la barra final. `null` si no se ha configurado. */
  publicAppUrl: string | null;
  /**
   * Si el navegador puede registrar entrenos. Nunca en un build de producción,
   * aunque la variable esté puesta. Quién decide de verdad es `core/native`.
   */
  allowWebWorkouts: boolean;
}

export function parseEnv(raw: unknown): AppEnv {
  const result = rawEnvSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables (copy .env.example to .env.local and fill it in): ${z.prettifyError(result.error)}`,
    );
  }

  const data = result.data;
  return {
    appEnv: data.VITE_APP_ENV,
    supabase: { url: data.VITE_SUPABASE_URL, publishableKey: data.VITE_SUPABASE_PUBLISHABLE_KEY },
    publicAppUrl: data.VITE_PUBLIC_APP_URL?.replace(/\/+$/, '') ?? null,
    // Un `.env.local` con la variable puesta no debe colarse en lo que se publica.
    allowWebWorkouts: data.VITE_ALLOW_WEB_WORKOUTS === 'true' && !data.PROD,
  };
}

export const env: AppEnv = parseEnv(import.meta.env);
