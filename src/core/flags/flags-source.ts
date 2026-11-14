/** De dónde salen los flags activos de un tenant. En la app, de Supabase; en los tests, de una lista. */
export interface FlagsSource {
  /** Claves de los flags activos, ordenadas (así TanStack Query reutiliza la lista si no cambia). */
  listEnabledFeatures(tenantId: string): Promise<string[]>;
}
