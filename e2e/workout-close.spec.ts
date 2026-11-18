import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { SEED_PASSWORD, signIn } from './helpers';
import { select, signInApi } from './supabase-helpers';

// Subida, cierre y resumen (PR 3.6, D-118, D-119, D-124, D-149, D-151 y D-152), contra Supabase
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

/** Apunta la serie 1 del primer ejercicio y espera a que llegue a la nube. */
async function logFirstSet(page: Page, since: string): Promise<void> {
  await page.getByRole('list', { name: 'Workout exercises' }).getByRole('link').first().click();
  const first = page.getByRole('listitem', { name: 'Set 1' });
  await first.getByRole('textbox', { name: 'Reps' }).fill('5');
  await first.getByRole('textbox', { name: 'Reps' }).press('Enter');
  await expect(first).toHaveAttribute('data-done', 'true');
  const session = await signInApi(DIEGO, SEED_PASSWORD);
  const path = `workout_sets?select=id&is_done=eq.true&recorded_at=gte.${encodeURIComponent(since)}`;
  await expect.poll(async () => (await select(session, path)).length).toBe(1);
}

test('dos móviles: "Seguir aquí" lo trae con lo apuntado y el otro se entera (D-124)', async ({
  page,
  browser,
}) => {
  const since = new Date().toISOString();
  await startDayOne(page);
  await logFirstSet(page, since);
  const session = await signInApi(DIEGO, SEED_PASSWORD);
  const openDevice = async () =>
    select(session, 'workouts?select=open_device_id&closed_at=is.null');
  const [before] = await openDevice();

  // Otro contexto del navegador es otro móvil: su propio almacén.
  const otherPhone = await browser.newContext();
  const other = await otherPhone.newPage();
  await signIn(other, DIEGO);
  await other.goto('/client/workout?day=1');
  await expect(other.getByText('This workout is open on another device')).toBeVisible();
  await expect(other.getByRole('button', { name: 'Start workout' })).toHaveCount(0);
  await other.getByRole('button', { name: 'Continue here' }).click();
  await expect(other.getByText('1/12 sets')).toBeVisible();
  await expect.poll(async () => (await openDevice())[0]).not.toEqual(before);

  // El primero ya no puede seguir apuntando, hasta que lo recupere.
  await page.reload();
  await expect(page.getByText('This workout is open on another device')).toBeVisible();
  await expect(page.getByRole('listitem', { name: 'Set 1' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue here' }).click();
  await expect(page.getByRole('listitem', { name: 'Set 1' })).toHaveAttribute('data-done', 'true');
  await expect.poll(async () => (await openDevice())[0]).toEqual(before);

  await otherPhone.close();
  await page.getByRole('link', { name: 'Back to summary' }).click();
  await page.getByRole('button', { name: 'Discard workout' }).click();
  await page.getByRole('button', { name: 'Yes, discard' }).click();
  await expect.poll(async () => (await openWorkoutsSince(since)).length).toBe(0);
});

test('a las 12 horas sin tocarlo se cierra solo y lo avisa (D-119)', async ({ page }) => {
  const since = new Date().toISOString();
  await startDayOne(page);
  await logFirstSet(page, since);

  // Se envejece lo guardado en el "móvil", como si llevara 13 horas sin tocarse.
  await page.evaluate(
    (at) => {
      const key = Object.keys(localStorage).find((item) => item.includes('workouts.active.'));
      if (key !== undefined) {
        const stored = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, unknown>;
        localStorage.setItem(key, JSON.stringify({ ...stored, startedAt: at, lastChangedAt: at }));
      }
    },
    new Date(Date.now() - 13 * 3_600_000).toISOString(),
  );
  await page.goto('/client');

  const notice = page.getByRole('status').filter({ hasText: /We saved your \w+ workout/ });
  await expect(notice).toBeVisible();
  await expect(page).toHaveURL(/\/client$/);
  const session = await signInApi(DIEGO, SEED_PASSWORD);
  const path = `workouts?select=close_reason&last_changed_at=gte.${encodeURIComponent(since)}`;
  await expect.poll(async () => select(session, path)).toEqual([{ close_reason: 'timeout' }]);

  await notice.getByRole('button').click();
  await expect(notice).toHaveCount(0);
});
