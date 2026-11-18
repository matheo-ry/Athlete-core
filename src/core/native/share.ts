// Compartir un enlace o un archivo con lo que ofrezca el dispositivo. Hoy usa las
// funciones del navegador / Web Share API; en la app móvil abre el menú nativo de
// compartir/guardar (D-131, D-150).

import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

import { isNativeApp } from './platform';

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

async function blobToBase64(blob: Blob): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] ?? '';
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * En la app nativa (Android / iOS) escribe el archivo en la caché del dispositivo
 * y abre el menú nativo de compartir/guardar con @capacitor/share (D-150).
 * En la web descarga el archivo mediante un enlace temporal <a download>.
 */
export async function shareOrDownloadFile(blob: Blob, fileName: string): Promise<FileShareOutcome> {
  if (isNativeApp()) {
    try {
      const base64Data = await blobToBase64(blob);
      const written = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: fileName,
        files: [written.uri],
      });
      return 'shared';
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.toLowerCase().includes('cancel') ||
          error.message.toLowerCase().includes('abort') ||
          error.name === 'AbortError')
      ) {
        return 'cancelled';
      }
      return 'failed';
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
