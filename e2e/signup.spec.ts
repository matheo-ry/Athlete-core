import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { latestCode, localEnv, messagesFor, uniqueEmail } from './supabase-helpers';

// Registro y confirmación del email (PR 1.7), contra Supabase local.

async function fillSignup(page: Page, email: string, password: string) {
  await page.getByLabel('Name').fill('E2E Nuevo');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
}

/** El perfil del usuario que ha entrado, leído con su propia sesión (respeta el RLS). */
async function ownProfile(page: Page) {
  const { url, key } = localEnv();
  const raw = await page.evaluate(() => localStorage.getItem('athlete-core.auth'));
  const session = JSON.parse(raw ?? '{}') as { access_token?: string };
  const response = await fetch(
    `${url}/rest/v1/profiles?select=display_name,locale,weight_unit,terms_version,terms_accepted_at`,
    { headers: { apikey: key, Authorization: `Bearer ${session.access_token ?? ''}` } },
  );
  const [profile] = (await response.json()) as Record<string, unknown>[];
  return profile;
}

test('crear la cuenta desde /login, confirmar el email con el código y entrar', async ({
  page,
}) => {
  const email = uniqueEmail('signup');

  await page.goto('/login');
  await page.getByRole('link', { name: "Don't have an account? Create one" }).click();
  await fillSignup(page, email, 'my-signup-password');

  await expect(page).toHaveURL(/\/verify$/);
  const code = await latestCode(email);
  const [confirmation] = await messagesFor(email);
  // La app estaba en inglés: el email llega en inglés y saluda por el nombre.
  expect(confirmation?.Subject).toContain('Your ATHLETE CORE code');

  await page.getByLabel('Code').fill(code);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

  const profile = await ownProfile(page);
  expect(profile).toMatchObject({
    display_name: 'E2E Nuevo',
    locale: 'en',
    weight_unit: 'lb',
    terms_version: 'draft-2026-11',
  });
  expect(profile?.terms_accepted_at).not.toBeNull();
});

test('con un email que ya tiene cuenta lo dice y no cambia de pantalla', async ({ page }) => {
  await page.goto('/signup');
  await fillSignup(page, 'ana@example.com', 'whatever-123');

  await expect(page.getByRole('alert')).toHaveText("There's already an account with this email.");
  await expect(page.getByRole('link', { name: 'Forgot my password' })).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});

test('seguridad (D-043): si otra persona registró el email, al confirmarlo vale la última contraseña', async ({
  page,
}) => {
  const email = uniqueEmail('taken');
  const { url, key } = localEnv();

  // "Otra persona" registra el email con su contraseña y no lo confirma.
  const intruder = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'intruder-password', data: { locale: 'en' } }),
  });
  expect(intruder.ok).toBe(true);

  // La dueña del email se registra después, con su propia contraseña.
  await page.goto('/signup');
  await fillSignup(page, email, 'owner-password-1');
  await expect(page.getByRole('alert')).toHaveText(
    'This account is waiting for email confirmation.',
  );
  await page.getByRole('button', { name: 'Confirm my email' }).click();
  await expect(page).toHaveURL(/\/verify$/);

  // Solo ella recibe los emails: confirma con el código.
  await page.getByLabel('Code').fill(await latestCode(email));
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

  // La contraseña del intruso ya no sirve; la suya, sí.
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('intruder-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('The password is not correct.');

  await page.getByLabel('Password', { exact: true }).fill('owner-password-1');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  // Y el nombre y los términos son los suyos.
  expect(await ownProfile(page)).toMatchObject({ display_name: 'E2E Nuevo' });
});

test('los textos legales se abren y dicen que son un borrador', async ({ page }) => {
  await page.goto('/legal/terms');
  await expect(page.getByRole('heading', { name: 'Terms of use' })).toBeVisible();
  await expect(page.getByText('Draft', { exact: true })).toBeVisible();

  await page.goto('/legal/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy policy' })).toBeVisible();
});
