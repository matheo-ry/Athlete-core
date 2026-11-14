// Compartir un enlace con lo que ofrezca el dispositivo. Hoy usa las funciones
// del navegador; en la Fase 4, si la app de móvil lo necesita, aquí se conecta
// el plugin de Capacitor sin tocar a quien la usa.

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Abre el menú de compartir del dispositivo o, si no hay, copia el enlace. */
export async function shareOrCopyLink(url: string, title: string): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url });
      return 'shared';
    } catch (error) {
      // Cerrar el menú sin elegir nada no es un error.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }
  return (await copyText(url)) ? 'copied' : 'failed';
}

/** Copia un texto. `false` si el dispositivo no deja. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
