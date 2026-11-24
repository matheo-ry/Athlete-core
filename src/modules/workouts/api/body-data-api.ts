import { getSupabaseClient } from '@/core/supabase';
import { logger } from '@/core/lib';

import type { MeasurementSide } from '../model/body-measurements';

// El cliente escribe su peso y sus medidas directamente (DECISIONES D-140): no
// hay reglas de negocio más allá del consentimiento y de que sean suyos, y eso
// lo comprueba el RLS de `body_weights` y `body_measurements`.

/** `no_consent`: la base de datos no dejó escribir porque no hay consentimiento dado. */
export type BodyWriteResult = 'ok' | 'no_consent' | 'error';

/** El código con que Postgres rechaza una escritura que el RLS no permite. */
const RLS_VIOLATION = '42501';

function resultOf(error: { code: string } | null, what: string): BodyWriteResult {
  if (error === null) {
    return 'ok';
  }
  if (error.code === RLS_VIOLATION) {
    return 'no_consent';
  }
  // Solo el código: en los registros no van datos de salud.
  logger.error(`Could not save ${what}`, { code: error.code });
  return 'error';
}

/** Apunta el peso de un día; si ya había uno ese día, lo sustituye. */
export async function saveBodyWeight(
  tenantId: string,
  userId: string,
  measuredOn: string,
  weightKg: number,
): Promise<BodyWriteResult> {
  const { error } = await getSupabaseClient()
    .from('body_weights')
    .upsert(
      { tenant_id: tenantId, user_id: userId, measured_on: measuredOn, weight_kg: weightKg },
      { onConflict: 'tenant_id,user_id,measured_on' },
    );
  return resultOf(error, 'body weight');
}

export async function deleteBodyWeight(tenantId: string, id: string): Promise<BodyWriteResult> {
  const { error } = await getSupabaseClient()
    .from('body_weights')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', id);
  return resultOf(error, 'body weight deletion');
}

export interface BodyMeasurementInput {
  measuredOn: string;
  kind: string;
  side: MeasurementSide | null;
  valueCm: number;
}

/** Apunta una medida de un día; si ya había esa medida ese día, la sustituye. */
export async function saveBodyMeasurement(
  tenantId: string,
  userId: string,
  input: BodyMeasurementInput,
): Promise<BodyWriteResult> {
  const { error } = await getSupabaseClient().from('body_measurements').upsert(
    {
      tenant_id: tenantId,
      user_id: userId,
      measured_on: input.measuredOn,
      kind: input.kind,
      side: input.side,
      value_cm: input.valueCm,
    },
    { onConflict: 'tenant_id,user_id,measured_on,kind,side' },
  );
  return resultOf(error, 'body measurement');
}

export async function deleteBodyMeasurement(
  tenantId: string,
  id: string,
): Promise<BodyWriteResult> {
  const { error } = await getSupabaseClient()
    .from('body_measurements')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', id);
  return resultOf(error, 'body measurement deletion');
}
