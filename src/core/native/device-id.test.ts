import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

import { readOrCreateDeviceId } from './device-id';

function memoryStore() {
  const values = new Map<string, unknown>();
  return {
    read: <T>(key: string, schema: z.ZodType<T>): Promise<T | null> => {
      const parsed = schema.safeParse(values.get(key));
      return Promise.resolve(parsed.success ? parsed.data : null);
    },
    write: (key: string, value: unknown): Promise<boolean> => {
      values.set(key, value);
      return Promise.resolve(true);
    },
  };
}

describe('readOrCreateDeviceId', () => {
  it('lo crea una vez y después devuelve siempre el mismo', async () => {
    const store = memoryStore();
    expect(await readOrCreateDeviceId(store, () => 'device-1')).toBe('device-1');
    expect(await readOrCreateDeviceId(store, () => 'device-2')).toBe('device-1');
  });
});
