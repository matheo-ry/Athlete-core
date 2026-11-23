import { expect, test } from '@playwright/test';

import { signIn } from './helpers';
import {
  E2E_PASSWORD,
  createJoinedClient,
  createTestBusiness,
  select,
  signInApi,
} from './supabase-helpers';

// Consentimiento de datos de salud (PR 3.9a, D-126), contra Supabase local.
// Cada test crea su propio negocio y su cliente: no cambia nada del seed.

const suffix = () => Date.now().toString().slice(-5);

/** La fila de `health_consents` del cliente, leída con su propia sesión (respeta el RLS). */
async function consentRow(email: string) {
  const session = await signInApi(email, E2E_PASSWORD);
  const rows = (await select(
    session,
    'health_consents?select=granted_at,text_version,withdrawn_at',
  )) as { granted_at: string; text_version: string; withdrawn_at: string | null }[];
  return rows[0] ?? null;
}

test('un cliente nuevo ve la ventana, dice "Ahora no" y no vuelve a salir sola', async ({
  page,
}) => {
  const business = await createTestBusiness(`E2E Salud ${suffix()}`);
  const email = await createJoinedClient(business.code);

  await signIn(page, email, '/login', E2E_PASSWORD, { showHealthConsentPrompt: true });

  const dialog = page.getByRole('dialog', { name: 'Your health data' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('are only between you and your coach');
  await dialog.getByRole('button', { name: 'Not now' }).click();
  await expect(dialog).toBeHidden();

  // Recargar no vuelve a preguntar; y no se ha guardado nada en la base de datos.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(dialog).toBeHidden();
  expect(await consentRow(email)).toBeNull();
});

test('dar el permiso desde el perfil y retirarlo con confirmación', async ({ page }) => {
  const business = await createTestBusiness(`E2E Salud ${suffix()}`);
  const email = await createJoinedClient(business.code);

  await signIn(page, email, '/login', E2E_PASSWORD, { showHealthConsentPrompt: true });
  await page
    .getByRole('dialog', { name: 'Your health data' })
    .getByRole('button', { name: 'Not now' })
    .click();

  await page.goto('/client/profile');
  const status = page.getByTestId('health-consent-status');
  await expect(status).toContainText("You haven't given permission yet");

  // "Dar permiso" abre la misma ventana; "Acepto" lo guarda en la base de datos.
  await page.getByRole('button', { name: 'Give permission' }).click();
  await page
    .getByRole('dialog', { name: 'Your health data' })
    .getByRole('button', { name: 'I agree' })
    .click();
  await expect(status).toContainText('Permission given on');
  await expect
    .poll(async () => (await consentRow(email))?.withdrawn_at, { timeout: 10_000 })
    .toBeNull();
  expect((await consentRow(email))?.text_version).toBe('2026-11-draft');

  // Tras recargar sigue dado, y la ventana no vuelve a salir.
  await page.reload();
  await expect(page.getByTestId('health-consent-status')).toContainText('Permission given on');
  await expect(page.getByRole('dialog')).toBeHidden();

  // Retirar pide confirmación: cancelar no cambia nada.
  await page.getByRole('button', { name: 'Withdraw permission' }).click();
  const confirmation = page.getByRole('alertdialog', { name: 'Withdraw permission?' });
  await expect(confirmation).toContainText('will be deleted');
  await confirmation.getByRole('button', { name: 'Cancel' }).click();
  await expect(confirmation).toBeHidden();
  expect((await consentRow(email))?.withdrawn_at).toBeNull();

  await page.getByRole('button', { name: 'Withdraw permission' }).click();
  await page.getByRole('button', { name: 'Withdraw and delete' }).click();
  await expect(page.getByTestId('health-consent-status')).toContainText('Permission withdrawn on');
  await expect
    .poll(async () => (await consentRow(email))?.withdrawn_at ?? null, { timeout: 10_000 })
    .not.toBeNull();
  // Retirarlo no abre la ventana sola.
  await expect(page.getByRole('dialog')).toBeHidden();
});
