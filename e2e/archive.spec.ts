import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  E2E_PASSWORD,
  createJoinedClient,
  createTestBusiness,
  rpc,
  signInApi,
} from './supabase-helpers';

// Dar de baja y reactivar a un cliente (PR 1.11, D-055), contra Supabase local.
// Cada test crea su propio negocio: no toca a los clientes del seed.

async function signInAs(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Desde el inicio que le toque (zona de coach, de cliente o bienvenida), que tienen el botón. */
async function signOut(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await expect(page).toHaveURL(/\/login$/);
}

test('la coach da de baja a un cliente, que pierde el acceso, y lo reactiva', async ({ page }) => {
  const business = await createTestBusiness('E2E Baja');
  const client = await createJoinedClient(business.code);

  await signInAs(page, business.coachEmail);
  await page.goto('/coach/clients');
  await expect(page.getByText('1 of 3 spots')).toBeVisible();
  await page.getByRole('link', { name: /E2E Test/ }).click();
  await page.getByRole('button', { name: 'Remove client' }).click();
  await page.getByRole('button', { name: 'Yes, remove' }).click();
  await expect(page.getByText('E2E Test no longer has access.')).toBeVisible();

  await page.getByRole('link', { name: 'Back to clients' }).click();
  await expect(page.getByText('0 of 3 spots')).toBeVisible();
  await page.getByRole('button', { name: 'Removed' }).click();
  await expect(page.getByRole('list').getByText('E2E Test')).toBeVisible();
  await signOut(page);

  // El cliente ve que ya no tiene acceso, con la marca de la plataforma…
  await signInAs(page, client);
  await expect(
    page.getByRole('heading', { name: 'You no longer have access to E2E Baja' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('style', /--brand-primary: #2563eb;/);
  // …y no puede volver solo con el código.
  await page.getByLabel("Your coach's code").fill(business.code);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Your coach has removed you. Ask them to reactivate you.',
  );
  await signOut(page);

  // La coach lo reactiva y el cliente vuelve a entrar como antes.
  await signInAs(page, business.coachEmail);
  await page.goto('/coach/clients');
  await page.getByRole('button', { name: 'Removed' }).click();
  await page.getByRole('link', { name: /E2E Test/ }).click();
  await page.getByRole('button', { name: 'Reactivate' }).click();
  await expect(page.getByText('E2E Test has access again.')).toBeVisible();
  await signOut(page);

  await signInAs(page, client);
  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
});

test('con el plan lleno, dar de baja deja entrar a otro, y reactivar lo dice', async ({ page }) => {
  const business = await createTestBusiness('E2E Plan');
  await createJoinedClient(business.code);
  await createJoinedClient(business.code);
  await createJoinedClient(business.code);

  await signInAs(page, business.coachEmail);
  await page.goto('/coach/clients');
  await expect(page.getByText('3 of 3 spots')).toBeVisible();
  await page
    .getByRole('link', { name: /E2E Test/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Remove client' }).click();
  await page.getByRole('button', { name: 'Yes, remove' }).click();
  await expect(page.getByRole('button', { name: 'Reactivate' })).toBeVisible();

  // Con la plaza libre, una cuenta nueva ya puede unirse…
  await createJoinedClient(business.code);

  // …y ahora reactivar al primero no cabe.
  await page.getByRole('button', { name: 'Reactivate' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'You have no free spots. Remove another client or change your plan.',
  );
});

test('si lo dan de baja con la app abierta, al volver a la app lo nota', async ({ page }) => {
  const business = await createTestBusiness('E2E Abierta');
  const client = await createJoinedClient(business.code);

  await signInAs(page, client);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();

  const clientSession = await signInApi(client, E2E_PASSWORD);
  await rpc(business.coach, 'archive_client', {
    p_tenant: business.tenantId,
    p_user: clientSession.userId,
  });

  // El cliente sale de la app y vuelve (la pestaña se oculta y se vuelve a ver).
  // (Se pasa como texto: este código se ejecuta en el navegador, no en Node.)
  await page.evaluate(`
    for (const state of ['hidden', 'visible']) {
      Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
      // Como el navegador: el aviso sube del documento a la ventana.
      document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
    }
  `);

  await expect(
    page.getByRole('heading', { name: 'You no longer have access to E2E Abierta' }),
  ).toBeVisible();
});
