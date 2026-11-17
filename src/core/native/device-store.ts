import { Preferences } from '@capacitor/preferences';
import type { z } from 'zod';

import { logger } from '../lib';
import { isNativeApp } from './platform';

// El almacén del teléfono (DECISIONES D-118): lo que tiene que seguir ahí
// aunque se quite la app de la multitarea o se apague el móvil. En la app
// instalada es `@capacitor/preferences`, que el sistema no borra; en el
// navegador (desarrollo y tests), el `localStorage` de siempre.
//
// Lo que se lee pasa siempre por un esquema Zod: lo guardado puede venir de una
// versión anterior de la app o estar dañado, y entonces se trata como si no
// hubiera nada.

const PREFIX = 'athlete-core.';

/** Lo mínimo que necesita el almacén. Los tests pasan uno en memoria. */
export interface KeyValueBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

const nativeBackend: KeyValueBackend = {
  get: async (key) => (await Preferences.get({ key })).value,
  set: (key, value) => Preferences.set({ key, value }),
  remove: (key) => Preferences.remove({ key }),
  keys: async () => (await Preferences.keys()).keys,
};

// En el navegador, en modo privado estricto, `localStorage` puede fallar: se
// comporta como un almacén vacío que no guarda nada.
const browserBackend: KeyValueBackend = {
  get: (key) => Promise.resolve(safely(() => localStorage.getItem(key), null)),
  set: (key, value) => Promise.resolve(safely(() => localStorage.setItem(key, value), undefined)),
  remove: (key) => Promise.resolve(safely(() => localStorage.removeItem(key), undefined)),
  keys: () =>
    Promise.resolve(
      safely(
        () =>
          Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index) ?? ''),
        [],
      ),
    ),
};

function safely<T>(action: () => T, fallback: T): T {
  try {
    return action();
  } catch {
    return fallback;
  }
}

export interface DeviceStore {
  /** Lo guardado con esa clave, validado; `null` si no hay nada o no es válido. */
  read<T>(key: string, schema: z.ZodType<T>): Promise<T | null>;
  /** Guarda un valor que se pueda pasar a JSON. Si el teléfono falla, lo registra y devuelve `false`. */
  write(key: string, value: unknown): Promise<boolean>;
  remove(key: string): Promise<void>;
  /** Borra todo lo de un usuario (lo guardado con `userKey`): al cerrar sesión a propósito. */
  removeUser(userId: string): Promise<void>;
}

/**
 * La clave de algo que es de un usuario. Todo lo personal se guarda así, para
 * poder borrarlo entero al cerrar sesión: en un móvil compartido, otra persona
 * no debe encontrarlo.
 */
export function userKey(userId: string, name: string): string {
  return `user.${userId}.${name}`;
}

export function createDeviceStore(backend: KeyValueBackend): DeviceStore {
  return {
    async read(key, schema) {
      let raw: string | null;
      try {
        raw = await backend.get(PREFIX + key);
      } catch (error) {
        logStoreError('read', error);
        return null;
      }
      if (raw === null) {
        return null;
      }
      const parsed = schema.safeParse(parseJson(raw));
      if (!parsed.success) {
        // Sin el contenido: puede llevar datos del usuario.
        logger.warn('Device store: discarded an invalid value', { key });
        return null;
      }
      return parsed.data;
    },
    async write(key, value) {
      try {
        await backend.set(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (error) {
        logStoreError('write', error);
        return false;
      }
    },
    async remove(key) {
      try {
        await backend.remove(PREFIX + key);
      } catch (error) {
        logStoreError('remove', error);
      }
    },
    async removeUser(userId) {
      const prefix = PREFIX + userKey(userId, '');
      try {
        const keys = (await backend.keys()).filter((key) => key.startsWith(prefix));
        await Promise.all(keys.map((key) => backend.remove(key)));
      } catch (error) {
        logStoreError('removeUser', error);
      }
    },
  };
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function logStoreError(action: string, error: unknown): void {
  logger.error('Device store failed', {
    action,
    message: error instanceof Error ? error.message : 'Unknown error',
  });
}

let store: DeviceStore | null = null;

/** El almacén de este dispositivo: el del teléfono en la app y el del navegador fuera de ella. */
export function getDeviceStore(): DeviceStore {
  store ??= createDeviceStore(isNativeApp() ? nativeBackend : browserBackend);
  return store;
}
