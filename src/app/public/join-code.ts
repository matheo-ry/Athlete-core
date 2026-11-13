import { z } from 'zod';

// El código puede llegar en un enlace (`/join?code=XXXX`): es un dato de fuera y
// se valida antes de ponerlo en el formulario. El formato definitivo lo fijará
// la Fase 1 junto con `tenant_invites`.
const joinCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9]{4,16}$/);

/** Devuelve el código en mayúsculas, o '' si no hay código o no tiene un formato válido. */
export function parseJoinCode(value: string | null): string {
  const result = joinCodeSchema.safeParse(value);
  return result.success ? result.data.toUpperCase() : '';
}
