import { z } from 'zod';

import { WEIGHT_UNITS } from '../lib';
import type { WeightUnit } from '../lib';

// El perfil del usuario (DECISIONES D-058): lo que es suyo, no de un coach.

export interface UserProfile {
  displayName: string;
  locale: 'en' | 'es';
  weightUnit: WeightUnit;
  /** Ajustes de entreno (D-120 y D-123): valen en todos sus espacios. */
  defaultRestSeconds: number;
  restAutostart: boolean;
  restSound: boolean;
  restVibration: boolean;
  sameButton: SameButtonMode;
}

/** Qué copia "Igual" (D-120): la vez anterior, o en las series 2+ la serie anterior de hoy. */
export const SAME_BUTTON_MODES = ['previous', 'previous_then_today'] as const;
export type SameButtonMode = (typeof SAME_BUTTON_MODES)[number];

/** Lo que vale un ajuste de entreno nuevo (los mismos valores que la base de datos). */
export const DEFAULT_TRAINING_SETTINGS = {
  defaultRestSeconds: 120,
  restAutostart: true,
  restSound: true,
  restVibration: true,
  sameButton: 'previous',
} as const satisfies Partial<UserProfile>;

/** Las columnas de `profiles` que lee el perfil. */
export const PROFILE_COLUMNS =
  'display_name, locale, weight_unit, default_rest_seconds, rest_autostart, rest_sound, rest_vibration, same_button';

export type ProfilePatch = Partial<UserProfile>;

const profileRowSchema = z.object({
  display_name: z.string(),
  locale: z.enum(['en', 'es']),
  weight_unit: z.enum(WEIGHT_UNITS),
  default_rest_seconds: z.number().int(),
  rest_autostart: z.boolean(),
  rest_sound: z.boolean(),
  rest_vibration: z.boolean(),
  same_button: z.enum(SAME_BUTTON_MODES),
});

/** La fila de `profiles`, validada (es un dato de fuera, AGENTS.md §4). */
export function parseProfile(row: unknown): UserProfile {
  const parsed = profileRowSchema.parse(row);
  return {
    displayName: parsed.display_name,
    locale: parsed.locale,
    weightUnit: parsed.weight_unit,
    defaultRestSeconds: parsed.default_rest_seconds,
    restAutostart: parsed.rest_autostart,
    restSound: parsed.rest_sound,
    restVibration: parsed.rest_vibration,
    sameButton: parsed.same_button,
  };
}
