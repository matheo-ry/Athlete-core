import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createFakeAuthService } from '@/test/fake-auth-service';
import { createFakeTenancySource } from '@/test/fake-tenancy-source';
import { renderApp, renderAppAs } from '@/test/render-app';

const brandPrimary = () => document.documentElement.style.getPropertyValue('--brand-primary');

describe('la app', () => {
  it('la coach entra en su zona con la marca de su negocio', async () => {
    const { router } = await renderAppAs('coach@example.test', '/');

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/coach');
    expect(screen.getAllByText('Iron Lab').length).toBeGreaterThan(0);
    expect(brandPrimary()).toBe('#dc2626');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('un cliente entra en su zona con la marca de su coach', async () => {
    const { router } = await renderAppAs('norte-client@example.test', '/');

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
    expect(screen.getAllByText('Norte Strength').length).toBeGreaterThan(0);
    expect(brandPrimary()).toBe('#0f766e');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('un cliente que escribe /coach vuelve a su zona (D-056)', async () => {
    const { router } = await renderAppAs('client@example.test', '/coach');

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
  });

  it('la coach que escribe /client vuelve a su zona', async () => {
    const { router } = await renderAppAs('coach@example.test', '/client');

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/coach');
  });

  it('quien no tiene ningún espacio va a la bienvenida con la marca de la plataforma', async () => {
    const { router } = await renderAppAs('nobody-yet@example.test', '/coach');

    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/welcome');
    expect(screen.getByText('ATHLETE CORE')).toBeInTheDocument();
    expect(brandPrimary()).toBe('#2563eb');
  });

  it('quien fue dado de baja de su único coach también va a la bienvenida', async () => {
    const { router } = await renderAppAs('archived@example.test', '/client');

    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/welcome');
  });

  it('con un espacio, /welcome lleva a su zona', async () => {
    const { router } = await renderAppAs('client@example.test', '/welcome');

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
  });

  it('con dos espacios entra en el de coach hasta que llegue el selector (PR 1.14)', async () => {
    const { router } = await renderAppAs('dual@example.test', '/');

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/coach');
    expect(brandPrimary()).toBe('#dc2626');
  });

  it('sin sesión, "/" lleva a entrar y la bienvenida también', async () => {
    const auth = createFakeAuthService({ signedInAs: null });
    const { router } = await renderApp('/', { auth });

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');

    await act(() => router.navigate('/welcome'));
    expect(router.state.location.pathname).toBe('/login');
  });

  it('al entrar con la cuenta de otro rol, la app cambia de zona y de marca', async () => {
    const auth = createFakeAuthService({ signedInAs: null });
    const { user, router } = await renderApp('/login', { auth });

    await user.type(await screen.findByLabelText('Email'), 'norte-client@example.test');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
    expect(brandPrimary()).toBe('#0f766e');
  });

  it('si no se pueden cargar los espacios, lo dice y deja reintentar', async () => {
    await renderApp('/', { tenancy: createFakeTenancySource({ fail: true }) });

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('si no se pueden cargar los flags del negocio, lo dice y deja reintentar', async () => {
    const flags = { listEnabledFeatures: () => Promise.reject(new Error('fake failure')) };
    await renderApp('/coach', { flags });

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('cambia entre inglés y español con el selector de idioma', async () => {
    const { user } = await renderApp('/coach');
    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeInTheDocument();

    // La carcasa de coach tiene el selector dos veces (menú lateral y cabecera de móvil).
    const [spanish] = screen.getAllByRole('button', { name: 'Español' });
    await user.click(spanish as HTMLElement);

    expect(await screen.findByRole('heading', { name: 'Panel del coach' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');

    const [english] = screen.getAllByRole('button', { name: 'English' });
    await user.click(english as HTMLElement);

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeInTheDocument();
  });

  it('el menú se construye con los módulos registrados y sus pantallas cargan', async () => {
    const { user } = await renderApp('/coach');

    const [templateLink] = await screen.findAllByRole('link', { name: 'Template' });
    await user.click(templateLink as HTMLElement);

    expect(await screen.findByRole('heading', { name: 'Template (coach)' })).toBeInTheDocument();
    expect(await screen.findByText('Back squat')).toBeInTheDocument();
    expect(screen.getByText('Total volume: 5,500 kg')).toBeInTheDocument();
  });

  it('la bienvenida lleva a unirse con código', async () => {
    const { user } = await renderAppAs('nobody-yet@example.test', '/welcome');

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
