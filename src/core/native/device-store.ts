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
}

const nativeBackend: KeyValueBackend = {
  get: async (key) => (await Preferences.get({ key })).value,
  set: (key, value) => Preferences.set({ key, value }),
  remove: (key) => Preferences.remove({ key }),
};

// En el navegador, en modo privado estricto, `localStorage` puede fallar: se
// comporta como un almacén vacío que no guarda nada.
const browserBackend: KeyValueBackend = {
  get: (key) => Promise.resolve(safely(() => localStorage.getItem(key), null)),
  set: (key, value) => Promise.resolve(safely(() => localStorage.setItem(key, value), undefined)),
  remove: (key) => Promise.resolve(safely(() => localStorage.removeItem(key), undefined)),
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
