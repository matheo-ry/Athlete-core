import { describe, expect, it } from 'vitest';

import { checkEmail } from './credentials';

describe('checkEmail', () => {
  it('acepta un email y lo deja limpio', () => {
    expect(checkEmail('  Ana@Example.com ')).toEqual({ ok: true, email: 'ana@example.com' });
  });

  it('distingue un email vacío de uno mal escrito', () => {
    expect(checkEmail('   ')).toEqual({ ok: false, error: 'required' });
    expect(checkEmail('ana@')).toEqual({ ok: false, error: 'invalid' });
  });
});
