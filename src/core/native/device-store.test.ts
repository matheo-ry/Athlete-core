import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('@capacitor/preferences', () => ({ Preferences: {} }));

const { createDeviceStore, userKey } = await import('./device-store');

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
    keys: () => Promise.resolve([...data.keys()]),
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
      keys: () => Promise.reject(new Error('disk')),
    });

    expect(await store.write('item', { name: 'x' })).toBe(false);
    expect(await store.read('item', schema)).toBeNull();
    await expect(store.remove('item')).resolves.toBeUndefined();
    await expect(store.removeUser('user-1')).resolves.toBeUndefined();
  });
});

describe('userKey y removeUser', () => {
  it('al cerrar sesión se borra todo lo del usuario y nada de los demás', async () => {
    const { store } = setup();
    await store.write(userKey('user-1', 'workouts.snapshot'), { name: 'a' });
    await store.write(userKey('user-1', 'upload-queue'), { name: 'b' });
    await store.write(userKey('user-10', 'upload-queue'), { name: 'c' });
    await store.write('query-cache', { name: 'd' });

    await store.removeUser('user-1');

    expect(await store.read(userKey('user-1', 'workouts.snapshot'), schema)).toBeNull();
    expect(await store.read(userKey('user-1', 'upload-queue'), schema)).toBeNull();
    expect(await store.read(userKey('user-10', 'upload-queue'), schema)).toEqual({ name: 'c' });
    expect(await store.read('query-cache', schema)).toEqual({ name: 'd' });
  });
});
