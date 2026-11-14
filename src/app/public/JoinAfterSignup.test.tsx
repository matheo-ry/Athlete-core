import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BRAND } from '@/core/branding';
import { rememberPendingInvite } from '@/core/tenancy';
import { FAKE_CODE, createFakeAuthService } from '@/test/fake-auth-service';
import { TEST_TENANTS } from '@/test/fake-tenancy-source';
import { renderApp, renderAppAs } from '@/test/render-app';

const brandPrimary = () => document.documentElement.style.getPropertyValue('--brand-primary');

function signedOut() {
  return createFakeAuthService({ signedInAs: null });
}

describe('unirse al crear la cuenta (PR 1.9b, D-037)', () => {
  it('código, crear la cuenta con la marca del coach, confirmar y dentro sin volver a escribirlo', async () => {
    const { user, router } = await renderApp('/start', { auth: signedOut() });

    await user.type(await screen.findByLabelText("Your coach's code"), 'norte001');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(await screen.findByRole('link', { name: 'Create account' }));

    // El registro se ve con la marca del coach y recuerda a quién se une.
    expect(await screen.findByRole('heading', { name: 'Create your account' })).toBeVisible();
    expect(screen.getByText("You're joining Norte Strength.")).toBeVisible();
    expect(brandPrimary()).toBe('#0f766e');

    await user.type(screen.getByLabelText('Name'), 'Nueva Clienta');
    await user.type(screen.getByLabelText('Email'), 'brand-new@example.test');
    await user.type(screen.getByLabelText('Password'), 'password-123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    // También al confirmar el email. (Primero se espera a esa pantalla: el
    // mismo texto está en la de registro, que se está yendo.)
    const code = await screen.findByLabelText('Code');
    expect(screen.getByText("You're joining Norte Strength.")).toBeVisible();
    await user.type(code, FAKE_CODE);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
    expect(brandPrimary()).toBe('#0f766e');
    expect(localStorage.getItem('athlete-core.pendingInvite')).toBeNull();
  });

  it('con "Ya tengo cuenta": entrar y quedar unido solo', async () => {
    const { user, router } = await renderApp('/join?code=NORTE001', { auth: signedOut() });

    await user.click(await screen.findByRole('link', { name: 'I already have an account' }));
    expect(await screen.findByText("You're joining Norte Strength.")).toBeVisible();
    await user.type(screen.getByLabelText('Email'), 'nobody-yet@example.test');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
  });

  it('si se cerró la app a medias, "/" lleva a terminar el alta', async () => {
    rememberPendingInvite({
      code: 'NORTE001',
      name: TEST_TENANTS.norte.name,
      branding: TEST_TENANTS.norte.branding,
    });
    const { router } = await renderAppAs('nobody-yet@example.test', '/');

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
  });

  it('si el alta no sale (plan lleno), lo dice y el código deja de estar pendiente', async () => {
    rememberPendingInvite({ code: 'IRONLAB1', name: 'Iron Lab', branding: DEFAULT_BRAND });
    await renderAppAs('nobody-yet@example.test', '/join?code=IRONLAB1');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your coach has no free spots right now.',
    );
    expect(localStorage.getItem('athlete-core.pendingInvite')).toBeNull();
  });

  it('cerrar sesión olvida el código pendiente (en un dispositivo compartido)', async () => {
    rememberPendingInvite({ code: 'NORTE001', name: 'Norte', branding: DEFAULT_BRAND });
    const auth = createFakeAuthService({ signedInAs: 'client@example.test' });
    const { user, router } = await renderApp('/client/profile', { auth });
    await screen.findByRole('heading', { name: 'Profile' });

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(localStorage.getItem('athlete-core.pendingInvite')).toBeNull();
  });

  it('si la sesión caduca sola, el código pendiente se conserva', async () => {
    rememberPendingInvite({ code: 'NORTE001', name: 'Norte', branding: DEFAULT_BRAND });
    const auth = createFakeAuthService({ signedInAs: 'client@example.test' });
    await renderApp('/client', { auth });
    await screen.findByRole('heading', { name: 'Today' });

    act(() => auth.expireSession());

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(localStorage.getItem('athlete-core.pendingInvite')).not.toBeNull();
  });

  it('sin código recordado, las pantallas de cuenta llevan la marca de la plataforma', async () => {
    await renderApp('/login', { auth: signedOut() });
    await screen.findByRole('heading', { name: 'Sign in' });

    expect(screen.queryByText(/You're joining/)).toBeNull();
    expect(brandPrimary()).toBe('#2563eb');
  });
});
