import { focusManager } from '@tanstack/react-query';
import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createFakeAuthService } from '@/test/fake-auth-service';
import { createFakeTenancySource } from '@/test/fake-tenancy-source';
import { renderApp } from '@/test/render-app';

function renderAsNorteCoach(path = '/coach/clients') {
  const auth = createFakeAuthService({ signedInAs: 'norte-coach@example.test' });
  const tenancy = createFakeTenancySource({ currentEmail: () => auth.currentUser?.email ?? null });
  return renderApp(path, { auth, tenancy }).then((view) => ({ ...view, tenancy }));
}

describe('dar de baja y reactivar a un cliente (PR 1.11, D-055)', () => {
  it('desde la lista se abre la ficha del cliente', async () => {
    const { user, router } = await renderAsNorteCoach();

    await user.click(await screen.findByRole('link', { name: /Diego Norte/ }));

    expect(await screen.findByRole('heading', { name: 'Diego Norte' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/coach/clients/user-norte-client%40example.test');
    expect(screen.getByText(/Active$/)).toBeVisible();
  });

  it('"Dar de baja" explica qué pasa, y al confirmar pasa a "Dados de baja" y libera la plaza', async () => {
    const { user } = await renderAsNorteCoach('/coach/clients/user-norte-client%40example.test');

    await user.click(await screen.findByRole('button', { name: 'Remove client' }));
    expect(
      screen.getByText(
        'They will stop seeing your content and free up a spot. Their data is kept and you can reactivate them whenever you want.',
      ),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Yes, remove' }));

    expect(await screen.findByText('Diego Norte no longer has access.')).toBeVisible();
    expect(await screen.findByRole('button', { name: 'Reactivate' })).toBeVisible();

    await user.click(screen.getByRole('link', { name: 'Back to clients' }));
    expect(await screen.findByText('1 of 10 spots')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Removed' }));
    const list = await screen.findByRole('list');
    expect(within(list).getByText('Diego Norte')).toBeVisible();
  });

  it('cancelar no da de baja a nadie', async () => {
    const { user } = await renderAsNorteCoach('/coach/clients/user-norte-client%40example.test');

    await user.click(await screen.findByRole('button', { name: 'Remove client' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('button', { name: 'Remove client' })).toBeVisible();
  });

  it('reactivar a un cliente dado de baja', async () => {
    const { user } = await renderAsNorteCoach('/coach/clients/user-archived%40example.test');

    await user.click(await screen.findByRole('button', { name: 'Reactivate' }));

    expect(await screen.findByText('Fran Baja has access again.')).toBeVisible();
    expect(await screen.findByRole('button', { name: 'Remove client' })).toBeVisible();
  });

  it('con el plan lleno, reactivar lo dice', async () => {
    // Quién hace cada cosa en la base de datos falsa: la coach o una persona nueva.
    let actingAs = 'coach@example.test';
    const auth = createFakeAuthService({ signedInAs: 'coach@example.test' });
    const tenancy = createFakeTenancySource({ currentEmail: () => actingAs });
    const { user } = await renderApp('/coach/clients/user-client%40example.test', {
      auth,
      tenancy,
    });

    // Iron Lab (falso) tiene 1 plaza. La coach da de baja a su clienta…
    await user.click(await screen.findByRole('button', { name: 'Remove client' }));
    await user.click(screen.getByRole('button', { name: 'Yes, remove' }));
    await screen.findByRole('button', { name: 'Reactivate' });

    // …y otra persona ocupa la plaza que queda libre.
    actingAs = 'nobody-yet@example.test';
    expect(await tenancy.joinWithCode('IRONLAB1')).toMatchObject({ status: 'joined' });
    actingAs = 'coach@example.test';

    await user.click(screen.getByRole('button', { name: 'Reactivate' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You have no free spots. Remove another client or change your plan.',
    );
  });

  it('un cliente que no existe: la ficha lo dice', async () => {
    await renderAsNorteCoach('/coach/clients/nobody');
    expect(await screen.findByText("We couldn't find this client.")).toBeVisible();
  });
});

describe('el cliente dado de baja (D-055)', () => {
  it('ve "Ya no tienes acceso a …" con la marca de la plataforma y tres salidas', async () => {
    const auth = createFakeAuthService({ signedInAs: 'archived@example.test' });
    await renderApp('/', { auth });

    expect(
      await screen.findByRole('heading', { name: 'You no longer have access to Norte Strength' }),
    ).toBeVisible();
    expect(document.documentElement.style.getPropertyValue('--brand-primary')).toBe('#2563eb');
    expect(screen.getByLabelText("Your coach's code")).toBeVisible();
    expect(screen.getByRole('link', { name: 'Create my business' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });

  it('si lo dan de baja con la app abierta, al volver a la app lo nota', async () => {
    const coachAuth = createFakeAuthService({ signedInAs: 'norte-coach@example.test' });
    const shared = createFakeTenancySource({
      currentEmail: () => coachAuth.currentUser?.email ?? null,
    });
    const clientAuth = createFakeAuthService({ signedInAs: 'norte-client@example.test' });
    await renderApp('/client', { auth: clientAuth, tenancy: shared });
    expect(await screen.findByRole('heading', { name: 'Today' })).toBeVisible();

    // La coach lo da de baja (con la misma base de datos falsa).
    expect(
      await shared.archiveClient(
        '22222222-2222-4222-8222-222222222222',
        'user-norte-client@example.test',
      ),
    ).toBe('ok');
    // El cliente sale de la app y vuelve (la ventana pierde y recupera el foco).
    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    expect(
      await screen.findByRole('heading', { name: 'You no longer have access to Norte Strength' }),
    ).toBeVisible();
  });
});
