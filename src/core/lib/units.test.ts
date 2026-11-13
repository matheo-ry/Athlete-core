import { describe, expect, it } from 'vitest';

import { formatWeight, fromKg, kgToLb, lbToKg, toKg } from './units';

describe('kgToLb / lbToKg', () => {
  it('convierte kg a lb', () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 3);
  });

  it('convierte lb a kg', () => {
    expect(lbToKg(225)).toBeCloseTo(102.058, 3);
  });

  it('ida y vuelta devuelve el mismo valor', () => {
    expect(lbToKg(kgToLb(142.5))).toBeCloseTo(142.5, 10);
  });

  it('cero sigue siendo cero', () => {
    expect(kgToLb(0)).toBe(0);
    expect(lbToKg(0)).toBe(0);
  });
});

describe('fromKg / toKg', () => {
  it('no cambia el valor cuando la unidad es kg', () => {
    expect(fromKg(80, 'kg')).toBe(80);
    expect(toKg(80, 'kg')).toBe(80);
  });

  it('convierte cuando la unidad es lb', () => {
    expect(fromKg(100, 'lb')).toBeCloseTo(220.462, 3);
    expect(toKg(220.462, 'lb')).toBeCloseTo(100, 3);
  });
});

describe('formatWeight', () => {
  it('muestra kg sin decimales innecesarios', () => {
    expect(formatWeight(100, 'kg', 'en')).toBe('100 kg');
  });

  it('muestra lb redondeando a un decimal', () => {
    expect(formatWeight(100, 'lb', 'en')).toBe('220.5 lb');
  });

  it('usa el separador decimal del idioma', () => {
    expect(formatWeight(102.5, 'kg', 'es')).toBe('102,5 kg');
  });
});
