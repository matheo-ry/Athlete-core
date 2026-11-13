import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import { env } from '../config';

// Único cliente de Supabase de la app. Solo se importa desde carpetas `api/`
// (lo comprueba ESLint): los componentes nunca hablan con la base de datos.
//
// Usa SOLO la clave pública. La seguridad no depende de esta clave sino de las
// políticas RLS de la base de datos. La clave secreta de servicio nunca entra en src/.
//
// En la Fase 1, al generar los tipos (`npm run db:types`), el cliente pasará a
// ser `SupabaseClient<Database>`.

let client: SupabaseClient | null = null;

/** `false` mientras `.env.local` no tenga las dos variables de Supabase (Fase 0). */
export function isSupabaseConfigured(): boolean {
  return env.supabase !== null;
}

/** Se crea la primera vez que se pide, para que la app arranque sin Supabase en la Fase 0. */
export function getSupabaseClient(): SupabaseClient {
  if (env.supabase === null) {
    throw new Error(
      'Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local',
    );
  }
  client ??= createClient(env.supabase.url, env.supabase.publishableKey);
  return client;
}
