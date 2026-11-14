import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { signIn } from './helpers';
import { E2E_PASSWORD, createJoinedClient, createTestBusiness } from './supabase-helpers';

// La marca del coach (PR 1.15, D-057), contra Supabase local. Cada test crea
// su propio negocio: así no cambia los colores del seed, que esperan otros tests.

const suffix = () => Date.now().toString().slice(-5);
const rootStyle = (page: Page) => page.locator('html');

test('el coach cambia colores, nombre y modo; su cliente y la vista previa del código lo ven', async ({
  page,
  browser,
}) => {
  const business = await createTestBusiness(`E2E Marca ${suffix()}`);
  const client = await createJoinedClient(business.code);
  const newName = `E2E Barbell ${suffix()}`;

  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await page.getByRole('link', { name: 'Settings' }).first().click();
  await expect(page.getByRole('heading', { name: 'Brand' })).toBeVisible();
  const preview = page.getByTestId('brand-preview');
  const main = page.getByRole('group', { name: 'Main color' });

  // Un color de la paleta: la vista previa cambia antes de guardar; la app, no.
  await main.getByRole('button', { name: 'Green' }).click();
  await expect(preview).toHaveAttribute('style', /--brand-primary: #16a34a;/);
  await expect(rootStyle(page)).toHaveAttribute('style', /--brand-primary: #2563eb;/);

  // El nombre, con una letra no; con dos o más, sí. Y el modo claro.
  await page.getByLabel('Business name').fill('E');
  await page.getByRole('button', { name: 'Save brand' }).click();
  await expect(page.getByText('Write at least 2 characters.')).toBeVisible();
  await page.getByLabel('Business name').fill(newName);
  await page.getByRole('button', { name: 'Light' }).click();
  await page.getByRole('button', { name: 'Save brand' }).click();

  // Al guardar cambia toda su app: color, fondo y nombre (cabecera y "Mis espacios").
  await expect(page.getByText('Saved. Your clients will see it')).toBeVisible();
  await expect(rootStyle(page)).toHaveAttribute('style', /--brand-primary: #16a34a;/);
  await expect(rootStyle(page)).toHaveAttribute('style', /color-scheme: light;/);
  await expect(page.getByText(newName).first()).toBeVisible();
  await expect(page.getByRole('list', { name: 'Your spaces' }).getByText(newName)).toBeVisible();

  // Su cliente abre la app y lo ve.
  const clientContext = await browser.newContext();
  const clientPage = await clientContext.newPage();
  await signIn(clientPage, client, '/login', E2E_PASSWORD);
  await expect(clientPage.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(rootStyle(clientPage)).toHaveAttribute('style', /--brand-primary: #16a34a;/);
  await expect(clientPage.getByText(newName).first()).toBeVisible();
  await clientContext.close();

  // Y la vista previa del código, sin sesión.
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(`/join?code=${business.code}`);
  await expect(guestPage.getByText(`You're going to train with ${newName}`)).toBeVisible();
  await expect(rootStyle(guestPage)).toHaveAttribute('style', /--brand-primary: #16a34a;/);
  await guestContext.close();
});

test('con un amarillo los botones se leen bien, y se puede volver a los colores de ATHLETE CORE', async ({
  page,
}) => {
  const business = await createTestBusiness(`E2E Amarillo ${suffix()}`);

  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await page.goto('/coach/settings');
  const main = page.getByRole('group', { name: 'Main color' });

  // Amarillo: el texto de los botones pasa a negro.
  await main.getByRole('button', { name: 'Yellow' }).click();
  await page.getByRole('button', { name: 'Save brand' }).click();
  await expect(page.getByText('Saved. Your clients will see it')).toBeVisible();
  await expect(rootStyle(page)).toHaveAttribute('style', /--brand-primary: #eab308;/);
  await expect(rootStyle(page)).toHaveAttribute('style', /--brand-on-primary: #000000;/);

  // Volver a los de ATHLETE CORE.
  await page.getByRole('button', { name: 'Back to ATHLETE CORE colors' }).click();
  await expect(main.getByRole('button', { name: 'Blue', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Save brand' }).click();
  await expect(rootStyle(page)).toHaveAttribute('style', /--brand-primary: #2563eb;/);
  await expect(rootStyle(page)).toHaveAttribute('style', /color-scheme: dark;/);
});
