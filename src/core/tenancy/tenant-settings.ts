import { z } from 'zod';

// Los ajustes de un negocio (`tenants.settings`): solo preferencias, nunca
// nada que dé permisos o límites (ARQUITECTURA §8). De momento, uno: con qué
// escala de intensidad trabaja el coach (D-076).

export const INTENSITY_SCALES = ['rir', 'rpe'] as const;

/** RIR (repeticiones que se dejan sin hacer) o RPE (esfuerzo de 1 a 10). */
export type IntensityScale = (typeof INTENSITY_SCALES)[number];

export interface TenantSettings {
  intensityScale: IntensityScale;
}

export const DEFAULT_TENANT_SETTINGS: TenantSettings = { intensityScale: 'rir' };

const settingsSchema = z.object({
  // Si falta o no vale, RIR: es el valor por defecto de D-076.
  intensityScale: z.enum(INTENSITY_SCALES).catch(DEFAULT_TENANT_SETTINGS.intensityScale),
});

/** Valida lo que guarda la base de datos. Lo que falta o no vale toma su valor por defecto. */
export function parseTenantSettings(raw: unknown): TenantSettings {
  const parsed = settingsSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : DEFAULT_TENANT_SETTINGS;
}

/**
 * Lo que se guarda al cambiar un ajuste: lo que ya había, con lo nuevo encima.
 * Así no se pierde un ajuste que esta versión de la app no conoce.
 */
export function mergeTenantSettings(
  raw: unknown,
  patch: Partial<TenantSettings>,
): Record<string, unknown> {
  const current =
    typeof raw === 'object' && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  return { ...current, ...patch };
}
