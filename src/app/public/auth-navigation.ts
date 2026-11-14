import { z } from 'zod';

// Al pasar de una pantalla de cuenta a otra (por ejemplo, de "Entrar" a "He
// olvidado mi contraseña"), el email escrito viaja en el estado de la
// navegación para no tener que escribirlo otra vez. No va en la dirección: así
// no queda en el historial. Es un dato de fuera: se valida.

const emailStateSchema = z.object({ email: z.string().max(320) });

export interface EmailState {
  email: string;
}

export function readEmailState(state: unknown): string {
  const result = emailStateSchema.safeParse(state);
  return result.success ? result.data.email : '';
}
