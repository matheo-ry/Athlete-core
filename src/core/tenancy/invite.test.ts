import { describe, expect, it } from 'vitest';

import { DEFAULT_BRAND } from '../branding/default-brand';
import { parseInvitePreview, parseJoinResult } from './invite';

describe('parseInvitePreview', () => {
  it('lee el nombre y la marca del coach, y una marca rota no rompe nada', () => {
    expect(parseInvitePreview({ status: 'ok', name: 'Norte', branding: { x: 1 } })).toEqual({
      status: 'ok',
      name: 'Norte',
      branding: DEFAULT_BRAND,
    });
  });

  it('lee los fallos, y una respuesta rara cuenta como error', () => {
    expect(parseInvitePreview({ status: 'invalid_code' })).toEqual({ status: 'invalid_code' });
    expect(parseInvitePreview({ status: 'rate_limited' })).toEqual({ status: 'rate_limited' });
    expect(parseInvitePreview(null)).toEqual({ status: 'error' });
  });
});

describe('parseJoinResult', () => {
  it('lee cada resultado de unirse (D-054)', () => {
    expect(parseJoinResult({ status: 'joined', tenant_id: 't1' })).toEqual({
      status: 'joined',
      tenantId: 't1',
    });
    expect(parseJoinResult({ status: 'plan_full' })).toEqual({ status: 'plan_full' });
    expect(parseJoinResult({ status: 'archived' })).toEqual({ status: 'archived' });
    expect(parseJoinResult({ status: 'joined' })).toEqual({ status: 'error' });
  });
});
