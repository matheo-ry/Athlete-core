// Compartir un enlace o un archivo con lo que ofrezca el dispositivo. Hoy usa las
// funciones del navegador / Web Share API; en la app móvil abre el menú nativo de
// compartir/guardar (D-131).

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';
export type FileShareOutcome = 'shared' | 'downloaded' | 'cancelled' | 'failed';

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

/**
 * En el móvil abre el menú nativo de compartir/guardar si el dispositivo lo permite;
 * en la web descarga el archivo directamente en el navegador (D-131).
 */
export async function shareOrDownloadFile(blob: Blob, fileName: string): Promise<FileShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      const file = new File([blob], fileName, {
        type: blob.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
        });
        return 'shared';
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  // Descarga en navegador web
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
