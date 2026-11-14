import type { WeightUnit } from '../lib';

// Datos de una cuenta nueva (DECISIONES D-040, D-058 y D-060).

/**
 * Versión de los términos y de la política de privacidad que se aceptan al
 * registrarse. Se guarda en el perfil. Cuando lleguen los textos definitivos
 * (Fase 4), se cambia aquí.
 */
export const TERMS_VERSION = 'draft-2026-11';

export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 60;

export type DisplayNameError = 'too_short' | 'too_long';

/** El nombre: entre 2 y 60 caracteres, sin contar los espacios de los extremos. */
export function checkDisplayName(value: string): DisplayNameError | null {
  const length = value.trim().length;
  if (length < DISPLAY_NAME_MIN_LENGTH) {
    return 'too_short';
  }
  return length > DISPLAY_NAME_MAX_LENGTH ? 'too_long' : null;
}

/** Lo que se guarda en el perfil al crear la cuenta. */
export interface SignupProfile {
  displayName: string;
  locale: 'en' | 'es';
  weightUnit: WeightUnit;
  termsVersion: string;
}

export interface SignupInput extends SignupProfile {
  email: string;
  password: string;
}
