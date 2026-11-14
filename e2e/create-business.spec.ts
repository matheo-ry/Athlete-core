import { expect, test } from '@playwright/test';

import { signIn } from './helpers';
import { E2E_PASSWORD, createJoinedClient, latestCode, uniqueEmail } from './supabase-helpers';

// Crear negocio y primeros pasos (PR 1.12, D-049), contra Supabase local.

test('"¿Eres coach?": cuenta, email confirmado, negocio creado y primeros pasos', async ({
  page,
}) => {
  const email = uniqueEmail('new-coach');
  const businessName = `Fuerza Sur ${Date.now().toString().slice(-5)}`;

  await page.goto('/start');
  await page.getByRole('link', { name: 'Are you a coach? Create your business' }).click();
  await page.getByLabel('Name').fill('E2E Coach');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Code').fill(await latestCode(email));
  await page.getByRole('button', { name: 'Continue' }).click();

  // Al confirmar el email, la pantalla de crear negocio.
  await expect(page.getByRole('heading', { name: 'Create your business' })).toBeVisible();
  await page.getByLabel('Business name').fill('F');
  await page.getByRole('button', { name: 'Create business' }).click();
  await expect(page.getByText('Write at least 2 characters.')).toBeVisible();
  await expect(
    page.getByText('To create your business you need to accept the terms for coaches.'),
  ).toBeVisible();

  await page.getByLabel('Business name').fill(businessName);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create business' }).click();

  // Su zona: su nombre, los colores de ATHLETE CORE y los primeros pasos.
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByText(businessName).first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('style', /--brand-primary: #2563eb;/);
  await expect(page.getByRole('heading', { name: 'First steps' })).toBeVisible();

  // En Clientes: 0 de 3 plazas, la lista vacía y un código de 8 caracteres.
  await page.getByRole('link', { name: /Share your code/ }).click();
  await expect(page.getByText('0 of 3 spots')).toBeVisible();
  await expect(page.getByText("You don't have any clients yet")).toBeVisible();
  const code = ((await page.getByTestId('invite-code').textContent()) ?? '').replace(' ', '');
  expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);

  // Con su primer cliente, los primeros pasos desaparecen.
  await createJoinedClient(code);
  await page.goto('/coach');
  await expect(page.getByRole('heading', { name: 'Coach dashboard' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'First steps' })).toHaveCount(0);
});

test('quien ya tiene un negocio no ve cómo crear otro', async ({ page }) => {
  await signIn(page, 'coach.norte@example.com');
  await expect(page).toHaveURL(/\/coach$/);

  await page.goto('/create-business');
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByRole('link', { name: 'Create my business' })).toHaveCount(0);
});
