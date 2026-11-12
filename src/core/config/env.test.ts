import { describe, expect, it } from 'vitest';

import { parseEnv } from './env';

describe('parseEnv', () => {
  it('usa "local" y deja Supabase sin configurar cuando no hay variables', () => {
    expect(parseEnv({})).toEqual({ appEnv: 'local', supabase: null });
  });

  it('trata los valores vacíos como no definidos', () => {
    expect(
      parseEnv({ VITE_APP_ENV: '', VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' }),
    ).toEqual({ appEnv: 'local', supabase: null });
  });

  it('devuelve la configuración de Supabase cuando están las dos variables', () => {
    const env = parseEnv({
      VITE_APP_ENV: 'staging',
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'example-public-key',
    });

    expect(env).toEqual({
      appEnv: 'staging',
      supabase: { url: 'http://127.0.0.1:54321', publishableKey: 'example-public-key' },
    });
  });

  it('falla si el entorno no es uno de los tres previstos', () => {
    expect(() => parseEnv({ VITE_APP_ENV: 'testing' })).toThrow('Invalid environment variables');
  });

  it('falla si solo se define una de las dos variables de Supabase', () => {
    expect(() => parseEnv({ VITE_SUPABASE_URL: 'http://127.0.0.1:54321' })).toThrow(
      'must be set together',
    );
  });

  it('falla si la URL de Supabase no es una URL', () => {
    expect(() =>
      parseEnv({ VITE_SUPABASE_URL: 'not a url', VITE_SUPABASE_PUBLISHABLE_KEY: 'example' }),
    ).toThrow('Invalid environment variables');
  });
});
