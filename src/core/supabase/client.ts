import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import { env } from '../config';
import type { Database } from './database.types';

// Único cliente de Supabase de la app. Solo se importa desde carpetas `api/`
// (lo comprueba ESLint): los componentes nunca hablan con la base de datos.
//
// Usa SOLO la clave pública. La seguridad no depende de esta clave sino de las
// políticas RLS de la base de datos. La clave secreta de servicio nunca entra en src/.
//
// Va tipado con los tipos generados de la base de datos (`npm run db:types`):
// si una migración cambia una tabla, el código que la usa deja de compilar.

let client: SupabaseClient<Database> | null = null;

/** Se crea la primera vez que se pide. */
export function getSupabaseClient(): SupabaseClient<Database> {
  client ??= createClient<Database>(env.supabase.url, env.supabase.publishableKey, {
    auth: {
      // La sesión se guarda en el dispositivo y se renueva sola (D-045).
      persistSession: true,
      autoRefreshToken: true,
      // Los emails llevan un código, no un enlace (D-039): no hay nada que leer
      // de la dirección al abrir la app.
      detectSessionInUrl: false,
      storageKey: 'athlete-core.auth',
    },
  });
  return client;
}
