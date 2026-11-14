import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { signIn } from './helpers';
import {
  E2E_PASSWORD,
  archiveFromNorte,
  createConfirmedUser,
  latestCode,
  rpc,
  signInApi,
  uniqueEmail,
} from './supabase-helpers';

// Primera pantalla y unirse con código (PR 1.9), contra Supabase local.
// Los códigos equivocados se prueban CON sesión: sin sesión cuentan por
// dirección IP y en local todos los tests comparten la misma.

async function signInAs(page: Page, email: string, password = E2E_PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test('sin sesión, la primera pantalla pide el código y enseña al coach con sus colores', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole('link', { name: 'Already have an account? Sign in' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Are you a coach? Create your business' }),
  ).toBeVisible();

  await page.getByLabel("Your coach's code").fill('norte001');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText("You're going to train with Norte Strength")).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('style', /--brand-primary: #0f766e;/);
  await expect(page.getByRole('link', { name: 'Create account' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'I already have an account' })).toBeVisible();
});

test('D-037: código, crear la cuenta con la marca del coach, confirmar y dentro sin volver a escribirlo', async ({
  page,
}) => {
  const email = uniqueEmail('start');

  await page.goto('/start');
  await page.getByLabel("Your coach's code").fill('norte001');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('link', { name: 'Create account' }).click();

  // El registro se ve con los colores de Norte Strength.
  await expect(page.getByText("You're joining Norte Strength.")).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('style', /--brand-primary: #0f766e;/);
  await page.getByLabel('Name').fill('E2E Nuevo');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();

  // Y también la confirmación del email.
  await expect(page.getByText("You're joining Norte Strength.")).toBeVisible();
  await page.getByLabel('Code').fill(await latestCode(email));
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('style', /--brand-primary: #0f766e;/);

  await archiveFromNorte(email);
});

test('el enlace /join?code=NORTE001 sin sesión enseña la misma vista previa', async ({ page }) => {
  await page.goto('/join?code=NORTE001');
  await expect(page.getByText("You're going to train with Norte Strength")).toBeVisible();
});

test('una cuenta nueva se une a Norte Strength y entra con su marca', async ({ page }) => {
  const email = await createConfirmedUser('join');
  await signInAs(page, email);
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

  await page.getByLabel("Your coach's code").fill('NORT-E001');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Join' }).click();

  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('style', /--brand-primary: #0f766e;/);

  await archiveFromNorte(email);
});

test('código que no existe y plan lleno: cada uno con su mensaje', async ({ page }) => {
  const email = await createConfirmedUser('join-fail');
  await signInAs(page, email);

  await page.goto('/join?code=ABCD2345');
  await expect(page.getByRole('alert')).toHaveText(
    "This code doesn't exist or is no longer valid. Ask your coach for the current code.",
  );

  await page.goto('/join?code=IRONLAB1');
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Your coach has no free spots right now. Let them know so they can make room for you.',
  );
});

test('quien fue dado de baja no vuelve a entrar con el código', async ({ page }) => {
  await signIn(page, 'fran@example.com');
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

  await page.goto('/join?code=NORTE001');
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Your coach has removed you. Ask them to reactivate you.',
  );
});

test('quien ya era cliente entra directamente en su zona', async ({ page }) => {
  await signIn(page, 'ana@example.com');
  await expect(page).toHaveURL(/\/client$/);

  await page.goto('/join?code=IRONLAB1');
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
});

test('la coach que usa su propio código lo sabe', async ({ page }) => {
  await signIn(page, 'coach.norte@example.com');
  await expect(page).toHaveURL(/\/coach$/);

  await page.goto('/join?code=NORTE001');
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByRole('alert')).toHaveText("This is your own business's code.");
});

test('tras 10 códigos equivocados seguidos, hay que esperar', async ({ page }) => {
  const email = await createConfirmedUser('rate');
  const session = await signInApi(email, E2E_PASSWORD);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await rpc(session, 'join_tenant_with_code', { p_code: `WRONG${attempt}A` });
  }

  await signInAs(page, email);
  await page.goto('/join?code=NORTE001');
  await expect(page.getByRole('alert')).toHaveText(
    'Too many attempts. Try again in a few minutes.',
  );
});
