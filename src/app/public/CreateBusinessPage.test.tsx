import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { rememberCoachIntent } from '@/core/tenancy';
import { FAKE_CODE, createFakeAuthService } from '@/test/fake-auth-service';
import { createFakeTenancySource } from '@/test/fake-tenancy-source';
import { renderApp, renderAppAs } from '@/test/render-app';

const brandPrimary = () => document.documentElement.style.getPropertyValue('--brand-primary');

describe('crear negocio y primeros pasos (PR 1.12, D-049)', () => {
  it('"¿Eres coach?": registro, confirmar el email y, al terminar, crear el negocio', async () => {
    const { user, router } = await renderApp('/start', {
      auth: createFakeAuthService({ signedInAs: null }),
    });

    await user.click(
      await screen.findByRole('link', { name: 'Are you a coach? Create your business' }),
    );
    await user.type(await screen.findByLabelText('Name'), 'Nueva Coach');
    await user.type(screen.getByLabelText('Email'), 'new-coach@example.test');
    await user.type(screen.getByLabelText('Password'), 'password-123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await user.type(await screen.findByLabelText('Code'), FAKE_CODE);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('heading', { name: 'Create your business' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/create-business');
  });

  it('pide un nombre de 2 caracteres y aceptar las condiciones para coaches', async () => {
    const { user } = await renderAppAs('nobody-yet@example.test', '/create-business');

    await user.type(await screen.findByLabelText('Business name'), 'F');
    await user.click(screen.getByRole('button', { name: 'Create business' }));

    expect(screen.getByText('Write at least 2 characters.')).toBeVisible();
    expect(
      screen.getByText('To create your business you need to accept the terms for coaches.'),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Terms for coaches' })).toHaveAttribute(
      'href',
      '/legal/coach-terms',
    );
  });

  it('al crearlo: su zona con su nombre, los colores de ATHLETE CORE y los primeros pasos', async () => {
    const { user, router } = await renderAppAs('nobody-yet@example.test', '/welcome');

    await user.click(await screen.findByRole('link', { name: 'Create my business' }));
    await user.type(await screen.findByLabelText('Business name'), 'Fuerza Sur');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Create business' }));

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/coach');
    expect(screen.getAllByText('Fuerza Sur').length).toBeGreaterThan(0);
    expect(brandPrimary()).toBe('#2563eb');
    expect(await screen.findByRole('heading', { name: 'First steps' })).toBeVisible();
    expect(screen.getByRole('link', { name: /Share your code/ })).toHaveAttribute(
      'href',
      '/coach/clients',
    );
    expect(screen.getByRole('link', { name: /Customize your brand/ })).toHaveAttribute(
      'href',
      '/coach/settings',
    );
  });

  it('con su primer cliente, los primeros pasos desaparecen', async () => {
    await renderAppAs('norte-coach@example.test', '/coach');

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeVisible();
    // Nora Coach ya tiene clientes activos (los de Norte Strength).
    await screen.findAllByText('Norte Strength');
    expect(screen.queryByRole('heading', { name: 'First steps' })).toBeNull();
  });

  it('quien ya es dueño de un negocio no puede crear otro: va a su zona', async () => {
    const { router } = await renderAppAs('norte-coach@example.test', '/create-business');

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/coach');
  });

  it('si se cerró la app tras pulsar "Soy coach", "/" lleva a crear el negocio', async () => {
    rememberCoachIntent();
    const auth = createFakeAuthService({ signedInAs: 'nobody-yet@example.test' });
    const tenancy = createFakeTenancySource({
      currentEmail: () => auth.currentUser?.email ?? null,
    });
    const { router } = await renderApp('/', { auth, tenancy });

    expect(await screen.findByRole('heading', { name: 'Create your business' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/create-business');
  });

  it('las condiciones para coaches se abren y dicen que son un borrador', async () => {
    await renderApp('/legal/coach-terms');

    expect(await screen.findByRole('heading', { name: 'Terms for coaches' })).toBeVisible();
    expect(screen.getByText('Draft')).toBeVisible();
  });

  it('"Ajustes" está en el menú del coach', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach');

    const [settings] = await screen.findAllByRole('link', { name: 'Settings' });
    await user.click(settings as HTMLElement);

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeVisible();
  });
});
