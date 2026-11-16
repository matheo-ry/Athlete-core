import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { chooseSpace, signIn } from './helpers';
import { E2E_PASSWORD, createTestBusiness } from './supabase-helpers';

// Los ejercicios de cada día del editor (PR 2.9), contra Supabase local. Los
// tests que cambian rutinas lo hacen en un negocio propio.

const suffix = () => Date.now().toString().slice(-5);

/** Un negocio nuevo con la plantilla "Prueba" (semanal) abierta en el lunes, ya de entreno. */
async function openPruebaMonday(page: Page) {
  const business = await createTestBusiness(`E2E Ejercicios del día ${suffix()}`);
  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/programs');
  await page.getByRole('button', { name: 'New template' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Prueba');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('heading', { name: 'Prueba', level: 1 })).toBeVisible();
  await page.getByRole('list', { name: 'Days of the cycle' }).getByRole('button').first().click();
  await expect(page.getByRole('heading', { name: 'Monday', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Training', exact: true }).click();
}

async function addExercise(page: Page, search: string, name: string) {
  await page.getByRole('button', { name: 'Add exercise' }).click();
  await page.getByLabel('Search by name').fill(search);
  await page
    .getByRole('list', { name: 'Add exercise' })
    // El nombre exacto y, detrás, la forma de medir: "Leg press" no coge "Leg press (single-leg)".
    .getByRole('button', { name: new RegExp(`^${name} ?(Weight|Bodyweight|Time|Distance)`) })
    .click();
}

const items = (page: Page) =>
  page.getByRole('list', { name: 'Exercises of the day' }).getByRole('listitem');

test('el lunes de "Casa + Gym" enseña sus 7 ejercicios en orden', async ({ page }) => {
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');
  await page.goto('/coach/programs');
  await page.getByRole('link', { name: 'Casa + Gym' }).click();

  await expect(page.getByText('7 exercises · 20 sets', { exact: true })).toBeVisible();
  await expect(items(page)).toHaveText([
    /^1\. Flexiones con mochila3 sets/,
    /^2\. Flexiones con pies en la cama3 sets/,
    /^3\. Dumbbell lateral raise3 sets/,
    /^4\. Sphinx push-up3 sets/,
    /^5\. Dominadas prono agarre abierto3 sets/,
    /^6\. Curl martillo con mancuernas2 sets/,
    /^7\. Abdomen3 sets/,
  ]);
});

test('añade ejercicios buscándolos, crea uno sin salir, los ordena, quita uno y guarda', async ({
  page,
}) => {
  await openPruebaMonday(page);
  await addExercise(page, 'lat pull', 'Lat pulldown');
  await addExercise(page, 'leg press', 'Leg press');
  await expect(items(page)).toHaveText([/^1\. Lat pulldown3 sets/, /^2\. Leg press3 sets/]);

  // Criterio 3: no existe, se crea sin salir y queda añadido.
  await page.getByRole('button', { name: 'Add exercise' }).click();
  await page.getByLabel('Search by name').fill('remo con goma');
  await page.getByRole('button', { name: 'Create “remo con goma”' }).click();
  await page.getByRole('radio', { name: /Weight and reps/ }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(items(page)).toHaveCount(3);
  await expect(items(page).last()).toContainText('3. remo con goma');

  // Criterio 4: el último sube al primer puesto, se quita otro y se guarda.
  await page.getByRole('button', { name: 'Move up: remo con goma' }).click();
  await page.getByRole('button', { name: 'Move up: remo con goma' }).click();
  await page.getByRole('button', { name: 'Remove: Leg press' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Changes saved.');

  await page.reload();
  await page.getByRole('list', { name: 'Days of the cycle' }).getByRole('button').first().click();
  await expect(items(page)).toHaveText([/^1\. remo con goma3 sets/, /^2\. Lat pulldown3 sets/]);
});

test('en el móvil se añaden y se ordenan ejercicios igual', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPruebaMonday(page);
  await addExercise(page, 'lat pull', 'Lat pulldown');
  await addExercise(page, 'leg press', 'Leg press');
  await page.getByRole('button', { name: 'Move up: Leg press' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Changes saved.');
  await expect(items(page)).toHaveText([/^1\. Leg press/, /^2\. Lat pulldown/]);
});
