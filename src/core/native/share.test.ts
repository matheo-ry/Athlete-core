import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { shareOrDownloadFile } from './share';

describe('shareOrDownloadFile (D-131)', () => {
  const originalNavigator = { ...globalThis.navigator };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('usa navigator.share si está disponible y puede compartir archivos', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    const canShareMock = vi.fn().mockReturnValue(true);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        ...originalNavigator,
        share: shareMock,
        canShare: canShareMock,
      },
      writable: true,
      configurable: true,
    });

    const blob = new Blob(['test content'], { type: 'text/plain' });
    const outcome = await shareOrDownloadFile(blob, 'test.txt');

    expect(outcome).toBe('shared');
    expect(canShareMock).toHaveBeenCalled();
    expect(shareMock).toHaveBeenCalled();
    const shareCall = shareMock.mock.calls[0]?.[0] as { title?: string; files?: File[] };
    expect(shareCall.title).toBe('test.txt');
    expect(shareCall.files?.[0]).toBeInstanceOf(File);
  });

  it('hace descarga por enlace si no hay navigator.share para archivos', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        ...originalNavigator,
        share: undefined,
        canShare: undefined,
      },
      writable: true,
      configurable: true,
    });

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

  it('detecta cancelación del usuario al compartir sin considerarlo fallo', async () => {
    const abortErr = new DOMException('User cancelled', 'AbortError');
    const shareMock = vi.fn().mockRejectedValue(abortErr);
    const canShareMock = vi.fn().mockReturnValue(true);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        ...originalNavigator,
        share: shareMock,
        canShare: canShareMock,
      },
      writable: true,
      configurable: true,
    });

    const blob = new Blob(['test']);
    const outcome = await shareOrDownloadFile(blob, 'test.xlsx');

    expect(outcome).toBe('cancelled');
  });
});
