import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FAKE_CODE, createFakeAuthService } from '@/test/fake-auth-service';
import { renderApp } from '@/test/render-app';

function signedOut() {
  return createFakeAuthService({ signedInAs: null });
}

describe('recuperar la contraseña (PR 1.6, D-042)', () => {
  it('email, código y contraseña nueva: queda dentro y se cierran las demás sesiones', async () => {
    const auth = signedOut();
    const { user, router } = await renderApp('/reset-password', { auth });

    await user.type(await screen.findByLabelText('Email'), 'client@example.test');
    await user.click(screen.getByRole('button', { name: 'Send code' }));

    expect(
      await screen.findByText("We've sent a 6-digit code to client@example.test."),
    ).toBeVisible();
    expect(auth.sentCodes).toEqual([{ email: 'client@example.test', kind: 'reset' }]);

    await user.type(screen.getByLabelText('Code'), FAKE_CODE);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('heading', { name: 'Choose a new password' })).toBeVisible();
    await user.type(screen.getByLabelText('New password'), 'new-password-1');
    await user.click(screen.getByRole('button', { name: 'Save password' }));

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
    expect(auth.passwordOf('client@example.test')).toBe('new-password-1');
    expect(auth.otherSessionsClosed).toBe(1);
  });

  it('con un email sin cuenta lo dice y no envía nada', async () => {
    const auth = signedOut();
    const { user } = await renderApp('/reset-password', { auth });

    await user.type(await screen.findByLabelText('Email'), 'nobody@example.test');
    await user.click(screen.getByRole('button', { name: 'Send code' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "There's no account with this email.",
    );
    expect(auth.sentCodes).toEqual([]);
  });

  it('con un código equivocado lo dice', async () => {
    const { user } = await renderApp('/reset-password', { auth: signedOut() });

    await user.type(await screen.findByLabelText('Email'), 'client@example.test');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    await user.type(await screen.findByLabelText('Code'), '000000');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The code is not correct or has expired.',
    );
  });

  it('un código pegado con espacios vale igual', async () => {
    const { user } = await renderApp('/reset-password', { auth: signedOut() });

    await user.type(await screen.findByLabelText('Email'), 'client@example.test');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    const code = await screen.findByLabelText('Code');
    await user.click(code);
    await user.paste('123 456');

    expect(code).toHaveValue('123456');
    expect(code).toHaveAttribute('inputmode', 'numeric');
  });

  it('"Enviar otro código" no se puede pulsar hasta que pasan 60 segundos', async () => {
    const { user } = await renderApp('/reset-password', { auth: signedOut() });

    await user.type(await screen.findByLabelText('Email'), 'client@example.test');
    await user.click(screen.getByRole('button', { name: 'Send code' }));

    const resend = await screen.findByRole('button', { name: /Send another code in \d+ s/ });
    expect(resend).toBeDisabled();
  });

  it('pide 8 caracteres y que la contraseña nueva sea distinta', async () => {
    const auth = signedOut();
    const { user } = await renderApp('/reset-password', { auth });

    await user.type(await screen.findByLabelText('Email'), 'client@example.test');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    await user.type(await screen.findByLabelText('Code'), FAKE_CODE);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    const password = await screen.findByLabelText('New password');

    await user.type(password, '1234567');
    await user.click(screen.getByRole('button', { name: 'Save password' }));
    expect(screen.getByText('The password must have at least 8 characters.')).toBeVisible();

    await user.clear(password);
    await user.type(password, 'password123');
    await user.click(screen.getByRole('button', { name: 'Save password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The new password must be different from the old one.',
    );
  });

  it('desde /login, la contraseña mala resalta "He olvidado mi contraseña" y lleva el email', async () => {
    const { user, router } = await renderApp('/login', { auth: signedOut() });

    await user.type(await screen.findByLabelText('Email'), 'coach@example.test');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByRole('alert');

    const [highlighted] = screen.getAllByRole('link', { name: 'Forgot my password' });
    await user.click(highlighted as HTMLElement);

    expect(router.state.location.pathname).toBe('/reset-password');
    expect(await screen.findByLabelText('Email')).toHaveValue('coach@example.test');
  });
});
