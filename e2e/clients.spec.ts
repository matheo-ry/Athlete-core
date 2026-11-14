import { expect, test } from '@playwright/test';

import { signIn } from './helpers';
import { E2E_PASSWORD, createConfirmedUser, localEnv, rpc, signInApi } from './supabase-helpers';

// Módulo clients (PR 1.10), contra Supabase local y los datos del seed.
// Otros tests unen y dan de baja a cuentas en Norte Strength a la vez: aquí no
// se cuentan sus clientes exactos, se comprueba que están los del seed.

test('la coach de Iron Lab ve a sus 3 clientes, en orden, y el aviso de plan lleno', async ({
  page,
}) => {
  await signIn(page, 'coach.iron@example.com');
  await page.getByRole('link', { name: 'Clients' }).first().click();

  await expect(page).toHaveURL(/\/coach\/clients$/);
  await expect(page.getByRole('listitem')).toHaveText([
    /Ana Ejemplo/,
    /Bruno Prueba/,
    /Carla Demo/,
  ]);
  await expect(page.getByText('3 of 3 spots')).toBeVisible();
  await expect(
    page.getByText(
      "You've reached your plan's limit. Whoever uses your code won't be able to join.",
    ),
  ).toBeVisible();
  // El coach no ve el email de sus clientes (D-059).
  await expect(page.getByText(/@example\.com/)).toHaveCount(0);
});

test('Norte Strength: plan de 10, dados de baja, buscador y su código', async ({ page }) => {
  await signIn(page, 'coach.norte@example.com');
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/clients');

  await expect(page.getByText(/^\d+ of 10 spots$/)).toBeVisible();
  const list = page.getByRole('list');
  await expect(list.getByText('Diego Ficticio')).toBeVisible();
  await expect(list.getByText('Elena Inventada')).toBeVisible();
  // La coach de Iron Lab es además clienta de Norte Strength (D-048).
  await expect(list.getByText('Iris Hierro')).toBeVisible();

  await page.getByRole('button', { name: 'Removed' }).click();
  await expect(page.getByRole('list').getByText('Fran Ejemplo')).toBeVisible();

  await page.getByRole('button', { name: 'Active' }).click();
  await page.getByLabel('Search by name').fill('die');
  await expect(page.getByRole('listitem')).toHaveText([/Diego Ficticio/]);

  await expect(page.getByTestId('invite-code')).toHaveText('NORT E001');
  await page.getByRole('button', { name: 'Copy code' }).click();
  await expect(page.getByText(/^(Copied|Couldn't copy)/)).toBeVisible();
});

test('regenerar el código: el antiguo deja de valer y los clientes que ya estaban siguen dentro', async ({
  page,
}) => {
  // Un negocio propio para el test: así no se cambia el código del seed.
  const email = await createConfirmedUser('regen');
  const coach = await signInApi(email, E2E_PASSWORD);
  await rpc(coach, 'create_tenant', {
    p_name: 'E2E Regenerate',
    p_coach_terms_version: 'draft-2026-11',
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/clients');

  await expect(page.getByTestId('invite-code')).toBeVisible();
  const before = (await page.getByTestId('invite-code').textContent())?.replace(' ', '') ?? '';
  expect(before).toMatch(/^[A-Z0-9]{8}$/);
  await expect(page.getByText("You don't have any clients yet")).toBeVisible();

  await page.getByRole('button', { name: 'Regenerate code' }).click();
  await page.getByRole('button', { name: 'Yes, regenerate' }).click();
  await expect(page.getByText('New code ready.')).toBeVisible();

  const after = (await page.getByTestId('invite-code').textContent())?.replace(' ', '') ?? '';
  expect(after).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
  expect(after).not.toBe(before);

  // El código antiguo ya no vale; el nuevo, sí (preguntando con la sesión del coach).
  expect(await rpc(coach, 'preview_invite', { p_code: before })).toEqual({
    status: 'invalid_code',
  });
  expect(await rpc(coach, 'preview_invite', { p_code: after })).toMatchObject({ status: 'ok' });
  expect(localEnv().url).not.toBe('');
});

test('una clienta no ve "Clientes" y /coach/clients la devuelve a su zona', async ({ page }) => {
  await signIn(page, 'ana@example.com');
  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('link', { name: 'Clients' })).toHaveCount(0);

  await page.goto('/coach/clients');
  await expect(page).toHaveURL(/\/client$/);
});
