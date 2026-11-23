import { expect, test } from '@playwright/test';

import { SEED_PASSWORD, signIn } from './helpers';
import { select, signInApi } from './supabase-helpers';

// Apuntar un entreno (PR 3.5a, D-119 y D-120), contra Supabase local y la
// rutina "Casa + Gym" de Ana (seed). En el navegador, con
// VITE_ALLOW_WEB_WORKOUTS (D-116), como en el CI.

test.describe.configure({ mode: 'serial' });

/**
 * Espera a que el cierre haya subido. Si la página se cierra antes, el entreno
 * se queda abierto en la nube y el test siguiente, que es otro "móvil", lo ve
 * abierto en otro dispositivo (D-124).
 */
async function expectNothingOpen(email: string): Promise<void> {
  const session = await signInApi(email, SEED_PASSWORD);
  await expect
    .poll(async () => (await select(session, 'workouts?select=id&closed_at=is.null')).length)
    .toBe(0);
}

test('Ana inicia el lunes, apunta la serie 1 y la sigue viendo al recargar', async ({ page }) => {
  await signIn(page, 'ana@example.com');
  await expect(page).toHaveURL(/\/client$/);

  // Criterio 1: "Hoy toca" lleva "Iniciar entreno" (si hoy no es descanso);
  // el lunes se empieza desde "Entreno".
  await page.getByRole('link', { name: 'Training' }).first().click();
  await page.getByRole('list', { name: 'Days of your program' }).getByRole('link').first().click();
  await page.getByRole('link', { name: 'Start workout' }).click();
  await page.getByRole('button', { name: 'Start workout' }).click();

  // Criterio 2: los 7 ejercicios y "0/20 series".
  await expect(page.getByText('0/20 sets')).toBeVisible();
  const exercises = page.getByRole('list', { name: 'Workout exercises' }).getByRole('link');
  await expect(exercises).toHaveCount(7);
  await exercises.first().click();
  await expect(page.getByRole('heading', { name: 'Flexiones con mochila' })).toBeVisible();
  await expect(page.getByText('Exercise 1 of 7')).toBeVisible();
  const sets = page.getByRole('listitem', { name: /^Set \d$/ });
  await expect(sets).toHaveCount(3);

  // Criterio 3: el lastre con + y 12 repeticiones con el teclado. Ana ya hizo
  // este día (seed), así que el primer + pone lo gris de la vez anterior, no lo
  // prescrito (D-120, D-146). Lo gris llega después de pintar la pantalla: se
  // espera a que salga para no pulsar antes (con lo prescrito daba 10 o 0
  // según quién llegara primero). Con 0 kg de lastre, lo gris son solo las
  // repeticiones ("10 (1)"); con lastre, "2.5 × 12 (1)".
  const first = sets.first();
  await expect(first).toHaveAttribute('data-done', 'false');
  const previous = first.getByTestId('previous');
  await expect(previous).toBeVisible();
  const previousLoad = /^([\d.]+) × /.exec((await previous.textContent()) ?? '')?.[1] ?? '0';
  await first.getByRole('button', { name: 'Increase Added load (kg)' }).click();
  await expect(first.getByRole('textbox', { name: 'Added load (kg)' })).toHaveValue(previousLoad);
  await first.getByRole('textbox', { name: 'Reps' }).fill('12');
  await first.getByRole('textbox', { name: 'Reps' }).press('Enter');
  await expect(first).toHaveAttribute('data-done', 'true');

  // Se guarda en el dispositivo al instante: al recargar sigue ahí.
  await page.reload();
  const again = page.getByRole('listitem', { name: 'Set 1' });
  await expect(again.getByRole('textbox', { name: 'Reps' })).toHaveValue('12');
  await expect(again).toHaveAttribute('data-done', 'true');

  await page.getByRole('link', { name: 'Back to summary' }).click();
  await expect(page.getByText('1/20 sets')).toBeVisible();
  await expect(page.getByRole('img', { name: '1 of 3 sets done' })).toBeVisible();

  // Terminar: el resumen final (PR 3.6) y, de ahí, al inicio sin entreno abierto.
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page.getByRole('heading', { name: 'Workout finished' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL(/\/client$/);
  await expectNothingOpen('ana@example.com');
});

test('desmarcar, volver al mismo ejercicio al abrir y la vez anterior en gris (PR 3.5b)', async ({
  page,
}) => {
  await signIn(page, 'ana@example.com');
  await expect(page).toHaveURL(/\/client$/);
  await page.goto('/client/workout?day=1');
  await page.getByRole('button', { name: 'Start workout' }).click();
  const exercises = page.getByRole('list', { name: 'Workout exercises' }).getByRole('link');
  await exercises.nth(1).click();
  await expect(page.getByText('Exercise 2 of 7')).toBeVisible();

  // Criterio 4: apuntar y desmarcar.
  const first = page.getByRole('listitem', { name: 'Set 1' });
  await first.getByRole('textbox', { name: 'Reps' }).fill('9');
  await first.getByRole('textbox', { name: 'Reps' }).press('Enter');
  await expect(first).toHaveAttribute('data-done', 'true');
  await first.getByRole('button', { name: 'Unmark set 1' }).click();
  await expect(first).toHaveAttribute('data-done', 'false');
  await first.getByRole('textbox', { name: 'Reps' }).fill('8');
  await first.getByRole('textbox', { name: 'Reps' }).press('Enter');

  // "+ Serie".
  await page.getByRole('button', { name: '+ Set' }).click();
  await expect(page.getByRole('listitem', { name: /^Set \d$/ })).toHaveCount(4);

  // Criterio 6: al abrir la app, directo al mismo ejercicio, con lo apuntado.
  await page.goto('/client');
  await expect(page).toHaveURL(/\/client\/workout\?exercise=2$/);
  await expect(
    page.getByRole('listitem', { name: 'Set 1' }).getByRole('textbox', { name: 'Reps' }),
  ).toHaveValue('8');

  // Se termina: la próxima vez, en gris lo de hoy, y "Igual" lo copia (criterio 7).
  await page.getByRole('link', { name: 'Back to summary' }).click();
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL(/\/client$/);
  await page.goto('/client/workout?day=1');
  await page.getByRole('button', { name: 'Start workout' }).click();
  await page.getByRole('list', { name: 'Workout exercises' }).getByRole('link').nth(1).click();
  const again = page.getByRole('listitem', { name: 'Set 1' });
  await expect(again.getByTestId('previous')).toHaveText(/(^| )8$/);
  await again.getByRole('button', { name: 'Same' }).click();
  await expect(again.getByRole('textbox', { name: 'Reps' })).toHaveValue('8');
  await expect(again).toHaveAttribute('data-done', 'true');
  await page.getByRole('link', { name: 'Back to summary' }).click();
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expectNothingOpen('ana@example.com');
});

test('Bruno ve los pesos en libras (criterio 5)', async ({ page }) => {
  await signIn(page, 'bruno@example.com');
  await expect(page).toHaveURL(/\/client$/);
  await page.goto('/client/workout?day=1');
  await page.getByRole('button', { name: 'Start workout' }).click();
  await page.getByRole('list', { name: 'Workout exercises' }).getByRole('link').first().click();
  await expect(
    page.getByRole('listitem', { name: 'Set 1' }).getByRole('textbox', { name: 'Weight (lb)' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Back to summary' }).click();
  await page.getByRole('button', { name: 'Finish workout' }).click();
  // Sin ninguna serie hecha no se guarda: vuelve al inicio, sin resumen (D-119).
  await expect(page).toHaveURL(/\/client$/);
  // Y no se queda abierto en la nube, aunque subiera al empezar (D-151).
  await expectNothingOpen('bruno@example.com');
});

test('Bruno apunta un unilateral por lados y el descanso arranca con el segundo (PR 3.8)', async ({
  page,
}) => {
  const startedAt = new Date().toISOString();
  await signIn(page, 'bruno@example.com');
  await expect(page).toHaveURL(/\/client$/);
  // El día 2 es "Brazo / Pierna 1", con "Curl banco Scott unilateral" en tercer lugar.
  await page.goto('/client/workout?day=2');
  await page.getByRole('button', { name: 'Start workout' }).click();
  await page.getByRole('list', { name: 'Workout exercises' }).getByRole('link').nth(2).click();
  await expect(page.getByRole('heading', { name: 'Curl banco Scott unilateral' })).toBeVisible();

  const first = page.getByRole('listitem', { name: 'Set 1' });
  const right = first.getByRole('group', { name: 'Right' });
  const left = first.getByRole('group', { name: 'Left' });

  // Criterio 1: derecha 9 repeticiones; la serie no está hecha hasta apuntar la izquierda.
  await right.getByRole('textbox', { name: 'Reps' }).fill('9');
  await right.getByRole('textbox', { name: 'Reps' }).press('Enter');
  await expect(right).toHaveAttribute('data-done', 'true');
  await expect(first).toHaveAttribute('data-done', 'false');
  await expect(page.getByRole('timer')).toHaveCount(0);

  // Con la izquierda queda hecha y arranca el descanso.
  await left.getByRole('textbox', { name: 'Reps' }).fill('8');
  await left.getByRole('textbox', { name: 'Reps' }).press('Enter');
  await expect(first).toHaveAttribute('data-done', 'true');
  await expect(page.getByRole('timer')).toBeVisible();

  await page.getByRole('link', { name: 'Back to summary' }).click();
  await expect(page.getByText('1/21 sets')).toBeVisible();
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page.getByRole('heading', { name: 'Workout finished' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expectNothingOpen('bruno@example.com');

  // En la base de datos hay una fila por lado.
  const session = await signInApi('bruno@example.com', SEED_PASSWORD);
  const since = encodeURIComponent(startedAt);
  await expect
    .poll(async () => {
      const rows = (await select(
        session,
        `workout_sets?select=side,reps&recorded_at=gte.${since}&order=side`,
      )) as { side: string; reps: number }[];
      return rows.map((row) => `${row.side}:${String(row.reps)}`);
    })
    .toEqual(['left:8', 'right:9']);
});

test('Bruno cambia un ejercicio, salta otro y lo deshace (PR 3.8)', async ({ page }) => {
  await signIn(page, 'bruno@example.com');
  await expect(page).toHaveURL(/\/client$/);
  await page.goto('/client/workout?day=2');
  await page.getByRole('button', { name: 'Start workout' }).click();
  const exercises = page.getByRole('list', { name: 'Workout exercises' }).getByRole('link');

  // Criterio 3: cambiar el primer ejercicio por otro de sus rutinas (la lista es la que
  // permite ver el RLS al cliente: solo los ejercicios de sus rutinas).
  await exercises.first().click();
  await expect(page.getByRole('heading', { name: 'Press francés' })).toBeVisible();
  await page.getByRole('button', { name: 'Change exercise' }).click();
  await page
    .getByRole('list', { name: /^Change/ })
    .getByRole('button')
    .filter({ hasNotText: 'Press francés' })
    .first()
    .click();
  await expect(page.getByText('Instead of Press francés')).toBeVisible();
  await page.getByRole('link', { name: 'Back to summary' }).click();
  await expect(page.getByText(/^Replaced by /)).toBeVisible();

  // Saltar y deshacer.
  await exercises.nth(1).click();
  await page.getByRole('button', { name: 'Skip exercise' }).click();
  await expect(page.getByTestId('skipped-notice')).toBeVisible();
  await page.getByRole('link', { name: 'Back to summary' }).click();
  await expect(page.getByText('Skipped', { exact: true })).toBeVisible();
  await exercises.nth(1).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByTestId('skipped-notice')).toHaveCount(0);

  // Sin ninguna serie hecha no se guarda: vuelve al inicio y no queda abierto.
  await page.getByRole('link', { name: 'Back to summary' }).click();
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page).toHaveURL(/\/client$/);
  await expectNothingOpen('bruno@example.com');
});
