import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type BackHandler = (event: { canGoBack: boolean }) => void;

const mocks = vi.hoisted(() => ({
  native: false,
  backHandler: null as BackHandler | null,
  addListener: vi.fn(),
  minimizeApp: vi.fn(),
  setStyle: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => mocks.native },
  SystemBars: { setStyle: mocks.setStyle },
  SystemBarsStyle: { Dark: 'DARK', Light: 'LIGHT', Default: 'DEFAULT' },
}));
vi.mock('@capacitor/app', () => ({
  App: { addListener: mocks.addListener, minimizeApp: mocks.minimizeApp },
}));

const { followColorScheme, startNativeShell, statusBarStyleFor } = await import('./native-shell');

beforeEach(() => {
  mocks.native = false;
  mocks.backHandler = null;
  mocks.addListener.mockImplementation((_event: string, handler: BackHandler) => {
    mocks.backHandler = handler;
    return Promise.resolve({ remove: vi.fn() });
  });
  mocks.minimizeApp.mockResolvedValue(undefined);
  mocks.setStyle.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
  document.documentElement.style.colorScheme = '';
});

describe('startNativeShell', () => {
  it('en el navegador no hace nada', () => {
    startNativeShell();
    expect(mocks.addListener).not.toHaveBeenCalled();
    expect(mocks.setStyle).not.toHaveBeenCalled();
  });

  it('en la app, "atrás" vuelve a la pantalla anterior si la hay', () => {
    mocks.native = true;
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    startNativeShell();

    mocks.backHandler?.({ canGoBack: true });
    expect(back).toHaveBeenCalledOnce();
    expect(mocks.minimizeApp).not.toHaveBeenCalled();
    back.mockRestore();
  });

  it('en la primera pantalla, "atrás" deja la app en segundo plano sin cerrarla', () => {
    mocks.native = true;
    startNativeShell();

    mocks.backHandler?.({ canGoBack: false });
    expect(mocks.minimizeApp).toHaveBeenCalledOnce();
  });
});

describe('statusBarStyleFor', () => {
  it('texto oscuro con la marca en modo claro y claro en el resto', () => {
    expect(statusBarStyleFor('light')).toBe('LIGHT');
    expect(statusBarStyleFor('dark')).toBe('DARK');
    expect(statusBarStyleFor('')).toBe('DARK');
  });
});

describe('followColorScheme', () => {
  it('cambia la barra de estado cuando cambia el modo de la marca, una vez por cambio', async () => {
    const root = document.createElement('div');
    const stop = followColorScheme(root);
    expect(mocks.setStyle).toHaveBeenLastCalledWith({ style: 'DARK' });

    root.style.colorScheme = 'light';
    await vi.waitFor(() => expect(mocks.setStyle).toHaveBeenLastCalledWith({ style: 'LIGHT' }));

    root.style.setProperty('--brand-primary', '#000');
    await Promise.resolve();
    expect(mocks.setStyle).toHaveBeenCalledTimes(2);
    stop();
  });
});
