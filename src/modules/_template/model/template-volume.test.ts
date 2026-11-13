import { describe, expect, it } from 'vitest';

import type { TemplateItem } from './template-item-schema';
import { templateItemSchema } from './template-item-schema';
import { calculateTotalVolumeKg } from './template-volume';

function buildItem(overrides: Partial<TemplateItem> = {}): TemplateItem {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Example lift',
    sets: 5,
    reps: 5,
    weightKg: 100,
    ...overrides,
  };
}

describe('calculateTotalVolumeKg', () => {
  it('es cero cuando no hay elementos', () => {
    expect(calculateTotalVolumeKg([])).toBe(0);
  });

  it('multiplica series, repeticiones y peso', () => {
    expect(calculateTotalVolumeKg([buildItem()])).toBe(2500);
  });

  it('suma todos los elementos', () => {
    const items = [buildItem(), buildItem({ sets: 3, reps: 8, weightKg: 62.5 })];
    expect(calculateTotalVolumeKg(items)).toBe(4000);
  });

  it('un elemento sin peso no suma volumen', () => {
    expect(calculateTotalVolumeKg([buildItem({ weightKg: 0 })])).toBe(0);
  });
});

describe('templateItemSchema', () => {
  it('acepta un elemento válido', () => {
    expect(templateItemSchema.safeParse(buildItem()).success).toBe(true);
  });

  it.each([
    ['series a cero', { sets: 0 }],
    ['repeticiones con decimales', { reps: 2.5 }],
    ['peso negativo', { weightKg: -1 }],
    ['nombre vacío', { name: '' }],
    ['id que no es uuid', { id: 'abc' }],
  ])('rechaza %s', (_name, override) => {
    expect(templateItemSchema.safeParse({ ...buildItem(), ...override }).success).toBe(false);
  });
});
