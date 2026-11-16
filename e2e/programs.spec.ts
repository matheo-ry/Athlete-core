import { expect, test } from '@playwright/test';

import { chooseSpace, signIn } from './helpers';
import { E2E_PASSWORD, createTestBusiness } from './supabase-helpers';

// Módulo programs (PR 2.7), contra Supabase local y las plantillas del seed.
// Los tests que cambian plantillas lo hacen en un negocio propio.

const suffix = () => Date.now().toString().slice(-5);

test('el coach ve "Programs" entre "Clients" y "Exercises", con las dos plantillas de Iron Lab', async ({
  page,
}) => {
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');
  const nav = page.getByRole('navigation').first();
  await expect(nav.getByRole('link')).toContainText(['Clients', 'Programs', 'Exercises']);
  await nav.getByRole('link', { name: 'Programs' }).click();

  await expect(page).toHaveURL(/\/coach\/programs$/);
  const rows = page.getByRole('listitem');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Casa + Gym');
  await expect(rows.first()).toContainText('Weekly · 4 training days');
  await expect(rows.last()).toContainText('Pecho / Espalda y Brazo / Pierna');
  await expect(rows.last()).toContainText('8-day cycle · 4 training days');
});

test('cada coach solo ve sus plantillas', async ({ page }) => {
  await signIn(page, 'coach.norte@example.com');
  await page.goto('/coach/programs');

  const rows = page.getByRole('listitem');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Fuerza básica');
});

test('un cliente no ve "Programs" y /coach/programs lo devuelve a su zona', async ({ page }) => {
  await signIn(page, 'ana@example.com');
  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByRole('link', { name: 'Programs' })).toHaveCount(0);

  await page.goto('/coach/programs');
  await expect(page).toHaveURL(/\/client$/);
});

test('un negocio nuevo no tiene plantillas; crea una, la renombra, la archiva y la recupera', async ({
  page,
}) => {
  const business = await createTestBusiness(`E2E Rutinas ${suffix()}`);
  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/programs');
  await expect(page.getByText("You don't have any templates yet")).toBeVisible();

  await page.getByRole('button', { name: 'New template' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Prueba');
  await page.getByLabel('Days in the cycle').fill('10');
  await page.getByRole('button', { name: 'Create' }).click();
  // Se abre en el editor (PR 2.8).
  await expect(page.getByRole('heading', { name: 'Prueba', level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/\/coach\/programs\/[0-9a-f-]{36}$/);
  await page.getByRole('link', { name: '← Programs' }).click();
  await expect(page).toHaveURL(/\/coach\/programs$/);
  await expect(page.getByText(/^10-day cycle · 0 training days/)).toBeVisible();

  await page.getByRole('button', { name: 'Rename: Prueba' }).click();
  await page.getByLabel('New name for “Prueba”').fill('Prueba 2');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toHaveText('Renamed to “Prueba 2”.');
  await page.reload();
  await expect(page.getByRole('listitem')).toContainText('Prueba 2');

  await page.getByRole('button', { name: 'Archive: Prueba 2' }).click();
  await expect(page.getByRole('button', { name: 'Active 0' })).toBeVisible();
  await page.getByRole('button', { name: 'Archived 1' }).click();
  await page.getByRole('button', { name: 'Recover: Prueba 2' }).click();
  await expect(page.getByRole('button', { name: 'Active 1' })).toBeVisible();

  // El editor (PR 2.8, criterio 3): con 7 días pasa a ser semanal.
  await page.getByRole('button', { name: 'Active 1' }).click();
  await page.getByRole('link', { name: 'Prueba 2' }).click();
  await page.getByLabel('Days in the cycle').fill('7');
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  const days = page.getByRole('list', { name: 'Days of the cycle' }).getByRole('button');
  await expect(days).toHaveCount(7);
  await expect(days.first()).toContainText('Monday');
  await expect(days.last()).toContainText('Sunday');

  for (const [day, name, place] of [
    ['Monday', 'Torso', 'Casa'],
    ['Thursday', 'Pierna', 'Gym'],
  ]) {
    await days.filter({ hasText: day }).click();
    await expect(page.getByRole('heading', { name: day, level: 2 })).toBeVisible();
    await page.getByRole('button', { name: 'Training', exact: true }).click();
    await page.getByLabel('Name (optional)').fill(name ?? '');
    await page.getByLabel('Place (optional)').fill(place ?? '');
  }
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Changes saved.');
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();

  await page.reload();
  await expect(days.nth(0)).toContainText('Torso · Casa · 0 exercises · 0 sets');
  await expect(days.nth(3)).toContainText('Pierna · Gym');
  await expect(days.nth(1)).toContainText('Rest');
});

test('el editor enseña las rutinas de ejemplo y guardar no pierde ejercicios ni series', async ({
  page,
}) => {
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');
  await page.goto('/coach/programs');
  await page.getByRole('link', { name: 'Casa + Gym' }).click();

  const days = page.getByRole('list', { name: 'Days of the cycle' }).getByRole('button');
  await expect(days).toHaveCount(7);
  await expect(days.nth(0)).toContainText(
    'MondayEmpuje + dorsal + bíceps · Casa · 7 exercises · 20 sets',
  );
  await expect(days.nth(1)).toContainText('TuesdayRest');
  await expect(days.nth(2)).toContainText('WednesdayTirón + pierna · Gym · 8 exercises · 19 sets');

  // Criterio 4: cambiar el subtítulo del viernes y guardar no toca el lunes.
  // Después se deja como estaba, para no cambiar el seed a los demás tests.
  for (const subtitle of ['Empuje fuerte', 'Empuje']) {
    await days.nth(4).click();
    await expect(page.getByRole('heading', { name: 'Friday', level: 2 })).toBeVisible();
    await page.getByLabel('Subtitle (optional)').fill(subtitle);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status')).toHaveText('Changes saved.');
    await expect(days.nth(4)).toContainText(`Friday${subtitle} · Casa · 5 exercises · 16 sets`);
    await expect(days.nth(0)).toContainText('7 exercises · 20 sets');
  }

  // Criterio 2: la de 8 días va de "Día 1" a "Día 8".
  await page.getByRole('link', { name: '← Programs' }).click();
  await expect(page).toHaveURL(/\/coach\/programs$/);
  await page.getByRole('link', { name: 'Pecho / Espalda y Brazo / Pierna' }).click();
  await expect(days).toHaveCount(8);
  await expect(days.first()).toContainText('Day 1');
  await expect(days.last()).toContainText('Day 8');
});

test('en el móvil el editor enseña la lista de días y, al tocar uno, ese día', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'coach.norte@example.com');
  await page.goto('/coach/programs');
  await page.getByRole('link', { name: 'Fuerza básica' }).click();

  const days = page.getByRole('list', { name: 'Days of the cycle' });
  await expect(days).toBeVisible();
  await expect(page.getByLabel('Subtitle (optional)')).toBeHidden();

  await days.getByRole('button', { name: /^Wednesday/ }).click();
  await expect(page.getByRole('heading', { name: 'Wednesday', level: 2 })).toBeVisible();
  await expect(days).toBeHidden();
  await expect(page.getByLabel('Subtitle (optional)')).toBeVisible();

  await page.getByRole('button', { name: '← Days' }).click();
  await expect(days).toBeVisible();
});

test('el editor avisa al salir sin guardar, recupera los cambios al volver y no pisa lo guardado desde otra ventana', async ({
  page,
  context,
}) => {
  const business = await createTestBusiness(`E2E Borrador ${suffix()}`);
  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/programs');
  await page.getByRole('button', { name: 'New template' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Borrador');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('heading', { name: 'Borrador', level: 1 })).toBeVisible();
  const editorUrl = page.url();
  const days = page.getByRole('list', { name: 'Days of the cycle' }).getByRole('button');

  // Criterio 5: con cambios, ir a "Programs" avisa y se puede quedar.
  await days.nth(1).click();
  await expect(page.getByRole('heading', { name: 'Tuesday', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Training', exact: true }).click();
  await page.getByRole('navigation').first().getByRole('link', { name: 'Programs' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Leave without saving?' })).toBeVisible();
  await page.getByRole('button', { name: 'Stay' }).click();
  await expect(page).toHaveURL(new RegExp(`^${editorUrl}`));

  // Criterio 6: se cierra la pestaña y, al volver, se ofrece recuperar.
  await page.close({ runBeforeUnload: false });
  const again = await context.newPage();
  await again.goto(editorUrl);
  await expect(again.getByRole('region', { name: 'You have unsaved changes' })).toBeVisible();
  await again.getByRole('button', { name: 'Recover' }).click();
  const againDays = again.getByRole('list', { name: 'Days of the cycle' }).getByRole('button');
  await expect(againDays.nth(1)).toContainText('Tuesday0 exercises · 0 sets');

  // Criterio 7: la misma rutina en dos ventanas. Se guarda en una y después en la otra.
  const other = await context.newPage();
  await other.goto(editorUrl);
  const otherDays = other.getByRole('list', { name: 'Days of the cycle' }).getByRole('button');
  await other.getByRole('button', { name: 'Recover' }).click();
  await otherDays.nth(3).click();
  await expect(other.getByRole('heading', { name: 'Thursday', level: 2 })).toBeVisible();
  await other.getByRole('button', { name: 'Training', exact: true }).click();
  await other.getByRole('button', { name: 'Save changes' }).click();
  await expect(other.getByRole('status')).toHaveText('Changes saved.');

  await again.getByRole('button', { name: 'Save changes' }).click();
  await expect(again.getByRole('alert')).toContainText(
    'This program was changed from another device',
  );
  await again.getByRole('button', { name: 'Reload' }).click();
  await expect(againDays.nth(3)).toContainText('Thursday0 exercises');
});

test('en escritorio el menú y la lista de días siguen a la vista al bajar por un día largo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');
  await page.goto('/coach/programs');
  await page.getByRole('link', { name: 'Casa + Gym' }).click();
  await expect(page.getByRole('heading', { name: 'Monday', level: 2 })).toBeVisible();

  await page.getByRole('button', { name: 'Add exercise' }).scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 2000);
  await expect(page.getByRole('link', { name: 'Programs', exact: true })).toBeInViewport();
  await expect(
    page.getByRole('list', { name: 'Days of the cycle' }).getByRole('button').first(),
  ).toBeInViewport();
});
