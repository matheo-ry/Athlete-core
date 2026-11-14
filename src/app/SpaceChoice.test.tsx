import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { readLastSpace, rememberLastSpace } from '@/core/tenancy';
import { createFakeAuthService } from '@/test/fake-auth-service';
import { TEST_TENANTS } from '@/test/fake-tenancy-source';
import { renderApp, renderAppAs } from '@/test/render-app';

// Selector de espacio y "Mis espacios" (PR 1.14, D-056 y D-066). La cuenta
// dual@example.test es dueña de Iron Lab y clienta de Norte Strength.

const brandPrimary = () => document.documentElement.style.getPropertyValue('--brand-primary');
const DUAL = 'dual@example.test';
const DUAL_ID = `user-${DUAL}`;

describe('elegir espacio (PR 1.14)', () => {
  it('con dos espacios y ninguno elegido, el selector: primero su negocio, con la marca de la plataforma', async () => {
    const { router } = await renderAppAs(DUAL, '/');

    expect(await screen.findByRole('heading', { name: 'Where do you want to go?' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/select');
    const [first, second] = within(screen.getByRole('list', { name: 'Your spaces' })).getAllByRole(
      'button',
    );
    // Cada fila: las iniciales del negocio, su nombre y cómo se entra.
    expect(first).toHaveTextContent(/^ILIron LabCoach$/);
    expect(second).toHaveTextContent(/^NSNorte StrengthClient$/);
    expect(brandPrimary()).toBe('#2563eb');
  });

  it('al elegir, entra en esa zona con su marca y lo recuerda en el dispositivo', async () => {
    const { user, router } = await renderAppAs(DUAL, '/');

    await user.click(await screen.findByRole('button', { name: /Norte Strength/ }));

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/client');
    expect(brandPrimary()).toBe('#0f766e');
    expect(readLastSpace(DUAL_ID)).toBe(TEST_TENANTS.norte.id);
  });

  it('con un espacio recordado, entra directamente en él', async () => {
    rememberLastSpace(DUAL_ID, TEST_TENANTS.norte.id);
    const { router } = await renderAppAs(DUAL, '/');

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/client');
  });

  it('sin elegir, las zonas llevan al selector', async () => {
    const { router } = await renderAppAs(DUAL, '/coach');

    expect(await screen.findByRole('heading', { name: 'Where do you want to go?' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/select');
  });

  it('con un solo espacio no se ve nunca el selector', async () => {
    const { router } = await renderAppAs('client@example.test', '/select');

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/client');
  });

  it('desde "Mis espacios" cambia a su negocio, con su marca', async () => {
    rememberLastSpace(DUAL_ID, TEST_TENANTS.norte.id);
    const { user, router } = await renderAppAs(DUAL, '/client/profile');

    const spaces = await screen.findByRole('list', { name: 'Your spaces' });
    expect(within(spaces).getByText("You're here")).toBeVisible();
    await user.click(within(spaces).getByRole('button', { name: /Iron Lab/ }));

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/coach');
    expect(brandPrimary()).toBe('#dc2626');
    expect(readLastSpace(DUAL_ID)).toBe(TEST_TENANTS.iron.id);
  });

  it('cerrar sesión olvida el espacio: al volver a entrar se elige otra vez (D-066)', async () => {
    rememberLastSpace(DUAL_ID, TEST_TENANTS.iron.id);
    const { user, router } = await renderAppAs(DUAL, '/coach/settings');

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/login');
    expect(readLastSpace(DUAL_ID)).toBeNull();
  });

  it('"Crear mi negocio" desde "Mis espacios": entra en su negocio y ya tiene dos espacios', async () => {
    const { user, router } = await renderAppAs('norte-client@example.test', '/client/profile');

    await user.click(await screen.findByRole('link', { name: 'Create my business' }));
    await user.type(await screen.findByLabelText('Business name'), 'Diego Fuerza');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Create business' }));

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/coach');

    const [settings] = screen.getAllByRole('link', { name: 'Settings' });
    await user.click(settings as HTMLElement);
    const spaces = await screen.findByRole('list', { name: 'Your spaces' });
    expect(within(spaces).getAllByRole('listitem')).toHaveLength(2);
    expect(within(spaces).getByRole('button', { name: /Norte Strength/ })).toBeVisible();
    // Ya es dueño de un negocio: no puede crear otro.
    expect(screen.queryByRole('link', { name: 'Create my business' })).toBeNull();
  });

  it('"Añadir un coach con código": se une y entra en el nuevo', async () => {
    // client@example.test es clienta de Iron Lab; se une también a Norte Strength.
    const { user, router } = await renderAppAs('client@example.test', '/client/profile');

    await user.click(await screen.findByRole('link', { name: 'Add a coach with a code' }));
    expect(await screen.findByRole('link', { name: 'Back' })).toBeVisible();
    await user.type(screen.getByLabelText("Your coach's code"), 'norte001');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(await screen.findByRole('button', { name: 'Join' }));

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/client');
    expect(brandPrimary()).toBe('#0f766e');

    const [profile] = screen.getAllByRole('link', { name: 'Profile' });
    await user.click(profile as HTMLElement);
    const spaces = await screen.findByRole('list', { name: 'Your spaces' });
    expect(within(spaces).getAllByRole('listitem')).toHaveLength(2);
  });

  it('con su propio código, "Ir a mi negocio" entra en su negocio aunque estuviera en otro', async () => {
    rememberLastSpace(DUAL_ID, TEST_TENANTS.norte.id);
    const { user, router } = await renderAppAs(DUAL, '/join?code=IRONLAB1');

    await user.click(await screen.findByRole('button', { name: 'Join' }));
    await user.click(await screen.findByRole('button', { name: 'Go to my business' }));

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/coach');
    expect(brandPrimary()).toBe('#dc2626');
  });

  it('quien ya tiene negocio y abre /create-business entra en su negocio', async () => {
    rememberLastSpace(DUAL_ID, TEST_TENANTS.norte.id);
    const { router } = await renderAppAs(DUAL, '/create-business');

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/coach');
  });

  it('el selector deja cerrar sesión', async () => {
    const auth = createFakeAuthService({ signedInAs: DUAL });
    const { user, router } = await renderApp('/select', { auth });

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/login');
  });
});
