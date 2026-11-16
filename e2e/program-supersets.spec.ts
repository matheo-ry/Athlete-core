import { expect, test } from '@playwright/test';

import { signIn } from './helpers';
import { addExercise, items, openExercise, openPruebaMonday } from './program-helpers';
import {
  E2E_PASSWORD,
  createJoinedClient,
  createTestBusiness,
  rpc,
  select,
  signInApi,
} from './supabase-helpers';

// Superseries y circuitos (PR 2.17), contra Supabase local, en un negocio propio.

const suffix = () => Date.now().toString().slice(-5);

test('agrupa dos ejercicios, un tercero lo hace circuito, y quitar o desagrupar lo deshace', async ({
  page,
}) => {
  await openPruebaMonday(page);
  await addExercise(page, 'lat pull', 'Lat pulldown');
  await addExercise(page, 'leg press', 'Leg press');
  await addExercise(page, 'plank', 'Plank');

  // Criterio 1: dos seguidos quedan como "Superserie", también tras guardar y recargar.
  await openExercise(page, 1);
  await page.getByRole('button', { name: 'Group “Lat pulldown” with the next exercise' }).click();
  await expect(page.getByText('Superset · 1 of 2')).toBeVisible();
  await expect(items(page)).toHaveText([/Superset$/, /Superset$/, /^3\. Plank3 sets$/]);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Changes saved.');
  await page.reload();
  await page.getByRole('list', { name: 'Days of the cycle' }).getByRole('button').first().click();
  await expect(items(page)).toHaveText([/Superset$/, /Superset$/, /^3\. Plank3 sets$/]);

  // Criterio 2: con un tercero, "Circuito".
  await openExercise(page, 2);
  await page.getByRole('button', { name: 'Group “Leg press” with the next exercise' }).click();
  await expect(page.getByText('Circuit · 2 of 3')).toBeVisible();
  await expect(items(page)).toHaveText([/Circuit$/, /Circuit$/, /Circuit$/]);

  // Criterio 3: quitar uno lo deja en "Superserie"; quitar otro, sin grupo.
  await openExercise(page, 3);
  await page.getByRole('button', { name: 'Remove: Plank' }).click();
  await expect(items(page)).toHaveText([/Superset$/, /Superset$/]);
  await page.getByRole('button', { name: 'Remove: Leg press' }).click();
  await expect(items(page)).toHaveText([/^1\. Lat pulldown3 sets$/]);

  // Criterio 4: "Desagrupar" los deja sueltos y en el mismo orden.
  await addExercise(page, 'leg press', 'Leg press');
  await openExercise(page, 1);
  await page.getByRole('button', { name: 'Group “Lat pulldown” with the next exercise' }).click();
  await page.getByRole('button', { name: 'Ungroup “Lat pulldown”' }).click();
  await expect(items(page)).toHaveText([/^1\. Lat pulldown3 sets$/, /^2\. Leg press3 sets$/]);
});

test('la clienta ve los dos ejercicios juntos, con la marca "Superserie"', async ({ page }) => {
  // Criterio 5.
  const business = await createTestBusiness(`E2E Superseries ${suffix()}`);
  const clientEmail = await createJoinedClient(business.code);
  const client = await signInApi(clientEmail, E2E_PASSWORD);
  const exercises = (await select(
    business.coach,
    'exercises?select=id,library_key&library_key=in.(lat_pulldown,leg_press,plank)',
  )) as { id: string; library_key: string }[];
  const idOf = (key: string) => exercises.find((item) => item.library_key === key)?.id;
  const item = (key: string, group: number | null) => ({
    exercise_id: idOf(key),
    superset_group: group,
    sets: [{}],
  });
  const saved = (await rpc(business.coach, 'save_program', {
    p_tenant: business.tenantId,
    p_program: {
      name: 'Con superserie',
      blocks: [
        {
          cycle_days: 1,
          laps: null,
          days: [
            {
              day_number: 1,
              kind: 'training',
              exercises: [item('lat_pulldown', 1), item('leg_press', 1), item('plank', null)],
            },
          ],
        },
      ],
    },
  })) as { id: string };
  const today = new Date();
  const date = `${String(today.getFullYear())}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  await rpc(business.coach, 'assign_program', {
    p_tenant: business.tenantId,
    p_template: saved.id,
    p_clients: [client.userId],
    p_starts_on: date,
    p_mode: 'calendar',
    p_today: date,
  });

  await signIn(page, clientEmail, '/login', E2E_PASSWORD);
  await page.getByRole('link', { name: 'Training' }).first().click();
  await page.getByRole('list', { name: 'Days of your program' }).getByRole('link').first().click();
  const list = page.getByRole('list', { name: 'Exercises of the day' }).getByRole('link');
  await expect(list.nth(0)).toContainText('Superset · 1 of 2');
  await expect(list.nth(1)).toContainText('Superset · 2 of 2');
  await expect(list.nth(2)).not.toContainText('Superset');
});
