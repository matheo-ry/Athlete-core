import { isNetworkError } from '../../auth/auth-errors';
import { logger } from '../../lib';
import { getSupabaseClient } from '../../supabase';
import { HEALTH_CONSENT_TEXT_VERSION, parseHealthConsent } from '../health-consent';
import type { HealthConsentChange, HealthConsentState } from '../health-consent';

/** El consentimiento del usuario en un negocio. Un fallo se propaga: no es "sin consentimiento". */
export async function fetchHealthConsent(
  tenantId: string,
  userId: string,
): Promise<HealthConsentState> {
  const { data, error } = await getSupabaseClient()
    .from('health_consents')
    .select('granted_at, text_version, withdrawn_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error !== null) {
    throw new Error(`Could not load health consent: ${error.code}`);
  }
  return parseHealthConsent(data);
}

/** Da el consentimiento con la versión actual del texto (`grant_health_consent`, D-140). */
export async function grantHealthConsent(tenantId: string): Promise<HealthConsentChange> {
  const { error } = await getSupabaseClient().rpc('grant_health_consent', {
    p_tenant: tenantId,
    p_text_version: HEALTH_CONSENT_TEXT_VERSION,
  });
  return changeResult(error, 'grant');
}

/** Lo retira y borra peso, medidas y notas de ese negocio (`withdraw_health_consent`, D-140). */
export async function withdrawHealthConsent(tenantId: string): Promise<HealthConsentChange> {
  const { error } = await getSupabaseClient().rpc('withdraw_health_consent', {
    p_tenant: tenantId,
  });
  return changeResult(error, 'withdraw');
}

function changeResult(
  error: { code?: string; message?: string } | null,
  action: string,
): HealthConsentChange {
  if (error === null) {
    return 'ok';
  }
  if (isNetworkError(error)) {
    return 'offline';
  }
  // Sin datos personales: solo el código técnico.
  logger.error(`Health consent: ${action} failed`, { code: error.code });
  return 'error';
}
