import { expect, test } from '@playwright/test';

import { signIn } from './helpers';
import {
  E2E_PASSWORD,
  createJoinedClient,
  createTestBusiness,
  latestCode,
  localEnv,
  messagesFor,
} from './supabase-helpers';

// Perfil y cuenta (PR 1.13, D-058), contra Supabase local. Cada test crea su
// propio negocio y sus cuentas: no cambia nada del seed.

const suffix = () => Date.now().toString().slice(-5);

/** Una sesión hecha por la API, para comprobar después si sigue viva. */
async function refreshTokenFor(email: string, password: string): Promise<string> {
  const { url, key } = localEnv();
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  expect(response.ok).toBe(true);
  return ((await response.json()) as { refresh_token: string }).refresh_token;
}

async function canRefresh(refreshToken: string): Promise<boolean> {
  const { url, key } = localEnv();
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return response.ok;
}

test('el perfil del cliente: nombre que ve su coach, libras e idioma guardados en la cuenta', async ({
  page,
  browser,
}) => {
  const business = await createTestBusiness(`E2E Perfil ${suffix()}`);
  const email = await createJoinedClient(business.code);
  const newName = `Lucía Perfil ${suffix()}`;

  await signIn(page, email, '/login', E2E_PASSWORD);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  // "Cerrar sesión" ya no está en la cabecera: está en el perfil.
  await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Profile' }).first().click();
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  await expect(page.getByTestId('account-email')).toHaveText(email);
  await expect(page.getByText('Powered by ATHLETE CORE')).toBeVisible();

  // El nombre.
  await page.getByLabel('Name').fill(newName);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();

  // La unidad: sigue en libras al recargar.
  await page.getByRole('button', { name: 'Pounds (lb)' }).click();
  await expect(page.getByRole('button', { name: 'Pounds (lb)' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.reload();
  await expect(page.getByRole('button', { name: 'Pounds (lb)' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // El idioma: la app cambia al momento.
  await page.getByRole('main').getByRole('button', { name: 'Español' }).click();
  await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible();

  // La coach ve el nombre nuevo en su lista de clientes.
  const coachContext = await browser.newContext();
  const coachPage = await coachContext.newPage();
  await signIn(coachPage, business.coachEmail, '/login', E2E_PASSWORD);
  await coachPage.getByRole('link', { name: 'Clients' }).first().click();
  await expect(coachPage.getByRole('list').getByText(newName)).toBeVisible();
  await coachContext.close();

  // En otro dispositivo (sin nada guardado), al entrar la app se pone en español.
  const otherDevice = await browser.newContext();
  const otherPage = await otherDevice.newPage();
  await signIn(otherPage, email, '/login', E2E_PASSWORD);
  await expect(otherPage.getByRole('heading', { name: 'Hoy' })).toBeVisible();
  await otherDevice.close();

  // Y los emails de la cuenta llegan ya en español.
  const { url, key } = localEnv();
  const otp = await fetch(`${url}/auth/v1/otp`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, create_user: false }),
  });
  expect(otp.ok).toBe(true);
  await latestCode(email, 2);
  const [codeEmail] = await messagesFor(email);
  expect(codeEmail?.Subject).toContain('Tu código de ATHLETE CORE');

  // Cerrar sesión, desde el perfil.
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('cambiar la contraseña en Ajustes: pide la actual, cierra los demás dispositivos y avisa por email', async ({
  page,
}) => {
  const business = await createTestBusiness(`E2E Clave ${suffix()}`);
  const otherDevice = await refreshTokenFor(business.coachEmail, E2E_PASSWORD);

  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await page.getByRole('link', { name: 'Settings' }).first().click();
  await expect(page.getByRole('heading', { name: 'My account' })).toBeVisible();
  await expect(page.getByTestId('account-email')).toHaveText(business.coachEmail);

  // Con la actual mal, lo dice y no cambia nada.
  await page.getByLabel('Current password').fill('not-my-password');
  await page.getByLabel('New password').fill('a-brand-new-password');
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByRole('alert')).toHaveText('The password is not correct.');
  expect(await canRefresh(otherDevice)).toBe(true);

  // Con la buena, cambia.
  await page.getByLabel('Current password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(
    page.getByText('Password changed. Your other devices have been signed out.'),
  ).toBeVisible();

  // Los demás dispositivos quedan fuera; este sigue dentro.
  expect(await canRefresh(otherDevice)).toBe(false);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'My account' })).toBeVisible();

  // Llega el aviso.
  await expect
    .poll(async () => (await messagesFor(business.coachEmail)).map((message) => message.Subject))
    .toContain('Your ATHLETE CORE password has been changed');

  // La antigua ya no sirve; la nueva, sí.
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByLabel('Email').fill(business.coachEmail);
  await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('The password is not correct.');
  await page.getByLabel('Password', { exact: true }).fill('a-brand-new-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/coach$/);
});
