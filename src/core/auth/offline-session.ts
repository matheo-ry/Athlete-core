import { z } from 'zod';

import type { AuthUser } from './auth-types';

// Abrir la app sin conexión con la sesión ya iniciada (DECISIONES D-118).
//
// El token de acceso de Supabase dura una hora. Si al abrir la app ha caducado
// y no hay conexión para renovarlo, Supabase arranca "sin sesión", pero la deja
// guardada en el dispositivo: solo la borra si el servidor la rechaza. Mientras
// siga guardada, la app entra con ella para enseñar lo que ya tenía en el
// teléfono y dejar entrenar sin cobertura.
//
// No da acceso a nada nuevo: sin un token válido la base de datos no responde,
// y en cuanto vuelve la conexión Supabase renueva la sesión o la cierra (y
// entonces la app lleva a entrar otra vez).

const storedSessionSchema = z.object({
  refresh_token: z.string().min(1),
  user: z.object({ id: z.string().min(1), email: z.string().optional() }),
});

/** El usuario de la sesión guardada en el dispositivo, si la hay. */
export function storedSessionUser(raw: string | null): AuthUser | null {
  if (raw === null) {
    return null;
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = storedSessionSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }
  return { id: parsed.data.user.id, email: parsed.data.user.email ?? '' };
}
