import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { HealthConsentState } from '@/core/tenancy';
import { createFakeAuthService } from '@/test/fake-auth-service';
import { createFakeTenancySource } from '@/test/fake-tenancy-source';
import { renderApp } from '@/test/render-app';

const NONE: HealthConsentState = { status: 'none' };
const GRANTED: HealthConsentState = {
  status: 'granted',
  grantedAt: '2026-11-16T10:00:00Z',
  textVersion: '2026-11-draft',
};

async function renderAs(email: string, path: string, initialHealthConsent: HealthConsentState) {
  const auth = createFakeAuthService({ signedInAs: email });
  const tenancy = createFakeTenancySource({
    currentEmail: () => auth.currentUser?.email ?? null,
    initialHealthConsent,
  });
  const view = await renderApp(path, { auth, tenancy });
  return { ...view, tenancy };
}

beforeEach(() => {
  localStorage.clear();
});

describe('consentimiento de datos de salud (D-126)', () => {
  it('Criterio 1: al entrar por primera vez sale la ventana con el texto en borrador', async () => {
    await renderAs('client@example.test', '/client', NONE);

    const dialog = await screen.findByRole('dialog', { name: 'Your health data' });
    expect(within(dialog).getByText(/are only between you and your coach/)).toBeVisible();
    expect(within(dialog).getByRole('button', { name: 'I agree' })).toBeVisible();
    expect(within(dialog).getByRole('button', { name: 'Not now' })).toBeVisible();
  });

  it('"Ahora no" cierra la ventana y no vuelve a salir sola, ni al cambiar de pantalla', async () => {
    const { user } = await renderAs('client@example.test', '/client', NONE);

    await user.click(await screen.findByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    const [profileLink] = await screen.findAllByRole('link', { name: 'Profile' });
    await user.click(profileLink as HTMLElement);
    expect(await screen.findByRole('heading', { name: 'Health data' })).toBeVisible();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Escape es lo mismo que "Ahora no"', async () => {
    const { user, tenancy } = await renderAs('client@example.test', '/client', NONE);
    await screen.findByRole('dialog', { name: 'Your health data' });

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(tenancy.healthConsentCalls.granted).toBe(0);
  });

  it('"Acepto" da el permiso y la ventana se cierra', async () => {
    const { user, tenancy } = await renderAs('client@example.test', '/client', NONE);

    await user.click(await screen.findByRole('button', { name: 'I agree' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(tenancy.healthConsentCalls.granted).toBe(1);
  });

  it('con el permiso ya dado, no sale la ventana', async () => {
    await renderAs('client@example.test', '/client/profile', GRANTED);

    expect(await screen.findByTestId('health-consent-status')).toHaveTextContent(
      'Permission given on',
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('sin conexión, no se da el permiso: avisa y la ventana sigue', async () => {
    const { user, tenancy } = await renderAs('client@example.test', '/client', NONE);
    tenancy.failNextHealthConsentChange('offline');

    await user.click(await screen.findByRole('button', { name: 'I agree' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No connection');
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(tenancy.healthConsentCalls.granted).toBe(0);

    // Al volver la conexión, funciona.
    await user.click(screen.getByRole('button', { name: 'I agree' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(tenancy.healthConsentCalls.granted).toBe(1);
  });

  it('el coach no ve la ventana', async () => {
    await renderAs('coach@example.test', '/coach', NONE);

    await screen.findByRole('main');
    expect(screen.queryByRole('dialog', { name: 'Your health data' })).toBeNull();
  });
});

describe('Perfil → Datos de salud (D-126)', () => {
  it('sin permiso, "Dar permiso" vuelve a pedirlo con la misma ventana', async () => {
    const { user, tenancy } = await renderAs('client@example.test', '/client/profile', NONE);
    await user.click(await screen.findByRole('button', { name: 'Not now' }));

    expect(await screen.findByTestId('health-consent-status')).toHaveTextContent(
      "You haven't given permission yet",
    );
    await user.click(screen.getByRole('button', { name: 'Give permission' }));
    await user.click(await screen.findByRole('button', { name: 'I agree' }));

    await waitFor(() => {
      expect(screen.getByTestId('health-consent-status')).toHaveTextContent('Permission given on');
    });
    expect(tenancy.healthConsentCalls.granted).toBe(1);
    expect(screen.getByRole('button', { name: 'Withdraw permission' })).toBeVisible();
  });

  it('retirarlo pide confirmación, y cancelar no borra nada', async () => {
    const { user, tenancy } = await renderAs('client@example.test', '/client/profile', GRANTED);

    await user.click(await screen.findByRole('button', { name: 'Withdraw permission' }));
    const confirmation = screen.getByRole('alertdialog', { name: 'Withdraw permission?' });
    expect(confirmation).toHaveTextContent('will be deleted');

    await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(tenancy.healthConsentCalls.withdrawn).toBe(0);
    expect(screen.getByTestId('health-consent-status')).toHaveTextContent('Permission given on');
  });

  it('Criterio 5: al confirmar, queda retirado y se puede volver a dar', async () => {
    const { user, tenancy } = await renderAs('client@example.test', '/client/profile', GRANTED);

    await user.click(await screen.findByRole('button', { name: 'Withdraw permission' }));
    await user.click(screen.getByRole('button', { name: 'Withdraw and delete' }));

    await waitFor(() => {
      expect(screen.getByTestId('health-consent-status')).toHaveTextContent(
        'Permission withdrawn on',
      );
    });
    expect(tenancy.healthConsentCalls.withdrawn).toBe(1);
    // Retirarlo no vuelve a abrir la ventana sola.
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Give permission' })).toBeVisible();
  });

  it('si retirar falla, avisa y el permiso sigue dado', async () => {
    const { user, tenancy } = await renderAs('client@example.test', '/client/profile', GRANTED);
    tenancy.failNextHealthConsentChange('error');

    await user.click(await screen.findByRole('button', { name: 'Withdraw permission' }));
    await user.click(screen.getByRole('button', { name: 'Withdraw and delete' }));

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeVisible();
    expect(screen.getByTestId('health-consent-status')).toHaveTextContent('Permission given on');
  });
});
