import type { InvitePreview, JoinResult } from '@/core/tenancy';

type Failure = Exclude<
  InvitePreview['status'] | JoinResult['status'],
  'ok' | 'joined' | 'already_member'
>;

// El mensaje de cada caso de D-054. Cada uno dice qué hacer después.
const MESSAGE_KEYS: Record<Failure, string> = {
  invalid_code: 'app.join.errors.invalidCode',
  plan_full: 'app.join.errors.planFull',
  archived: 'app.join.errors.archived',
  own_business: 'app.join.errors.ownBusiness',
  rate_limited: 'core.errors.rateLimited',
  offline: 'core.errors.offline',
  error: 'core.errors.unexpected',
};

export function joinMessageKey(status: Failure): string {
  return MESSAGE_KEYS[status];
}

export type JoinFailure = Failure;
