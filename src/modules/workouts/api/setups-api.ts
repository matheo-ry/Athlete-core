import { z } from 'zod';

import type { UploadItem, UploadResult } from '@/core/native';
import { getDeviceStore, userKey } from '@/core/native';
import { getSupabaseClient } from '@/core/supabase';

// Set-ups de los ejercicios por cliente (D-122).
// Uno por ejercicio y compartido entre rutinas: "Asiento 2 · Agarre línea 3".
// Se guarda en el teléfono para funcionar sin conexión (D-118).

export const setupsStoreSchema = z.record(z.string(), z.string());
export type SetupsMap = Record<string, string>;

export function setupsKey(userId: string, tenantId: string): string {
  return userKey(userId, `workouts.setups.${tenantId}`);
}

export async function readOfflineSetups(userId: string, tenantId: string): Promise<SetupsMap> {
  return (await getDeviceStore().read(setupsKey(userId, tenantId), setupsStoreSchema)) ?? {};
}

export async function writeOfflineSetups(
  userId: string,
  tenantId: string,
  setups: SetupsMap,
): Promise<void> {
  await getDeviceStore().write(setupsKey(userId, tenantId), setups);
}

export async function fetchMySetups(tenantId: string, userId: string): Promise<SetupsMap> {
  const { data, error } = await getSupabaseClient()
    .from('client_exercise_setups')
    .select('exercise_id, setup')
    .eq('tenant_id', tenantId)
    .eq('client_id', userId);

  if (error !== null) {
    throw new Error(`Could not load exercise setups: ${error.code}`);
  }

  const map: SetupsMap = {};
  for (const row of data ?? []) {
    map[row.exercise_id] = row.setup;
  }
  return map;
}

export async function saveClientSetup(
  tenantId: string,
  userId: string,
  exerciseId: string,
  setup: string,
): Promise<void> {
  const trimmed = setup.trim();
  const supabase = getSupabaseClient();
  if (trimmed === '') {
    const { error } = await supabase
      .from('client_exercise_setups')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('client_id', userId)
      .eq('exercise_id', exerciseId);
    if (error !== null) {
      throw new Error(`Could not delete setup: ${error.code}`);
    }
  } else {
    const { error } = await supabase.from('client_exercise_setups').upsert(
      {
        tenant_id: tenantId,
        client_id: userId,
        exercise_id: exerciseId,
        setup: trimmed.slice(0, 500),
      },
      { onConflict: 'tenant_id,client_id,exercise_id' },
    );
    if (error !== null) {
      throw new Error(`Could not save setup: ${error.code}`);
    }
  }
}

export async function sendSetup(item: UploadItem): Promise<UploadResult> {
  const { exerciseId, setup } = item.payload as { exerciseId: string; setup: string };
  try {
    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user === null) {
      return 'retry';
    }
    await saveClientSetup(item.tenantId, user.id, exerciseId, setup);
    return 'done';
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('permission') || message.includes('42501')) {
      return 'no_access';
    }
    return 'retry';
  }
}
