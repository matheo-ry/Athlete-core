import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createFakeAuthService } from '@/test/fake-auth-service';
import { createFakeTenancySource } from '@/test/fake-tenancy-source';
import { renderApp, renderAppAs } from '@/test/render-app';

const brandPrimary = () => document.documentElement.style.getPropertyValue('--brand-primary');

function signedOut() {
  return createFakeAuthService({ signedInAs: null });
}

describe('primera pantalla y unirse con código (PR 1.9)', () => {
  it('sin sesión, la primera pantalla pide el código, con "Entrar" y "Soy coach" debajo', async () => {
    await renderApp('/start', { auth: signedOut() });

    expect(await screen.findByLabelText("Your coach's code")).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Already have an account? Sign in' })).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Are you a coach? Create your business' }),
    ).toBeVisible();
    // El idioma está arriba.
    expect(screen.getByRole('button', { name: 'Español' })).toBeVisible();
  });

  it('con un código en minúsculas se ve el coach con sus colores, y cómo seguir', async () => {
    const { user, router } = await renderApp('/start', { auth: signedOut() });

    await user.type(await screen.findByLabelText("Your coach's code"), 'norte001');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText("You're going to train with Norte Strength")).toBeVisible();
    expect(router.state.location.pathname).toBe('/join');
    expect(brandPrimary()).toBe('#0f766e');
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute(
      'href',
      '/signup?next=%2Fjoin%3Fcode%3DNORTE001',
    );
    expect(screen.getByRole('link', { name: 'I already have an account' })).toHaveAttribute(
      'href',
      '/login?next=%2Fjoin%3Fcode%3DNORTE001',
    );
  });

  it('el enlace /join?code=… sin sesión enseña la misma vista previa', async () => {
    await renderApp('/join?code=NORTE001', { auth: signedOut() });

    expect(await screen.findByText("You're going to train with Norte Strength")).toBeVisible();
  });

  it('al salir de la vista previa vuelve la marca de la plataforma', async () => {
    const { user } = await renderApp('/join?code=NORTE001', { auth: signedOut() });
    await screen.findByText("You're going to train with Norte Strength");

    await user.click(screen.getByRole('button', { name: 'Use another code' }));

    expect(await screen.findByLabelText("Your coach's code")).toBeVisible();
    expect(brandPrimary()).toBe('#2563eb');
  });

  it('un código que no existe lo dice y deja escribir otro', async () => {
    await renderApp('/join?code=ABCD2345', { auth: signedOut() });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "This code doesn't exist or is no longer valid. Ask your coach for the current code.",
    );
    expect(screen.getByLabelText("Your coach's code")).toBeVisible();
  });

  it('algo que no tiene forma de código se avisa sin preguntar a nadie', async () => {
    const tenancy = createFakeTenancySource();
    const { user } = await renderApp('/start', { auth: signedOut(), tenancy });

    await user.type(await screen.findByLabelText("Your coach's code"), 'ab');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      screen.getByText("This doesn't look like a code. Check it with your coach."),
    ).toBeVisible();
    expect(tenancy.failedAttempts).toBe(0);
  });

  it('con sesión y sin coach, "Unirme" lo une y lleva a su zona con la marca del coach', async () => {
    const { user, router } = await renderAppAs('nobody-yet@example.test', '/join?code=NORTE001');

    await user.click(await screen.findByRole('button', { name: 'Join' }));

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
    expect(brandPrimary()).toBe('#0f766e');
  });

  it('con el plan del coach lleno, lo dice', async () => {
    const { user } = await renderAppAs('nobody-yet@example.test', '/join?code=IRONLAB1');

    await user.click(await screen.findByRole('button', { name: 'Join' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your coach has no free spots right now. Let them know so they can make room for you.',
    );
  });

  it('quien fue dado de baja no vuelve a entrar con el código', async () => {
    const { user } = await renderAppAs('archived@example.test', '/join?code=NORTE001');

    await user.click(await screen.findByRole('button', { name: 'Join' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your coach has removed you. Ask them to reactivate you.',
    );
  });

  it('quien ya era cliente entra directamente en su zona', async () => {
    const { user, router } = await renderAppAs('client@example.test', '/join?code=IRONLAB1');

    await user.click(await screen.findByRole('button', { name: 'Join' }));

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/client');
  });

  it('la coach que usa su propio código lo sabe y puede ir a su negocio', async () => {
    const { user, router } = await renderAppAs('norte-coach@example.test', '/join?code=NORTE001');

    await user.click(await screen.findByRole('button', { name: 'Join' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("This is your own business's code.");
    await user.click(screen.getByRole('button', { name: 'Go to my business' }));
    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/coach');
  });

  it('tras 10 códigos equivocados, hay que esperar (D-052)', async () => {
    const tenancy = createFakeTenancySource();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await tenancy.previewInvite(`WRONG${attempt}X`);
    }
    await renderApp('/join?code=NORTE001', { auth: signedOut(), tenancy });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts. Try again in a few minutes.',
    );
  });
});
