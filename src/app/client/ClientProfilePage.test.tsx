import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@/core/i18n';
import { createFakeAuthService } from '@/test/fake-auth-service';
import { renderApp } from '@/test/render-app';

function clientAuth(options: Parameters<typeof createFakeAuthService>[0] = {}) {
  return createFakeAuthService({ signedInAs: 'client@example.test', ...options });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('perfil y cuenta (PR 1.13, D-058)', () => {
  it('el perfil del cliente: nombre, idioma, unidad, email, contraseña, textos legales y salir', async () => {
    const auth = clientAuth({
      profiles: { 'client@example.test': { displayName: 'Ana Cliente' } },
    });
    const { user } = await renderApp('/client', { auth });

    const [profileLink] = await screen.findAllByRole('link', { name: 'Profile' });
    await user.click(profileLink as HTMLElement);

    expect(await screen.findByLabelText('Name')).toHaveValue('Ana Cliente');
    expect(screen.getByTestId('account-email')).toHaveTextContent('client@example.test');
    // El email se ve, pero no es un campo que se pueda editar.
    expect(screen.queryByRole('textbox', { name: 'Email' })).toBeNull();
    expect(screen.getByRole('group', { name: 'Weight unit' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Change password' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Terms of use' })).toHaveAttribute(
      'href',
      '/legal/terms',
    );
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute(
      'href',
      '/legal/privacy',
    );
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeVisible();
    expect(screen.getByText('Powered by ATHLETE CORE')).toBeVisible();
  });

  it('cambiar el nombre lo guarda en el perfil', async () => {
    const auth = clientAuth();
    const { user } = await renderApp('/client/profile', { auth });

    const name = await screen.findByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Ana Nueva');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved.')).toBeVisible();
    expect(auth.profileOf('client@example.test').displayName).toBe('Ana Nueva');
  });

  it('un nombre de una letra no se guarda', async () => {
    const { user } = await renderApp('/client/profile', { auth: clientAuth() });

    const name = await screen.findByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'A');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Write at least 2 characters.')).toBeVisible();
  });

  it('cambiar el idioma cambia la app al momento y lo guarda en el perfil', async () => {
    const auth = clientAuth();
    const { user } = await renderApp('/client/profile', { auth });
    await screen.findByLabelText('Name');

    const main = screen.getByRole('main');
    await user.click(within(main).getByRole('button', { name: 'Español' }));

    expect(await screen.findByRole('heading', { name: 'Perfil' })).toBeVisible();
    expect(auth.profileOf('client@example.test').locale).toBe('es');
  });

  it('al entrar, la app toma el idioma del perfil (también en otro dispositivo)', async () => {
    const auth = clientAuth({ profiles: { 'client@example.test': { locale: 'es' } } });
    await renderApp('/client', { auth });

    expect(await screen.findByRole('heading', { name: 'Hoy' })).toBeVisible();
    expect(i18n.language).toBe('es');
  });

  it('cambiar la unidad a libras la guarda', async () => {
    const auth = clientAuth();
    const { user } = await renderApp('/client/profile', { auth });

    await user.click(await screen.findByRole('button', { name: 'Pounds (lb)' }));

    expect(screen.getByRole('button', { name: 'Pounds (lb)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(auth.profileOf('client@example.test').weightUnit).toBe('lb');
  });

  it('sin conexión, la unidad vuelve a la de antes y lo dice', async () => {
    const auth = clientAuth();
    const { user } = await renderApp('/client/profile', { auth });
    const pounds = await screen.findByRole('button', { name: 'Pounds (lb)' });
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    await user.click(pounds);

    expect(await screen.findByRole('alert')).toHaveTextContent('No connection. Please try again.');
    expect(screen.getByRole('button', { name: 'Kilograms (kg)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(auth.profileOf('client@example.test').weightUnit).toBe('kg');
  });

  it('cambiar la contraseña pide la actual y cierra las demás sesiones (D-042)', async () => {
    const auth = clientAuth();
    const { user } = await renderApp('/client/profile', { auth });

    await user.type(await screen.findByLabelText('Current password'), 'not-my-password');
    await user.type(screen.getByLabelText('New password'), 'a-new-password');
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The password is not correct.');

    await user.clear(screen.getByLabelText('Current password'));
    await user.type(screen.getByLabelText('Current password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    expect(
      await screen.findByText('Password changed. Your other devices have been signed out.'),
    ).toBeVisible();
    expect(auth.passwordOf('client@example.test')).toBe('a-new-password');
    expect(auth.otherSessionsClosed).toBe(1);
  });

  it('quien entró con un código por email no tiene que escribir la contraseña actual', async () => {
    await renderApp('/client/profile', { auth: clientAuth({ signedInWith: 'code' }) });

    expect(await screen.findByLabelText('New password')).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Change password' })).toBeEnabled(),
    );
    expect(screen.queryByLabelText('Current password')).toBeNull();
  });

  it('la coach tiene lo mismo en Ajustes, y "Cerrar sesión" ya no está en la cabecera', async () => {
    const auth = createFakeAuthService({ signedInAs: 'coach@example.test' });
    await renderApp('/coach/settings', { auth });

    expect(await screen.findByRole('heading', { name: 'My account' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Sign out' })).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Change password' })).toBeVisible();
  });
});
