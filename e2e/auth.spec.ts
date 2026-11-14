import { expect, test } from '@playwright/test';

import { SEED_PASSWORD, signIn } from './helpers';

// Flujo crítico (AGENTS.md §6): entrar y cerrar sesión, contra Supabase local.
// Necesita `npm run db:start` y `.env.local` con los valores locales.

test('entrar con contraseña, recargar sin perder la sesión y cerrarla', async ({ page }) => {
  await page.goto('/client');
  await expect(page).toHaveURL(/\/login\?next=%2Fclient$/);

  await signIn(page, 'ana@example.com', '/login?next=%2Fclient');

  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/client');
  await expect(page).toHaveURL(/\/login\?next=%2Fclient$/);
});

test('con la contraseña mala o un email sin cuenta, lo dice y no borra el email', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('ana@example.com');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toHaveText('The password is not correct.');
  await expect(page.getByLabel('Email')).toHaveValue('ana@example.com');

  await page.getByLabel('Email').fill('nobody-here@example.com');
  await page.getByLabel('Password', { exact: true }).fill(SEED_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toHaveText("There's no account with this email.");
  await expect(page).toHaveURL(/\/login$/);
});
