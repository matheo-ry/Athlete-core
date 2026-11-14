import { expect, test } from '@playwright/test';

import { signIn, signOut } from './helpers';
import { E2E_PASSWORD, createJoinedClient, createTestBusiness } from './supabase-helpers';

// Selector de espacio y "Mis espacios" (PR 1.14, D-056 y D-066), contra
// Supabase local. coach.iron@example.com es dueña de Iron Lab y clienta de
// Norte Strength; los demás tests crean sus propias cuentas y negocios.

const suffix = () => Date.now().toString().slice(-5);

test('con dos espacios: el selector, se recuerda el elegido, se cambia en "Mis espacios" y cerrar sesión lo olvida', async ({
  page,
}) => {
  await signIn(page, 'coach.iron@example.com');

  // La primera vez, el selector: su negocio primero, con la marca de la plataforma.
  await expect(page).toHaveURL(/\/select$/);
  await expect(page.getByRole('heading', { name: 'Where do you want to go?' })).toBeVisible();
  const rows = page.getByRole('list', { name: 'Your spaces' }).getByRole('button');
  await expect(rows).toHaveText([/Iron Lab.*Coach/, /Norte Strength.*Client/]);
  await expect(page.locator('html')).toHaveAttribute('style', /--brand-primary: #2563eb;/);

  // Elige Norte Strength: su zona de cliente, con esa marca.
  await rows.filter({ hasText: 'Norte Strength' }).click();
  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('style', /--brand-primary: #0f766e;/);

  // Cierra la app y la abre: entra directa en Norte Strength.
  await page.goto('/');
  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();

  // En "Mis espacios" cambia a Iron Lab: la zona de coach, en rojo.
  await page.getByRole('link', { name: 'Profile' }).first().click();
  const spaces = page.getByRole('list', { name: 'Your spaces' });
  await expect(spaces.getByText("You're here")).toBeVisible();
  await spaces.getByRole('button', { name: /Iron Lab/ }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.locator('html')).toHaveAttribute('style', /--brand-primary: #dc2626;/);

  // Cerrar sesión olvida el espacio: al volver a entrar se elige otra vez.
  await signOut(page);
  await signIn(page, 'coach.iron@example.com');
  await expect(page).toHaveURL(/\/select$/);
});

test('con un solo espacio no ve nunca el selector; al crear su negocio pasa a tener dos', async ({
  page,
}) => {
  const business = await createTestBusiness(`E2E Espacio ${suffix()}`);
  const client = await createJoinedClient(business.code);
  const ownName = `E2E Propio ${suffix()}`;

  await signIn(page, client, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/client$/);

  // Desde "Mis espacios" crea su negocio y entra en él.
  await page.getByRole('link', { name: 'Profile' }).first().click();
  await page.getByRole('link', { name: 'Create my business' }).click();
  await page.getByLabel('Business name').fill(ownName);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create business' }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByText(ownName).first()).toBeVisible();

  // La próxima vez que entra, ve el selector con los dos.
  await signOut(page);
  await signIn(page, client, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/select$/);
  await expect(page.getByRole('list', { name: 'Your spaces' }).getByRole('button')).toHaveText([
    new RegExp(`${ownName}.*Coach`),
    /E2E Espacio.*Client/,
  ]);
});

test('"Añadir un coach con código": la clienta de un coach se une a otro y tiene dos espacios', async ({
  page,
}) => {
  const first = await createTestBusiness(`E2E Primero ${suffix()}`);
  const second = await createTestBusiness(`E2E Segundo ${suffix()}`);
  const client = await createJoinedClient(first.code);

  await signIn(page, client, '/login', E2E_PASSWORD);
  await page.getByRole('link', { name: 'Profile' }).first().click();
  await page.getByRole('link', { name: 'Add a coach with a code' }).click();
  await page.getByLabel("Your coach's code").fill(second.code);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Join' }).click();

  // Entra en el coach nuevo.
  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByText(/E2E Segundo/).first()).toBeVisible();

  await page.getByRole('link', { name: 'Profile' }).first().click();
  await expect(page.getByRole('list', { name: 'Your spaces' }).getByRole('listitem')).toHaveCount(
    2,
  );
});
