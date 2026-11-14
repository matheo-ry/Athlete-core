import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFakeAuthService } from '@/test/fake-auth-service';
import { renderApp } from '@/test/render-app';

const DAY = 24 * 60 * 60 * 1000;

function signedOut() {
  return createFakeAuthService({ signedInAs: null });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('entrar y cerrar sesión (PR 1.3)', () => {
  it('sin sesión, la zona de coach lleva a /login y recuerda adónde se iba', async () => {
    const { router } = await renderApp('/coach', { auth: signedOut() });

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe('?next=%2Fcoach');
  });

  it('sin sesión, la zona de cliente también lleva a /login', async () => {
    const { router } = await renderApp('/client', { auth: signedOut() });

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('al entrar vuelve a la pantalla que se había pedido', async () => {
    const { user, router } = await renderApp('/client', { auth: signedOut() });

    await user.type(await screen.findByLabelText('Email'), 'client@example.test');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
  });

  it('con la contraseña mala lo dice y no borra el email', async () => {
    const { user, router } = await renderApp('/login', { auth: signedOut() });

    await user.type(await screen.findByLabelText('Email'), 'coach@example.test');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The password is not correct.');
    expect(screen.getByLabelText('Email')).toHaveValue('coach@example.test');
    expect(router.state.location.pathname).toBe('/login');
  });

  it('con un email sin cuenta lo dice', async () => {
    const { user } = await renderApp('/login', { auth: signedOut() });

    await user.type(await screen.findByLabelText('Email'), 'nobody@example.test');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "There's no account with this email.",
    );
  });

  it('con una cuenta sin confirmar lo dice', async () => {
    const { user } = await renderApp('/login', { auth: signedOut() });

    await user.type(await screen.findByLabelText('Email'), 'pending@example.test');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This account is waiting for email confirmation.',
    );
  });

  it('comprueba los campos antes de enviar', async () => {
    const { user } = await renderApp('/login', { auth: signedOut() });

    await user.type(await screen.findByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Enter a valid email.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
  });

  it('sin conexión avisa y no intenta entrar', async () => {
    const auth = signedOut();
    const signIn = vi.spyOn(auth, 'signInWithPassword');
    const { user } = await renderApp('/login', { auth });
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    await user.type(await screen.findByLabelText('Email'), 'coach@example.test');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No connection. Please try again.');
    expect(signIn).not.toHaveBeenCalled();
  });

  it('el botón de mostrar deja ver la contraseña', async () => {
    const { user } = await renderApp('/login', { auth: signedOut() });
    const password = await screen.findByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(password).toHaveAttribute('type', 'text');
  });

  it('cerrar sesión lleva a /login y la zona de cliente deja de abrirse', async () => {
    const auth = createFakeAuthService({ signedInAs: 'client@example.test' });
    const { user, router } = await renderApp('/client', { auth });
    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe('');
    expect(screen.queryByText('Your session has expired. Please sign in again.')).toBeNull();

    await act(() => router.navigate('/client'));
    expect(router.state.location.pathname).toBe('/login');
  });

  it('con sesión, /login lleva al inicio', async () => {
    const { router } = await renderApp('/login');

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/coach');
  });

  it('si la sesión caduca sola, avisa al volver a /login', async () => {
    const auth = createFakeAuthService();
    await renderApp('/coach', { auth });
    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeInTheDocument();

    act(() => auth.expireSession());

    expect(
      await screen.findByText('Your session has expired. Please sign in again.'),
    ).toBeInTheDocument();
  });

  it('pasados 31 días sin abrir la app, hay que volver a entrar (D-045)', async () => {
    localStorage.setItem('athlete-core.lastActiveAt', String(Date.now() - 31 * DAY));
    const auth = createFakeAuthService({ signedInAs: 'client@example.test' });
    const signOut = vi.spyOn(auth, 'signOut');

    const { router } = await renderApp('/client', { auth });

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(screen.getByText('Your session has expired. Please sign in again.')).toBeInTheDocument();
    expect(signOut).toHaveBeenCalled();
  });

  it('a los 29 días la sesión sigue abierta', async () => {
    localStorage.setItem('athlete-core.lastActiveAt', String(Date.now() - 29 * DAY));
    const auth = createFakeAuthService({ signedInAs: 'client@example.test' });

    await renderApp('/client', { auth });

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
  });
});
