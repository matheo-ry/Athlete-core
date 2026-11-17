import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('@capacitor/preferences', () => ({ Preferences: {} }));

const { createDeviceStore } = await import('./device-store');

const schema = z.object({ name: z.string() });

function setup() {
  const data = new Map<string, string>();
  const store = createDeviceStore({
    get: (key) => Promise.resolve(data.get(key) ?? null),
    set: (key, value) => {
      data.set(key, value);
      return Promise.resolve();
    },
    remove: (key) => {
      data.delete(key);
      return Promise.resolve();
    },
  });
  return { store, data };
}

describe('device store', () => {
  it('guarda, lee y borra con el prefijo de la app', async () => {
    const { store, data } = setup();

    expect(await store.write('item', { name: 'Fuerza' })).toBe(true);
    expect([...data.keys()]).toEqual(['athlete-core.item']);
    expect(await store.read('item', schema)).toEqual({ name: 'Fuerza' });

    await store.remove('item');
    expect(await store.read('item', schema)).toBeNull();
  });

  it('lo que no pasa el esquema o no es JSON se trata como si no hubiera nada', async () => {
    const { store, data } = setup();
    data.set('athlete-core.old', JSON.stringify({ title: 'otra versión' }));
    data.set('athlete-core.broken', '{nope');

    expect(await store.read('old', schema)).toBeNull();
    expect(await store.read('broken', schema)).toBeNull();
  });

  it('si el teléfono falla al guardar, lo dice sin romper la app', async () => {
    const store = createDeviceStore({
      get: () => Promise.reject(new Error('disk')),
      set: () => Promise.reject(new Error('disk')),
      remove: () => Promise.reject(new Error('disk')),
    });

    expect(await store.write('item', { name: 'x' })).toBe(false);
    expect(await store.read('item', schema)).toBeNull();
    await expect(store.remove('item')).resolves.toBeUndefined();
  });
});
