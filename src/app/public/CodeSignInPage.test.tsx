import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FAKE_CODE, createFakeAuthService } from '@/test/fake-auth-service';
import { renderApp } from '@/test/render-app';

function signedOut() {
  return createFakeAuthService({ signedInAs: null });
}

describe('entrar con un código por email (PR 1.6, D-039)', () => {
  it('desde /login: email, código y dentro, sin contraseña', async () => {
    const auth = signedOut();
    const { user, router } = await renderApp('/login?next=%2Fclient', { auth });

    await user.type(await screen.findByLabelText('Email'), 'client@example.test');
    await user.click(screen.getByRole('link', { name: 'Sign in with a code by email' }));

    // El email escrito en /login viaja a la pantalla siguiente.
    expect(await screen.findByLabelText('Email')).toHaveValue('client@example.test');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    expect(auth.sentCodes).toEqual([{ email: 'client@example.test', kind: 'sign-in' }]);

    await user.type(await screen.findByLabelText('Code'), FAKE_CODE);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
  });

  it('con un email sin cuenta lo dice y no envía nada', async () => {
    const auth = signedOut();
    const { user } = await renderApp('/login/code', { auth });

    await user.type(await screen.findByLabelText('Email'), 'nobody@example.test');
    await user.click(screen.getByRole('button', { name: 'Send code' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "There's no account with this email.",
    );
    expect(auth.sentCodes).toEqual([]);
  });

  it('"Usar otro email" vuelve al primer paso', async () => {
    const { user } = await renderApp('/login/code', { auth: signedOut() });

    await user.type(await screen.findByLabelText('Email'), 'client@example.test');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    await user.click(await screen.findByRole('button', { name: 'Use another email' }));

    expect(await screen.findByRole('heading', { name: 'Sign in with a code' })).toBeVisible();
  });

  it('pide el código completo antes de enviarlo', async () => {
    const { user } = await renderApp('/login/code', { auth: signedOut() });

    await user.type(await screen.findByLabelText('Email'), 'client@example.test');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    await user.type(await screen.findByLabelText('Code'), '123');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Enter the 6 digits of the code.')).toBeVisible();
  });
});
