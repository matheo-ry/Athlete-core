import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { SEED_PASSWORD, signIn } from './helpers';
import { select, signInApi } from './supabase-helpers';

// Subida, cierre y resumen (PR 3.6a, D-118, D-119 y D-149), contra Supabase
// local y la rutina "Fuerza básica" de Diego (seed): el día 1 son 4
// ejercicios de 3 series, y la plancha va en segundos. Diego no lo usa ningún
// otro test de entrenos, así que no choca con los de Ana en paralelo.

test.describe.configure({ mode: 'serial' });

const DIEGO = 'diego@example.com';

async function startDayOne(page: Page): Promise<void> {
  await signIn(page, DIEGO);
  await expect(page).toHaveURL(/\/client$/);
  await page.goto('/client/workout?day=1');
  await page.getByRole('button', { name: 'Start workout' }).click();
  await expect(page.getByText('0/12 sets')).toBeVisible();
}

/** Los entrenos abiertos de Diego empezados desde `since`, leídos con su sesión (RLS). */
async function openWorkoutsSince(since: string): Promise<unknown[]> {
  const session = await signInApi(DIEGO, SEED_PASSWORD);
  return select(
    session,
    `workouts?select=id&closed_at=is.null&started_at=gte.${encodeURIComponent(since)}`,
  );
}

test('sin conexión queda "Pendiente de subir"; al volver sube, y "Descartar" lo borra', async ({
  page,
}) => {
  const since = new Date(Date.now() - 60_000).toISOString();
  await startDayOne(page);
  await page.getByRole('list', { name: 'Workout exercises' }).getByRole('link').first().click();

  // Criterio 1: sin conexión, lo apuntado espera en el móvil.
  await page.context().setOffline(true);
  const first = page.getByRole('listitem', { name: 'Set 1' });
  await first.getByRole('textbox', { name: 'Reps' }).fill('5');
  await first.getByRole('textbox', { name: 'Reps' }).press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Waiting to upload' })).toBeVisible();

  // Vuelve la conexión: sube solo y el aviso desaparece.
  await page.context().setOffline(false);
  await expect(page.getByText('Waiting to upload')).toHaveCount(0);
  await expect.poll(async () => (await openWorkoutsSince(since)).length).toBe(1);

  // Criterio 6: "Descartar entreno" pide confirmación y lo borra.
  await page.getByRole('link', { name: 'Back to summary' }).click();
  await page.getByRole('button', { name: 'Discard workout' }).click();
  await page.getByRole('button', { name: 'Yes, discard' }).click();
  await expect(page).toHaveURL(/\/client$/);
  await expect.poll(async () => (await openWorkoutsSince(since)).length).toBe(0);
});

test('con todas las series hechas se cierra solo y sale el resumen (criterio 2)', async ({
  page,
}) => {
  await startDayOne(page);
  for (const position of [1, 2, 3, 4]) {
    await page.goto(`/client/workout?exercise=${String(position)}`);
    await expect(page.getByText(`Exercise ${String(position)} of 4`)).toBeVisible();
    for (const number of [1, 2, 3]) {
      const set = page.getByRole('listitem', { name: `Set ${String(number)}` });
      // La plancha se mide en segundos; el resto, en repeticiones.
      const field = set.getByRole('textbox', { name: position === 4 ? 'Seconds' : 'Reps' });
      await field.fill(position === 4 ? '45' : '5');
      await field.press('Enter');
      await expect(set).toHaveAttribute('data-done', 'true');
    }
  }

  // Todo hecho: lo avisa, y al ir al resumen se cierra (si no, en unos segundos).
  await expect(page.getByText('All sets done.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'See summary' }).click();
  await expect(page.getByRole('heading', { name: 'Workout complete!' })).toBeVisible();
  await expect(page).toHaveURL(/\/client\/workout\?finished=/);
  await expect(page.getByRole('definition').nth(1)).toHaveText('12');
  await expect(page.getByRole('definition').nth(2)).toHaveText('4 of 4');

  const id = new URL(page.url()).searchParams.get('finished') ?? '';
  const session = await signInApi(DIEGO, SEED_PASSWORD);
  await expect
    .poll(async () => select(session, `workouts?select=close_reason&id=eq.${id}`))
    .toEqual([{ close_reason: 'completed' }]);

  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL(/\/client$/);
});
