import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FAKE_CODE, createFakeAuthService } from '@/test/fake-auth-service';
import { renderApp } from '@/test/render-app';

function signedOut() {
  return createFakeAuthService({ signedInAs: null });
}

async function fillSignup(
  user: Awaited<ReturnType<typeof renderApp>>['user'],
  {
    name = 'Nuevo Cliente',
    email = 'new@example.test',
    password = 'password-123',
    terms = true,
  } = {},
) {
  await user.type(await screen.findByLabelText('Name'), name);
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  if (terms) {
    await user.click(screen.getByRole('checkbox'));
  }
  await user.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('registro y confirmar el email (PR 1.7)', () => {
  it('desde /login se crea la cuenta, se confirma con el código y se entra', async () => {
    const auth = signedOut();
    const { user, router } = await renderApp('/login', { auth });

    await user.click(
      await screen.findByRole('link', { name: "Don't have an account? Create one" }),
    );
    await fillSignup(user);

    expect(await screen.findByText("We've sent a 6-digit code to new@example.test.")).toBeVisible();
    expect(router.state.location.pathname).toBe('/verify');
    await user.type(screen.getByLabelText('Code'), FAKE_CODE);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Sin coach todavía: la bienvenida.
    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
    // El navegador de los tests está en inglés de EE. UU.: la unidad inicial es lb (D-058).
    expect(auth.completedProfiles.get('new@example.test')).toEqual({
      displayName: 'Nuevo Cliente',
      locale: 'en',
      weightUnit: 'lb',
      termsVersion: 'draft-2026-11',
    });
  });

  it('sin aceptar los términos, o con una contraseña de 7 caracteres, no deja seguir', async () => {
    const auth = signedOut();
    const { user } = await renderApp('/signup', { auth });

    await fillSignup(user, { password: '1234567', terms: false });

    expect(screen.getByText('To create the account you need to accept the terms.')).toBeVisible();
    expect(screen.getByText('The password must have at least 8 characters.')).toBeVisible();
    expect(auth.sentCodes).toEqual([]);
  });

  it('el nombre necesita al menos 2 caracteres', async () => {
    const { user } = await renderApp('/signup', { auth: signedOut() });

    await fillSignup(user, { name: 'A' });

    expect(screen.getByText('Write at least 2 characters.')).toBeVisible();
  });

  it('con un email que ya tiene cuenta lo dice y resalta "He olvidado mi contraseña", sin cambiar de pantalla', async () => {
    const { user, router } = await renderApp('/signup', { auth: signedOut() });

    await fillSignup(user, { email: 'client@example.test' });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "There's already an account with this email.",
    );
    expect(screen.getByRole('link', { name: 'Forgot my password' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/signup');
  });

  it('con una cuenta pendiente, "Confirmar mi email" lleva a confirmar y vale la contraseña nueva (D-043)', async () => {
    const auth = signedOut();
    const { user } = await renderApp('/signup', { auth });

    await fillSignup(user, { email: 'pending@example.test', password: 'my-own-password' });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This account is waiting for email confirmation.',
    );

    await user.click(screen.getByRole('button', { name: 'Confirm my email' }));
    await user.type(await screen.findByLabelText('Code'), FAKE_CODE);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
    // La contraseña que había puesto otra persona ya no vale: vale la última.
    expect(auth.passwordOf('pending@example.test')).toBe('my-own-password');
  });

  it('si se cerró la app antes de confirmar, se escribe el email y se elige la contraseña', async () => {
    const auth = signedOut();
    const { user } = await renderApp('/verify', { auth });

    expect(await screen.findByRole('heading', { name: 'Confirm your email' })).toBeVisible();
    await user.type(screen.getByLabelText('Email'), 'pending@example.test');
    await user.click(screen.getByRole('button', { name: 'Send code' }));
    await user.type(await screen.findByLabelText('Code'), FAKE_CODE);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('heading', { name: 'Choose your password' })).toBeVisible();
    await user.type(screen.getByLabelText('New password'), 'chosen-later-1');
    await user.click(screen.getByRole('button', { name: 'Save password' }));

    expect(await screen.findByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
    expect(auth.passwordOf('pending@example.test')).toBe('chosen-later-1');
  });

  it('al entrar con una cuenta sin confirmar, "Confirmar mi email" lleva a /verify con un código nuevo', async () => {
    const auth = signedOut();
    const { user, router } = await renderApp('/login', { auth });

    await user.type(await screen.findByLabelText('Email'), 'pending@example.test');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.click(await screen.findByRole('button', { name: 'Confirm my email' }));

    expect(
      await screen.findByText("We've sent a 6-digit code to pending@example.test."),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe('/verify');
    expect(auth.sentCodes).toEqual([{ email: 'pending@example.test', kind: 'signup' }]);
  });

  it('en /login, un email sin cuenta resalta "Crear cuenta" y lleva el email', async () => {
    const { user, router } = await renderApp('/login', { auth: signedOut() });

    await user.type(await screen.findByLabelText('Email'), 'brand-new@example.test');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.click(await screen.findByRole('link', { name: 'Create account' }));

    expect(router.state.location.pathname).toBe('/signup');
    expect(await screen.findByLabelText('Email')).toHaveValue('brand-new@example.test');
  });

  it('los textos legales se abren y dicen que son un borrador', async () => {
    await renderApp('/legal/terms', { auth: signedOut() });
    expect(await screen.findByRole('heading', { name: 'Terms of use' })).toBeVisible();
    expect(screen.getByText('Draft')).toBeVisible();
  });

  it('la política de privacidad también', async () => {
    await renderApp('/legal/privacy');
    expect(await screen.findByRole('heading', { name: 'Privacy policy' })).toBeVisible();
    expect(screen.getByText('Draft')).toBeVisible();
  });
});
