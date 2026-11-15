// Borradores guardados en el dispositivo: lo que un usuario estaba editando y
// todavía no ha guardado (por ejemplo, una rutina, D-079). Cada módulo guarda
// los suyos con este prefijo, y al cerrar sesión se borran todos: en un
// dispositivo compartido, otra persona no debe ver lo que dejó a medias el
// anterior.

export const DEVICE_DRAFT_PREFIX = 'athlete-core.draft.';

/** Borra todos los borradores del dispositivo. Si el navegador no deja leer, no hay nada que borrar. */
export function clearDeviceDrafts(storage: Storage = localStorage): void {
  try {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(DEVICE_DRAFT_PREFIX) === true) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      storage.removeItem(key);
    }
  } catch {
    // Modo privado estricto: no se pudo guardar nada.
  }
}
