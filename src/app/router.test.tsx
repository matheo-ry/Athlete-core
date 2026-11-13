import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from '@/test/render-app';

describe('la app', () => {
  it('renderiza sin errores y "/" lleva a la zona del perfil activo (coach)', async () => {
    const { router } = await renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/coach');
  });

  it('cambia entre inglés y español con el selector de idioma', async () => {
    const { user } = await renderApp('/coach');
    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeInTheDocument();

    // La carcasa de coach tiene el selector dos veces (menú lateral y cabecera de móvil).
    const [spanish] = screen.getAllByRole('button', { name: 'Español' });
    expect(spanish).toBeDefined();
    await user.click(spanish as HTMLElement);

    expect(await screen.findByRole('heading', { name: 'Panel del coach' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');

    const [english] = screen.getAllByRole('button', { name: 'English' });
    await user.click(english as HTMLElement);

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeInTheDocument();
  });

  it('muestra la zona de cliente en /client', async () => {
    await renderApp('/client');

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
  });

  it('con el selector de desarrollo se pasa de coach a cliente', async () => {
    const { user, router } = await renderApp('/coach');
    const toolbar = await screen.findByTestId('dev-toolbar');

    await user.click(within(toolbar).getByRole('button', { name: 'Client' }));

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
  });

  it('al cambiar de marca en el selector cambia el tema', async () => {
    const { user } = await renderApp('/coach');
    const toolbar = await screen.findByTestId('dev-toolbar');
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--brand-primary')).toBe('#dc2626');

    await user.click(within(toolbar).getByRole('button', { name: 'Norte Strength' }));

    expect(root.style.getPropertyValue('--brand-primary')).toBe('#0f766e');
    expect(root.style.colorScheme).toBe('light');
    expect(screen.getAllByText('Norte Strength').length).toBeGreaterThan(0);
  });

  it('quien todavía no tiene coach va a la bienvenida y ve la marca de la plataforma', async () => {
    const { user, router } = await renderApp('/coach');
    const toolbar = await screen.findByTestId('dev-toolbar');
    expect(screen.queryByText('ATHLETE CORE')).not.toBeInTheDocument();

    await user.click(within(toolbar).getByRole('button', { name: 'No coach' }));

    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/welcome');
    expect(screen.getByText('ATHLETE CORE')).toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue('--brand-primary')).toBe('#2563eb');
  });

  it('desde "sin coach", ver como cliente vuelve a entrar en un tenant', async () => {
    const { user, router } = await renderApp('/coach');
    const toolbar = await screen.findByTestId('dev-toolbar');
    await user.click(within(toolbar).getByRole('button', { name: 'No coach' }));
    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument();

    await user.click(within(toolbar).getByRole('button', { name: 'Client' }));

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
    expect(screen.getAllByText('Iron Lab').length).toBeGreaterThan(0);
  });

  it('el menú se construye con los módulos registrados y sus pantallas cargan', async () => {
    const { user } = await renderApp('/coach');

    const [templateLink] = await screen.findAllByRole('link', { name: 'Template' });
    await user.click(templateLink as HTMLElement);

    expect(await screen.findByRole('heading', { name: 'Template (coach)' })).toBeInTheDocument();
    expect(await screen.findByText('Back squat')).toBeInTheDocument();
    expect(screen.getByText('Total volume: 5,500 kg')).toBeInTheDocument();
  });

  it('muestra la bienvenida y lleva a unirse con código', async () => {
    const { user } = await renderApp('/welcome');

    await user.click(await screen.findByRole('link', { name: 'I have a code' }));

    expect(await screen.findByRole('heading', { name: 'Join your coach' })).toBeInTheDocument();
  });

  it('rellena el código cuando llega en el enlace', async () => {
    await renderApp('/join?code=iron42');

    expect(await screen.findByLabelText('Coach code')).toHaveValue('IRON42');
  });

  it('muestra la página 404 en una ruta que no existe', async () => {
    await renderApp('/does-not-exist');

    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });
});
