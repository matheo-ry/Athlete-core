import { describe, expect, it, vi } from 'vitest';

import type { UploadSender } from './upload-queue';

vi.mock('@capacitor/preferences', () => ({ Preferences: {} }));

const { createDeviceStore } = await import('./device-store');
const { createUploadQueue, retryDelayMs } = await import('./upload-queue');

const USER = 'user-1';

function memoryStore() {
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

function workout(id: string, sets: number) {
  return { id, kind: 'workout', tenantId: 'tenant-1', tenantName: 'Iron Lab', payload: { sets } };
}

function setup() {
  const { store, data } = memoryStore();
  const queue = createUploadQueue(store);
  const sent: unknown[] = [];
  const answers: Awaited<ReturnType<UploadSender>>[] = [];
  const send: UploadSender = (item) => {
    sent.push(item.payload);
    return Promise.resolve(answers.shift() ?? 'done');
  };
  return { queue, data, sent, answers, senders: { workout: send } };
}

describe('upload queue', () => {
  it('sube lo pendiente en el orden en que se apuntó y vacía la cola', async () => {
    const { queue, sent, senders } = setup();
    await queue.enqueue(USER, workout('a', 1));
    await queue.enqueue(USER, workout('b', 2));

    const run = await queue.process(USER, senders);

    expect(sent).toEqual([{ sets: 1 }, { sets: 2 }]);
    expect(run).toEqual({ uploaded: 2, rejected: 0, failedAttempts: null });
    expect(await queue.list(USER)).toEqual([]);
  });

  it('se guarda en el almacén: otra cola sobre el mismo almacén la ve', async () => {
    const { store } = memoryStore();
    await createUploadQueue(store).enqueue(USER, workout('a', 1));

    const items = await createUploadQueue(store).list(USER);

    expect(items.map((item) => item.id)).toEqual(['a']);
  });

  it('si falla, lo deja en la cola, no sube lo de detrás y lo reintenta después', async () => {
    const { queue, sent, answers, senders } = setup();
    await queue.enqueue(USER, workout('a', 1));
    await queue.enqueue(USER, workout('b', 2));
    answers.push('retry');

    const failed = await queue.process(USER, senders);

    expect(failed.failedAttempts).toBe(1);
    expect(sent).toEqual([{ sets: 1 }]);
    expect((await queue.list(USER)).map((item) => [item.id, item.attempts])).toEqual([
      ['a', 1],
      ['b', 0],
    ]);

    const retried = await queue.process(USER, senders);

    expect(retried.uploaded).toBe(2);
    expect(sent).toEqual([{ sets: 1 }, { sets: 1 }, { sets: 2 }]);
  });

  it('un error al subir cuenta como fallo para reintentar', async () => {
    const { queue } = setup();
    await queue.enqueue(USER, workout('a', 1));

    const run = await queue.process(USER, { workout: () => Promise.reject(new Error('offline')) });

    expect(run.failedAttempts).toBe(1);
    expect(await queue.list(USER)).toHaveLength(1);
  });

  it('no duplica: volver a encolarlo sustituye la versión anterior en su sitio', async () => {
    const { queue, sent, senders } = setup();
    await queue.enqueue(USER, workout('a', 1));
    await queue.enqueue(USER, workout('b', 1));
    await queue.enqueue(USER, workout('a', 2));

    const items = await queue.list(USER);
    expect(items.map((item) => [item.id, item.revision])).toEqual([
      ['a', 2],
      ['b', 1],
    ]);

    await queue.process(USER, senders);
    expect(sent).toEqual([{ sets: 2 }, { sets: 1 }]);
  });

  it('lo que cambia mientras se sube no se pierde: se sube también', async () => {
    const { queue, sent } = setup();
    await queue.enqueue(USER, workout('a', 1));
    const send: UploadSender = async (item) => {
      sent.push(item.payload);
      if (item.revision === 1) {
        await queue.enqueue(USER, workout('a', 2));
      }
      return 'done';
    };

    await queue.process(USER, { workout: send });

    expect(sent).toEqual([{ sets: 1 }, { sets: 2 }]);
    expect(await queue.list(USER)).toEqual([]);
  });

  it('dos subidas a la vez no mandan dos veces lo mismo', async () => {
    const { queue, sent, senders } = setup();
    await queue.enqueue(USER, workout('a', 1));

    await Promise.all([queue.process(USER, senders), queue.process(USER, senders)]);

    expect(sent).toEqual([{ sets: 1 }]);
  });

  it('si la base de datos lo rechaza, no lo reintenta, sigue con lo demás y lo guarda para avisar', async () => {
    const { queue, sent, answers, senders } = setup();
    await queue.enqueue(USER, workout('a', 1));
    await queue.enqueue(USER, workout('b', 2));
    answers.push('no_access');

    const run = await queue.process(USER, senders);

    expect(run).toEqual({ uploaded: 1, rejected: 1, failedAttempts: null });
    const [rejected, ...rest] = await queue.list(USER);
    expect(rest).toEqual([]);
    expect(rejected).toMatchObject({
      id: 'a',
      status: 'rejected',
      rejection: 'no_access',
      tenantName: 'Iron Lab',
    });

    await queue.process(USER, senders);
    expect(sent).toEqual([{ sets: 1 }, { sets: 2 }]);

    await queue.dismissRejected(USER);
    expect(await queue.list(USER)).toEqual([]);
  });

  it('cada usuario tiene su cola', async () => {
    const { queue, sent, senders } = setup();
    await queue.enqueue('other-user', workout('a', 1));

    await queue.process(USER, senders);

    expect(sent).toEqual([]);
    expect(await queue.list('other-user')).toHaveLength(1);
  });

  it('deja en la cola lo que nadie sabe subir', async () => {
    const { queue } = setup();
    await queue.enqueue(USER, workout('a', 1));

    const run = await queue.process(USER, {});

    expect(run.uploaded).toBe(0);
    expect(await queue.list(USER)).toHaveLength(1);
  });

  it('cerrar sesión la vacía y avisa a quien escucha', async () => {
    const { queue, data } = setup();
    const listener = vi.fn();
    queue.subscribe(listener);
    await queue.enqueue(USER, workout('a', 1));

    await queue.clear(USER);

    expect(await queue.list(USER)).toEqual([]);
    expect(data.size).toBe(0);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('retryDelayMs', () => {
  it('espera cada vez el doble, hasta 5 minutos', () => {
    expect(retryDelayMs(1)).toBe(5_000);
    expect(retryDelayMs(2)).toBe(10_000);
    expect(retryDelayMs(3)).toBe(20_000);
    expect(retryDelayMs(20)).toBe(300_000);
  });
});
