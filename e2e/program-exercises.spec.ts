import { expect, test } from '@playwright/test';

import { chooseSpace, signIn } from './helpers';
import { addExercise, items, openPruebaMonday } from './program-helpers';

// Los ejercicios de cada día del editor (PR 2.9), contra Supabase local. Los
// tests que cambian rutinas lo hacen en un negocio propio.

test('el lunes de "Casa + Gym" enseña sus 7 ejercicios en orden', async ({ page }) => {
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');
  await page.goto('/coach/programs');
  await page.getByRole('link', { name: 'Casa + Gym' }).click();

  await expect(page.getByText('7 exercises · 20 sets', { exact: true })).toBeVisible();
  await expect(items(page)).toHaveText([
    // coach.iron trabaja en libras: los 10 kg de lastre se ven como 22 lb (PR 2.10).
    /^1\. Flexiones con mochila3 × 8-12 · RIR 1 · 22 lb · 2:00/,
    /^2\. Flexiones con pies en la cama3 × 8-12 · RIR 1 · 2:00/,
    /^3\. Dumbbell lateral raise3 × 8-12 · RIR 1 · 2:00/,
    /^4\. Sphinx push-up3 × 8-12 · RIR 1 · 2:00/,
    /^5\. Dominadas prono agarre abierto3 × 8-12 · RIR 1 · 2:00/,
    /^6\. Curl martillo con mancuernas2 × 8-12 · RIR 1 · 2:00/,
    /^7\. Abdomen3 × 12-15 · RIR 1 · 1:00/,
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

test('sustituye un ejercicio conservando sus series, y uno archivado se ve con su etiqueta y no sale en el buscador', async ({
  page,
}) => {
  await openPruebaMonday(page);
  await addExercise(page, 'lat pull', 'Lat pulldown');
  await addExercise(page, 'leg press', 'Leg press');

  // Criterio 5: sustituir conserva el sitio y las 3 series.
  await page.getByRole('button', { name: 'Replace: Lat pulldown' }).click();
  await page.getByLabel('Search by name').fill('neutral');
  await page
    .getByRole('list', { name: 'Replace “Lat pulldown”' })
    .getByRole('button', { name: /^Neutral-grip lat pulldown/ })
    .click();
  await expect(items(page)).toHaveText([
    /^1\. Neutral-grip lat pulldown3 sets/,
    /^2\. Leg press3 sets/,
  ]);

  await page.getByRole('button', { name: 'Add a note' }).first().click();
  await page.getByLabel('Note for “Neutral-grip lat pulldown”').fill('Codos pegados');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Changes saved.');
  const editorUrl = page.url();

  // Criterio 6: se archiva "Leg press" en Ejercicios.
  await page.goto('/coach/exercises');
  await page.getByLabel('Search by name').fill('leg press');
  await page.getByRole('button', { name: /^Leg press ?Quads/ }).click();
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('archived');

  await page.goto(editorUrl);
  await expect(items(page).nth(1)).toContainText('2. Leg press3 setsArchived');
  await expect(page.getByLabel('Note for “Neutral-grip lat pulldown”')).toHaveValue(
    'Codos pegados',
  );
  await page.getByRole('button', { name: 'Add exercise' }).click();
  await page.getByLabel('Search by name').fill('leg press');
  await expect(
    page
      .getByRole('list', { name: 'Add exercise' })
      .getByRole('button', { name: /^Leg press ?Weight/ }),
  ).toHaveCount(0);
});

test('un ejercicio que está en una rutina no deja cambiar la forma de medir', async ({ page }) => {
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');
  await page.goto('/coach/exercises');
  await page.getByLabel('Search by name').fill('gironda');
  await page.getByRole('button', { name: /^Remo Gironda agarre amplio/ }).click();

  await expect(
    page.getByText(
      'This exercise is already in a program. To change how it is measured, duplicate it.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('radio', { name: /Time/ })).toBeDisabled();
  await expect(page.getByRole('checkbox', { name: /Unilateral/ })).toBeDisabled();
});
