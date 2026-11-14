import { z } from 'zod';

import { getSupabaseClient } from '../../supabase';
import type { FlagsSource } from '../flags-source';

const rowsSchema = z.array(z.object({ feature_key: z.string().nullable() }));

// Los flags activos salen de la vista tenant_effective_features, que ya aplica
// las reglas de ARQUITECTURA §9: interruptor general, excepción del tenant, tipo
// del flag y plan. Respeta el RLS: solo devuelve filas de tenants del usuario.
export function createSupabaseFlagsSource(): FlagsSource {
  return {
    async listEnabledFeatures(tenantId) {
      const { data, error } = await getSupabaseClient()
        .from('tenant_effective_features')
        .select('feature_key')
        .eq('tenant_id', tenantId)
        .eq('enabled', true)
        .order('feature_key');
      if (error !== null) {
        // El registro lo hace la caché de TanStack Query (app/query-client.ts).
        throw new Error(`Could not load feature flags: ${error.code}`);
      }
      return rowsSchema
        .parse(data)
        .flatMap((row) => (row.feature_key === null ? [] : [row.feature_key]));
    },
  };
}
