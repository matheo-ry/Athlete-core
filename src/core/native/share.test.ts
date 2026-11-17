import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as platform from './platform';
import { shareOrDownloadFile } from './share';

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: {
    writeFile: vi.fn(),
  },
}));

vi.mock('@capacitor/share', () => ({
  Share: {
    share: vi.fn(),
  },
}));

describe('shareOrDownloadFile (D-131, D-149)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('en app nativa (Android / iOS)', () => {
    beforeEach(() => {
      vi.spyOn(platform, 'isNativeApp').mockReturnValue(true);
    });

    it('escribe en Directory.Cache y abre el menú de compartir con el archivo', async () => {
      vi.mocked(Filesystem.writeFile).mockResolvedValue({
        uri: 'file:///data/user/0/app/cache/entrenos.xlsx',
      });
      vi.mocked(Share.share).mockResolvedValue({} as never);

      const blob = new Blob(['dummy excel content'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const outcome = await shareOrDownloadFile(blob, 'entrenos.xlsx');

      expect(outcome).toBe('shared');
      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: 'entrenos.xlsx',
        data: expect.any(String),
        directory: Directory.Cache,
      });
      expect(Share.share).toHaveBeenCalledWith({
        title: 'entrenos.xlsx',
        files: ['file:///data/user/0/app/cache/entrenos.xlsx'],
      });
    });

    it('detecta cancelación del usuario al compartir sin considerarlo fallo', async () => {
      vi.mocked(Filesystem.writeFile).mockResolvedValue({
        uri: 'file:///cache/entrenos.xlsx',
      });
      vi.mocked(Share.share).mockRejectedValue(new Error('Share canceled'));

      const blob = new Blob(['test']);
      const outcome = await shareOrDownloadFile(blob, 'entrenos.xlsx');

      expect(outcome).toBe('cancelled');
    });

    it('devuelve failed si falla la escritura del archivo', async () => {
      vi.mocked(Filesystem.writeFile).mockRejectedValue(new Error('Disk full'));

      const blob = new Blob(['test']);
      const outcome = await shareOrDownloadFile(blob, 'entrenos.xlsx');

      expect(outcome).toBe('failed');
    });
  });

  describe('en web (escritorio y navegador)', () => {
    beforeEach(() => {
      vi.spyOn(platform, 'isNativeApp').mockReturnValue(false);
    });

    it('descarga el archivo mediante elemento <a download>', async () => {
      const createObjectURL = vi.fn().mockReturnValue('blob:test');
      const revokeObjectURL = vi.fn();
      globalThis.URL.createObjectURL = createObjectURL;
      globalThis.URL.revokeObjectURL = revokeObjectURL;

      const clickMock = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue({
        set href(_val: string) {},
        set download(_val: string) {},
        click: clickMock,
      } as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as unknown as Node);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as unknown as Node);

      const blob = new Blob(['excel data']);
      const outcome = await shareOrDownloadFile(blob, 'entrenos.xlsx');

      expect(outcome).toBe('downloaded');
      expect(createObjectURL).toHaveBeenCalledWith(blob);
      expect(clickMock).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    it('devuelve failed si falla la creación del enlace o la descarga', async () => {
      globalThis.URL.createObjectURL = vi.fn().mockImplementation(() => {
        throw new Error('ObjectURL failed');
      });

      const blob = new Blob(['test']);
      const outcome = await shareOrDownloadFile(blob, 'entrenos.xlsx');

      expect(outcome).toBe('failed');
    });
  });
});
