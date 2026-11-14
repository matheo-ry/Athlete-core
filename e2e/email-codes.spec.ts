import { expect, test } from '@playwright/test';

import {
  E2E_PASSWORD,
  createConfirmedUser,
  latestCode,
  messagesFor,
  uniqueEmail,
} from './supabase-helpers';

// Flujos con código por email (PR 1.6), contra Supabase local y su bandeja de
// pruebas. Cada test crea su propia cuenta: no cambia las contraseñas del seed.

test('recuperar la contraseña: el email llega en el idioma de la cuenta y la contraseña cambia', async ({
  page,
}) => {
  const email = await createConfirmedUser('reset', 'es');

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('link', { name: 'Forgot my password' }).click();
  await expect(page.getByLabel('Email')).toHaveValue(email);
  await page.getByRole('button', { name: 'Send code' }).click();

  // El primer email fue el de confirmar la cuenta; este es el segundo.
  const code = await latestCode(email, 2);
  const [resetEmail] = await messagesFor(email);
  expect(resetEmail?.Subject).toContain('Tu código de ATHLETE CORE');

  await page.getByLabel('Code').fill(code);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('New password').fill('a-brand-new-password');
  await page.getByRole('button', { name: 'Save password' }).click();

  // Sin ningún coach todavía: la bienvenida.
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  await expect
    .poll(async () => (await messagesFor(email)).map((message) => message.Subject))
    .toContain('Tu contraseña de ATHLETE CORE se ha cambiado');

  // La contraseña antigua ya no sirve; la nueva, sí.
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('The password is not correct.');

  await page.getByLabel('Password', { exact: true }).fill('a-brand-new-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});

test('entrar con un código por email, sin contraseña', async ({ page }) => {
  const email = await createConfirmedUser('code', 'en');

  await page.goto('/login/code');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send code' }).click();

  const code = await latestCode(email, 2);
  const [signInEmail] = await messagesFor(email);
  expect(signInEmail?.Subject).toContain('Your ATHLETE CORE code');

  await page.getByLabel('Code').fill(code);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});

test('con un código equivocado lo dice, y con un email sin cuenta no envía nada', async ({
  page,
}) => {
  const email = await createConfirmedUser('wrong-code');

  await page.goto('/login/code');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send code' }).click();
  await latestCode(email, 2);
  await page.getByLabel('Code').fill('000000');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toHaveText('The code is not correct or has expired.');
  await expect(page.getByRole('button', { name: /Send another code in \d+ s/ })).toBeDisabled();

  const nobody = uniqueEmail('nobody');
  await page.getByRole('button', { name: 'Use another email' }).click();
  await page.getByLabel('Email').fill(nobody);
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByRole('alert')).toHaveText("There's no account with this email.");
  expect(await messagesFor(nobody)).toEqual([]);
});
