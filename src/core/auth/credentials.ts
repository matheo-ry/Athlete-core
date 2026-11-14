import { z } from 'zod';

// Lo que se escribe en los formularios de cuenta es un dato de fuera: se valida
// con Zod antes de enviarlo (AGENTS.md §4). Cada error es una clave de texto.

export const PASSWORD_MIN_LENGTH = 8; // D-041
export const PASSWORD_MAX_LENGTH = 72; // D-041: el máximo que admite Supabase

const emailSchema = z.string().trim().min(1, 'required').pipe(z.email('invalid'));

export type EmailError = 'required' | 'invalid';

/** Devuelve el email limpio, o el motivo por el que no vale. */
export function checkEmail(
  value: string,
): { ok: true; email: string } | { ok: false; error: EmailError } {
  const result = emailSchema.safeParse(value);
  if (result.success) {
    return { ok: true, email: result.data.toLowerCase() };
  }
  return {
    ok: false,
    error: result.error.issues[0]?.message === 'required' ? 'required' : 'invalid',
  };
}
