import { describe, expect, it } from 'vitest';

import { parseEnv } from './env';

const SUPABASE = {
  VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'example-public-key',
};

describe('parseEnv', () => {
  it('usa "local" cuando no se indica el entorno', () => {
    expect(parseEnv(SUPABASE)).toEqual({
      appEnv: 'local',
      supabase: { url: 'http://127.0.0.1:54321', publishableKey: 'example-public-key' },
      publicAppUrl: null,
      allowWebWorkouts: false,
    });
  });

  it('registrar entrenos en el navegador solo se activa con la variable y fuera de un build', () => {
    expect(parseEnv({ ...SUPABASE, VITE_ALLOW_WEB_WORKOUTS: 'true' }).allowWebWorkouts).toBe(true);
    expect(parseEnv({ ...SUPABASE, VITE_ALLOW_WEB_WORKOUTS: 'false' }).allowWebWorkouts).toBe(
      false,
    );
    expect(parseEnv({ ...SUPABASE, VITE_ALLOW_WEB_WORKOUTS: '' }).allowWebWorkouts).toBe(false);
  });

  it('nunca deja registrar entrenos en el navegador en un build de producción', () => {
    expect(
      parseEnv({ ...SUPABASE, VITE_ALLOW_WEB_WORKOUTS: 'true', PROD: true }).allowWebWorkouts,
    ).toBe(false);
  });

  it('falla si la variable de los entrenos en el navegador no es true ni false', () => {
    expect(() => parseEnv({ ...SUPABASE, VITE_ALLOW_WEB_WORKOUTS: 'yes' })).toThrow(
      'VITE_ALLOW_WEB_WORKOUTS',
    );
  });

  it('la dirección pública de la web es opcional y se guarda sin la barra final', () => {
    expect(
      parseEnv({ ...SUPABASE, VITE_PUBLIC_APP_URL: 'https://app.example.com/' }).publicAppUrl,
    ).toBe('https://app.example.com');
    expect(() => parseEnv({ ...SUPABASE, VITE_PUBLIC_APP_URL: 'not a url' })).toThrow(
      'Invalid environment variables',
    );
  });

  it('devuelve el entorno y la configuración de Supabase', () => {
    expect(parseEnv({ ...SUPABASE, VITE_APP_ENV: 'staging' }).appEnv).toBe('staging');
  });

  it('falla si faltan las variables de Supabase, que son obligatorias desde la Fase 1', () => {
    expect(() => parseEnv({})).toThrow('Invalid environment variables');
    expect(() => parseEnv({ VITE_SUPABASE_URL: 'http://127.0.0.1:54321' })).toThrow(
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    );
  });

  it('trata los valores vacíos como no definidos', () => {
    expect(() => parseEnv({ VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' })).toThrow(
      'Invalid environment variables',
    );
  });

  it('falla si el entorno no es uno de los tres previstos', () => {
    expect(() => parseEnv({ ...SUPABASE, VITE_APP_ENV: 'testing' })).toThrow(
      'Invalid environment variables',
    );
  });

  it('falla si la URL de Supabase no es una URL', () => {
    expect(() => parseEnv({ ...SUPABASE, VITE_SUPABASE_URL: 'not a url' })).toThrow(
      'Invalid environment variables',
    );
  });
});
