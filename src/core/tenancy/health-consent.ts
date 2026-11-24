import { z } from 'zod';

// El consentimiento de datos de salud de un cliente en el espacio de un coach
// (D-126 y D-140): peso corporal, medidas y notas del día. Lógica pura: lo que
// la base de datos devuelve de `health_consents`, traducido a un estado.

/** La versión del texto que se acepta. Cambia cuando el abogado revise el texto (D-126). */
export const HEALTH_CONSENT_TEXT_VERSION = '2026-11-draft';

/** Lo que se lee de `health_consents` (una fila por cliente y negocio). */
export const healthConsentRowSchema = z.object({
  granted_at: z.string(),
  text_version: z.string(),
  withdrawn_at: z.string().nullable(),
});

/** Cómo acaba dar o retirar el consentimiento. */
export type HealthConsentChange = 'ok' | 'offline' | 'error';

export type HealthConsentState =
  /** Nunca se le ha pedido (o no hay fila): al entrar por primera vez se le pregunta. */
  | { status: 'none' }
  /** Dado y vigente: puede apuntar peso, medidas y notas. */
  | { status: 'granted'; grantedAt: string; textVersion: string }
  /** Lo retiró: no se vuelve a preguntar solo, pero al intentar apuntar sí. */
  | { status: 'withdrawn'; withdrawnAt: string };

/**
 * Convierte la fila (o `null`, si no hay) en un estado. Un dato que no cuadra
 * lanza un error: nunca se lee como "sin consentimiento", porque se le
 * volvería a preguntar a quien ya lo dio.
 */
export function parseHealthConsent(row: unknown): HealthConsentState {
  if (row === null || row === undefined) {
    return { status: 'none' };
  }
  const parsed = healthConsentRowSchema.parse(row);
  if (parsed.withdrawn_at !== null) {
    return { status: 'withdrawn', withdrawnAt: parsed.withdrawn_at };
  }
  return { status: 'granted', grantedAt: parsed.granted_at, textVersion: parsed.text_version };
}

/** ¿Puede apuntar datos de salud ahora mismo? */
export function isHealthConsentGranted(state: HealthConsentState | undefined): boolean {
  return state?.status === 'granted';
}

/**
 * ¿Hay que preguntárselo solo, al entrar? Solo si nunca se le ha pedido y este
 * dispositivo no recuerda haberlo preguntado ya (con "Ahora no" no se insiste:
 * se vuelve a pedir cuando intente apuntar algo).
 */
export function shouldPromptOnEntry(
  state: HealthConsentState | undefined,
  alreadyAsked: boolean,
): boolean {
  return state?.status === 'none' && !alreadyAsked;
}
