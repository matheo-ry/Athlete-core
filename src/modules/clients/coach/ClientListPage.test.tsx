import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Membership } from '@/core/tenancy';
import { createFakeAuthService } from '@/test/fake-auth-service';
import { createFakeFlagsSource } from '@/test/fake-flags-source';
import {
  FAKE_MEMBERSHIPS,
  TEST_TENANTS,
  createFakeTenancySource,
} from '@/test/fake-tenancy-source';
import { renderApp, renderAppAs } from '@/test/render-app';

const signedInAs = (email: string) => createFakeAuthService({ signedInAs: email });

describe('módulo clients: lista y código de invitación (PR 1.10)', () => {
  it('la coach ve "Clientes" en el menú y, dentro, sus clientes activos', async () => {
    const { user } = await renderAppAs('norte-coach@example.test', '/coach');

    const [menuLink] = await screen.findAllByRole('link', { name: 'Clients' });
    await user.click(menuLink as HTMLElement);

    expect(await screen.findByRole('heading', { name: 'Clients' })).toBeVisible();
    const list = await screen.findByRole('list');
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([expect.stringContaining('Dana Dual'), expect.stringContaining('Diego Norte')]);
    // Ni el email ni la coach salen en la lista.
    expect(screen.queryByText(/@example\.test/)).toBeNull();
    expect(within(list).queryByText('Nora Coach')).toBeNull();
  });

  it('las plazas del plan y, con el plan lleno, el aviso', async () => {
    await renderAppAs('coach@example.test', '/coach/clients');

    expect(await screen.findByText('1 of 1 spots')).toBeVisible();
    expect(
      screen.getByText(
        "You've reached your plan's limit. Whoever uses your code won't be able to join.",
      ),
    ).toBeVisible();
  });

  it('con plazas libres no hay aviso', async () => {
    await renderAppAs('norte-coach@example.test', '/coach/clients');

    expect(await screen.findByText('2 of 10 spots')).toBeVisible();
    expect(screen.queryByText(/reached your plan's limit/)).toBeNull();
  });

  it('la pestaña "Dados de baja" y el buscador', async () => {
    const { user } = await renderAppAs('norte-coach@example.test', '/coach/clients');
    await screen.findByRole('list');

    await user.click(screen.getByRole('button', { name: 'Removed' }));
    expect(await screen.findByText('Fran Baja')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Active' }));
    await user.type(screen.getByLabelText('Search by name'), 'die');
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    expect(within(list).getByText('Diego Norte')).toBeVisible();

    await user.clear(screen.getByLabelText('Search by name'));
    await user.type(screen.getByLabelText('Search by name'), 'zzz');
    expect(screen.getByText('No client matches “zzz”.')).toBeVisible();
  });

  it('el código en dos grupos de cuatro, y copiarlo', async () => {
    const { user } = await renderAppAs('norte-coach@example.test', '/coach/clients');

    expect(await screen.findByTestId('invite-code')).toHaveTextContent('NORT E001');
    await user.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(await screen.findByText('Copied')).toBeVisible();
    expect(await navigator.clipboard.readText()).toBe('NORTE001');
  });

  it('"Compartir enlace" copia el enlace de unirse si el dispositivo no tiene menú de compartir', async () => {
    const { user } = await renderAppAs('norte-coach@example.test', '/coach/clients');

    await user.click(await screen.findByRole('button', { name: 'Share link' }));

    expect(await screen.findByText('Link copied')).toBeVisible();
    expect(await navigator.clipboard.readText()).toBe(
      `${window.location.origin}/join?code=NORTE001`,
    );
  });

  it('regenerar pide confirmación y da un código nuevo sin 0, O, 1, I ni L', async () => {
    const { user } = await renderAppAs('norte-coach@example.test', '/coach/clients');
    await screen.findByTestId('invite-code');

    await user.click(screen.getByRole('button', { name: 'Regenerate code' }));
    expect(screen.getByText(/The current code and its links will stop working/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Yes, regenerate' }));

    expect(await screen.findByText('New code ready.')).toBeVisible();
    const code = screen.getByTestId('invite-code').textContent ?? '';
    expect(code).toMatch(
      /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4} [ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/,
    );
    expect(code).not.toBe('NORT E001');
  });

  it('un cliente que se acaba de unir aparece con la etiqueta "Nuevo"', async () => {
    const recent: Membership = {
      tenantId: TEST_TENANTS.norte.id,
      role: 'client',
      status: 'active',
      joinedAt: new Date().toISOString(),
      tenant: TEST_TENANTS.norte,
    };
    const tenancy = createFakeTenancySource({
      memberships: { ...FAKE_MEMBERSHIPS, 'norte-client@example.test': [recent] },
    });
    await renderApp('/coach/clients', { auth: signedInAs('norte-coach@example.test'), tenancy });

    const list = await screen.findByRole('list');
    const [dana, diego] = within(list).getAllByRole('listitem');
    expect(diego).toHaveTextContent('New');
    expect(dana).not.toHaveTextContent('New');
  });

  it('sin clientes: "Aún no tienes clientes", con la tarjeta del código', async () => {
    const tenancy = createFakeTenancySource({
      memberships: {
        'norte-coach@example.test': FAKE_MEMBERSHIPS['norte-coach@example.test'] ?? [],
      },
    });
    await renderApp('/coach/clients', { auth: signedInAs('norte-coach@example.test'), tenancy });

    expect(await screen.findByText("You don't have any clients yet")).toBeVisible();
    expect(screen.getByText('Share your code so they can join.')).toBeVisible();
    expect(screen.getByTestId('invite-code')).toBeVisible();
    expect(await screen.findByText('0 of 10 spots')).toBeVisible();
  });

  it('sin clientes dados de baja, su pestaña lo dice', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach/clients');

    await user.click(await screen.findByRole('button', { name: 'Removed' }));
    expect(await screen.findByText('No removed clients')).toBeVisible();
  });

  it('un cliente no ve "Clientes" y /coach/clients lo devuelve a su zona', async () => {
    const { router } = await renderAppAs('client@example.test', '/coach/clients');

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/client');
    expect(screen.queryByRole('link', { name: 'Clients' })).toBeNull();
  });

  it('con el flag apagado para el negocio, no hay menú ni pantalla de clientes', async () => {
    const flags = createFakeFlagsSource({ [TEST_TENANTS.norte.id]: [] });
    const { router } = await renderApp('/coach/clients', {
      flags,
      auth: signedInAs('norte-coach@example.test'),
    });

    expect(await screen.findByRole('heading', { name: 'Coach dashboard' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/coach');
    expect(screen.queryByRole('link', { name: 'Clients' })).toBeNull();
  });
});
