import { describe, expect, it } from 'vitest';

import { loginPathFor, readNextPath, safeNextPath } from './next-path';

describe('safeNextPath', () => {
  it('acepta rutas de la propia app', () => {
    expect(safeNextPath('/coach/clients')).toBe('/coach/clients');
    expect(safeNextPath('/join?code=IRONLAB1')).toBe('/join?code=IRONLAB1');
  });

  it('rechaza todo lo que pueda llevar a otra web', () => {
    expect(safeNextPath('https://example.com')).toBeNull();
    expect(safeNextPath('//example.com')).toBeNull();
    expect(safeNextPath('/\\example.com')).toBeNull();
    expect(safeNextPath('javascript:alert(1)')).toBeNull();
    expect(safeNextPath(null)).toBeNull();
  });

  it('no vuelve a la propia pantalla de entrar', () => {
    expect(safeNextPath('/login')).toBeNull();
    expect(safeNextPath('/login?next=/coach')).toBeNull();
  });
});

describe('loginPathFor', () => {
  it('guarda la pantalla pedida para volver a ella', () => {
    expect(loginPathFor('/coach/clients')).toBe('/login?next=%2Fcoach%2Fclients');
  });

  it('sin pantalla que recordar, es /login a secas', () => {
    expect(loginPathFor('/')).toBe('/login');
  });
});

describe('readNextPath', () => {
  it('lee el destino de la dirección y lo valida', () => {
    expect(readNextPath('?next=%2Fclient')).toBe('/client');
    expect(readNextPath('?next=https%3A%2F%2Fexample.com')).toBeNull();
    expect(readNextPath('')).toBeNull();
  });
});
