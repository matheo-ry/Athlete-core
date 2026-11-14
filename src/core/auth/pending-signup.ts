import type { SignupProfile } from './signup';

// Lo que hace falta recordar entre "Crear cuenta" y "Confirmar el email".
//
// - La contraseña y los datos del formulario viven SOLO en memoria: nunca se
//   guardan en el dispositivo. Si se cierra la app, se pierden, y al confirmar se
//   pide elegir una contraseña (D-043).
// - El email sí se guarda en el dispositivo (un día como máximo), para poder
//   volver a /verify tras cerrar la app sin tener que escribirlo.

export interface PendingSignup {
  email: string;
  /** La contraseña recién escrita. `null` si ya no se sabe (se cerró la app). */
  password: string | null;
  /** Los datos del formulario. `null` si no vienen de un registro en esta sesión. */
  profile: SignupProfile | null;
}

const EMAIL_KEY = 'athlete-core.pendingEmail';
const EMAIL_MAX_AGE_MS = 24 * 60 * 60 * 1000;

let inMemory: PendingSignup | null = null;

export function rememberPendingSignup(pending: PendingSignup): void {
  inMemory = pending;
  try {
    localStorage.setItem(EMAIL_KEY, JSON.stringify({ email: pending.email, at: Date.now() }));
  } catch {
    // Sin almacenamiento solo se pierde el atajo de no volver a escribir el email.
  }
}

function readStoredEmail(): string | null {
  try {
    const raw = localStorage.getItem(EMAIL_KEY);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'email' in parsed &&
      'at' in parsed &&
      typeof parsed.email === 'string' &&
      typeof parsed.at === 'number' &&
      Date.now() - parsed.at < EMAIL_MAX_AGE_MS
    ) {
      return parsed.email;
    }
  } catch {
    // Un valor estropeado cuenta como "nada guardado".
  }
  return null;
}

/** El registro pendiente: el de esta sesión o, si se cerró la app, solo su email. */
export function readPendingSignup(): PendingSignup | null {
  if (inMemory !== null) {
    return inMemory;
  }
  const email = readStoredEmail();
  return email === null ? null : { email, password: null, profile: null };
}

export function clearPendingSignup(): void {
  inMemory = null;
  try {
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    // Igual que arriba.
  }
}
