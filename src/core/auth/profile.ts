import { z } from 'zod';

import { WEIGHT_UNITS } from '../lib';
import type { WeightUnit } from '../lib';

// El perfil del usuario (DECISIONES D-058): lo que es suyo, no de un coach.

export interface UserProfile {
  displayName: string;
  locale: 'en' | 'es';
  weightUnit: WeightUnit;
}

export type ProfilePatch = Partial<UserProfile>;

const profileRowSchema = z.object({
  display_name: z.string(),
  locale: z.enum(['en', 'es']),
  weight_unit: z.enum(WEIGHT_UNITS),
});

/** La fila de `profiles`, validada (es un dato de fuera, AGENTS.md §4). */
export function parseProfile(row: unknown): UserProfile {
  const parsed = profileRowSchema.parse(row);
  return {
    displayName: parsed.display_name,
    locale: parsed.locale,
    weightUnit: parsed.weight_unit,
  };
}
