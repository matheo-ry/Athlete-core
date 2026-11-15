import { expect, test } from '@playwright/test';

import { signIn } from './helpers';
import { E2E_PASSWORD, createTestBusiness } from './supabase-helpers';

// Módulo exercises (PR 2.3), contra Supabase local y los 120 ejercicios de la
// plataforma que el seed reparte a cada negocio. Los tests que cambian
// ejercicios (PR 2.4) lo hacen en un negocio propio, que también recibe los 120.

const suffix = () => Date.now().toString().slice(-5);

test('el coach ve sus 120 ejercicios por orden alfabético, los busca y los filtra', async ({
  page,
}) => {
  await signIn(page, 'coach.norte@example.com');
  await expect(page).toHaveURL(/\/coach$/);
  await page.getByRole('link', { name: 'Exercises' }).first().click();

  await expect(page).toHaveURL(/\/coach\/exercises$/);
  const rows = page.getByRole('listitem');
  await expect(rows).toHaveCount(120);
  await expect(rows.first()).toContainText('Ab wheel rollout');
  await expect(rows.last()).toContainText('Wrist curl');
  await expect(page.getByRole('button', { name: 'Active 120' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Archived 0' })).toBeVisible();

  await page.getByLabel('Search by name').fill('PULLDOWN');
  await expect(rows).toHaveText([
    /^Close-grip lat pulldown/,
    /^Lat pulldown/,
    /^Neutral-grip lat pulldown/,
  ]);

  await page.getByLabel('Search by name').fill('');
  await page.getByLabel('Muscle group').selectOption({ label: 'Chest' });
  await page.getByLabel('Equipment').selectOption({ label: 'Machine' });
  await expect(rows).toHaveCount(4);

  await page.getByLabel('Search by name').fill('zzzz');
  await expect(page.getByText('No exercise matches')).toBeVisible();
});

test('un cliente no ve "Ejercicios" y /coach/exercises lo devuelve a su zona', async ({ page }) => {
  await signIn(page, 'ana@example.com');
  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('link', { name: 'Exercises' })).toHaveCount(0);

  await page.goto('/coach/exercises');
  await expect(page).toHaveURL(/\/client$/);
});

test('el coach crea un ejercicio propio, también desde una búsqueda sin resultados, y otro negocio no lo ve', async ({
  page,
  browser,
}) => {
  const business = await createTestBusiness(`E2E Ejercicios ${suffix()}`);
  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/exercises');

  // Una búsqueda sin resultados abre el formulario con lo escrito.
  await page.getByLabel('Search by name').fill('sentadilla lateral');
  await page.getByRole('button', { name: 'Create “sentadilla lateral”' }).click();
  await expect(page.getByRole('heading', { name: 'New exercise' })).toBeVisible();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('sentadilla lateral');
  await page.getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('button', { name: 'New exercise' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Flexiones con mochila');
  await page.getByRole('radio', { name: /Bodyweight and reps/ }).check();
  // Un enlace que no es https:// no se guarda (D-074).
  await page.getByLabel('Video link (optional)').fill('http://youtu.be/abc');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(
    page.getByText('The link must start with https:// and have no spaces.'),
  ).toBeVisible();
  await page.getByLabel('Video link (optional)').fill('https://youtu.be/abc');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('status')).toHaveText('“Flexiones con mochila” saved.');
  await expect(page.getByRole('button', { name: 'Active 121' })).toBeVisible();
  await page.getByLabel('Search by name').fill('mochila');
  await expect(page.getByRole('listitem')).toHaveCount(1);
  await expect(page.getByRole('listitem')).toContainText('Custom');

  // Norte Strength no lo ve (el RLS solo deja leer los de su negocio).
  const norte = await browser.newPage();
  await signIn(norte, 'coach.norte@example.com');
  await norte.goto('/coach/exercises');
  await expect(norte.getByRole('button', { name: 'Active 120' })).toBeVisible();
  await norte.getByLabel('Search by name').fill('mochila');
  await expect(norte.getByText('No exercise matches')).toBeVisible();
  await norte.close();
});

test('el coach cambia el nombre de uno del catálogo y se queda así al recargar, en los dos idiomas', async ({
  page,
}) => {
  const business = await createTestBusiness(`E2E Renombrar ${suffix()}`);
  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/exercises');

  await page.getByRole('button', { name: /^Lat pulldown/ }).click();
  await expect(page.getByRole('heading', { name: 'Edit exercise' })).toBeVisible();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Lat pulldown');
  await page.getByLabel('Name', { exact: true }).fill('Jalón agarre amplio');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toHaveText('“Jalón agarre amplio” saved.');

  await page.reload();
  await page.getByLabel('Search by name').fill('jalon agarre');
  await expect(page.getByRole('listitem')).toHaveText([/^Jalón agarre amplio/]);
  await page.getByLabel('Search by name').fill('Lat pulldown');
  await expect(page.getByRole('listitem')).toHaveText([/^Close-grip/, /^Neutral-grip/]);

  // En español, el nombre que puso el coach no se traduce (D-071).
  await page.goto('/coach/settings');
  await page.getByRole('main').getByRole('button', { name: 'Español' }).click();
  await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible();
  await page.getByRole('link', { name: 'Ejercicios' }).first().click();
  await page.getByLabel('Buscar por nombre').fill('jalon');
  await expect(page.getByRole('listitem').filter({ hasText: 'Jalón agarre amplio' })).toHaveCount(
    1,
  );
  await expect(page.getByRole('listitem').filter({ hasText: 'Jalón al pecho' })).toHaveCount(0);
});
