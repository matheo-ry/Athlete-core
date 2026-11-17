import { logger } from '@/core/lib';
import type { UploadItem, UploadResult } from '@/core/native';
import { getSupabaseClient } from '@/core/supabase';

// Sube un entreno entero con `sync_workout` (D-138): se puede repetir sin
// duplicar nada. Lo usa la cola de `core/native` (D-143).

/** Lo que dice la base de datos, convertido en lo que hace la cola. Lógica pura. */
export function uploadResultFor(error: { code: string; message: string } | null): UploadResult {
  if (error === null) {
    return 'done';
  }
  // El coach lo dio de baja: ya no es cliente de ese negocio (D-118).
  if (error.message === 'not_allowed') {
    return 'no_access';
  }
  // Una regla de la base de datos (P0001) o un dato que no acepta (22…, 23…,
  // como una clave repetida): repetir no lo arregla, y atascaría la cola.
  if (error.code === 'P0001' || error.code.startsWith('22') || error.code.startsWith('23')) {
    return 'invalid';
  }
  // Sin conexión, el servidor caído o la sesión renovándose: se reintenta.
  return 'retry';
}

export async function sendWorkout(item: UploadItem): Promise<UploadResult> {
  const { error } = await getSupabaseClient().rpc('sync_workout', {
    p_tenant: item.tenantId,
    p_workout: item.payload,
  });
  const result = uploadResultFor(error);
  if (result === 'no_access' || result === 'invalid') {
    // Sin el entreno ni el negocio: solo el nombre de la regla y su código.
    logger.error('Workout upload rejected', { code: error?.code, rule: error?.message });
  }
  return result;
}
