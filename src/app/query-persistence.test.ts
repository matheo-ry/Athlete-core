import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createDeviceStore } from '@/core/native';

import { PERSISTED_MAX_AGE_MS, persistQueryCache, restoreQueryCache } from './query-persistence';

function memoryStore() {
  const data = new Map<string, string>();
  return createDeviceStore({
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
}

async function saveWith(store: ReturnType<typeof memoryStore>, now: number) {
  const before = new QueryClient();
  const stop = persistQueryCache(before, store, () => now);
  before.setQueryData(['programs', 'client-programs', 'tenant-1'], [{ id: 'program-1' }]);
  await vi.advanceTimersByTimeAsync(1000);
  stop();
}

describe('query cache persistence', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('lo cargado vuelve al abrir la app otra vez', async () => {
    vi.useFakeTimers();
    const store = memoryStore();
    await saveWith(store, 1_000);

    const after = new QueryClient();
    await restoreQueryCache(after, store, 2_000);

    expect(after.getQueryData(['programs', 'client-programs', 'tenant-1'])).toEqual([
      { id: 'program-1' },
    ]);
  });

  it('al vaciar la caché (cerrar sesión) se guarda vacía', async () => {
    vi.useFakeTimers();
    const store = memoryStore();
    const client = new QueryClient();
    const stop = persistQueryCache(client, store, () => 1_000);
    client.setQueryData(['profile'], { name: 'x' });
    await vi.advanceTimersByTimeAsync(1000);
    client.clear();
    await vi.advanceTimersByTimeAsync(1000);
    stop();

    const after = new QueryClient();
    await restoreQueryCache(after, store, 2_000);

    expect(after.getQueryData(['profile'])).toBeUndefined();
  });

  it('lo guardado hace demasiado no se usa', async () => {
    vi.useFakeTimers();
    const store = memoryStore();
    await saveWith(store, 1_000);

    const after = new QueryClient();
    await restoreQueryCache(after, store, 1_000 + PERSISTED_MAX_AGE_MS + 1);

    expect(after.getQueryData(['programs', 'client-programs', 'tenant-1'])).toBeUndefined();
  });
});
