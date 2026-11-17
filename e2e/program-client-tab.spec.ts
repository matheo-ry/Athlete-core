import { expect, test } from '@playwright/test';

import { chooseSpace, signIn } from './helpers';
import {
  E2E_PASSWORD,
  createJoinedClient,
  createTestBusiness,
  rpc,
  select,
  signInApi,
} from './supabase-helpers';

// La pestaña "Rutina" de la ficha del cliente (PR 2.14), contra Supabase
// local. Lo que cambia rutinas, en un negocio propio.

const suffix = () => Date.now().toString().slice(-5);

test('la ficha de Ana enseña "Casa + Gym", la semana en que va y sus días', async ({ page }) => {
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');
  await page.goto('/coach/clients');
  await page.getByRole('link', { name: /Ana Ejemplo/ }).click();

  // Criterio 1, con la rutina del seed (empezó hace 14 días: va por la semana 3).
  await expect(page.getByRole('button', { name: 'Program' })).toBeVisible();
  await expect(page.getByText('Casa + Gym', { exact: true })).toBeVisible();
  await expect(page.getByText(/^Week \d+ · No end date · With calendar · Started /)).toBeVisible();
  const days = page.getByRole('list', { name: 'Days of the current block' }).getByRole('listitem');
  await expect(days).toHaveCount(7);
  await expect(days.nth(2)).toContainText('Wednesday');
  await expect(page.getByRole('link', { name: 'Edit “Casa + Gym”' })).toBeVisible();
});

test('Fran, dado de baja, tiene su rutina a la vista y ninguna acción', async ({ page }) => {
  await signIn(page, 'coach.norte@example.com');
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto('/coach/clients');
  await page.getByRole('button', { name: 'Removed' }).click();
  await page.getByRole('link', { name: /Fran Ejemplo/ }).click();

  // Criterio 7.
  await expect(page.getByText('Fuerza básica', { exact: true })).toBeVisible();
  await expect(
    page.getByText('This client is archived. Reactivate them to assign a program.'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /^Edit/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Assign a template' })).toHaveCount(0);
});

test('editar la rutina de un cliente no cambia la plantilla', async ({ page }) => {
  const business = await createTestBusiness(`E2E Ficha ${suffix()}`);
  const clientEmail = await createJoinedClient(business.code);
  const client = await signInApi(clientEmail, E2E_PASSWORD);
  const [squat] = (await select(
    business.coach,
    'exercises?select=id&library_key=eq.barbell_hip_thrust',
  )) as { id: string }[];
  const saved = (await rpc(business.coach, 'save_program', {
    p_tenant: business.tenantId,
    p_program: {
      name: 'Pierna',
      blocks: [
        {
          cycle_days: 7,
          laps: null,
          days: Array.from({ length: 7 }, (_, index) => ({
            day_number: index + 1,
            kind: index === 0 ? 'training' : 'rest',
            exercises:
              index === 0
                ? [{ exercise_id: squat?.id, sets: [{ reps_min: 8, reps_max: 12 }] }]
                : [],
          })),
        },
      ],
    },
  })) as { id: string };
  const today = new Date().toISOString().slice(0, 10);
  await rpc(business.coach, 'assign_program', {
    p_tenant: business.tenantId,
    p_template: saved.id,
    p_clients: [client.userId],
    p_starts_on: today,
    p_mode: 'calendar',
    p_today: today,
  });

  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto(`/coach/clients/${client.userId}`);
  await page.getByRole('link', { name: 'Edit “Pierna”' }).click();

  // Criterio 2. ("Glute bridge" se mide con el peso del cuerpo, y sustituir
  // solo ofrece los que se miden igual, D-078: se usa otro hip thrust.)
  await expect(page.getByText('Program of E2E Test')).toBeVisible();
  await page.getByRole('list', { name: 'Days of the cycle' }).getByRole('button').first().click();
  await page.getByRole('button', { name: 'Replace: Barbell hip thrust' }).click();
  await page.getByLabel('Search by name').fill('machine hip');
  await page
    .getByRole('list', { name: 'Replace “Barbell hip thrust”' })
    .getByRole('button', { name: /^Machine hip thrust/ })
    .click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Changes saved.');

  await page.goto(`/coach/programs/${saved.id}`);
  await page.getByRole('list', { name: 'Days of the cycle' }).getByRole('button').first().click();
  await expect(page.getByText('1. Barbell hip thrust', { exact: true })).toBeVisible();
});

test('desde la ficha: crear desde cero, guardar como plantilla, terminar, asignar y reiniciar', async ({
  page,
}) => {
  const business = await createTestBusiness(`E2E Acciones ${suffix()}`);
  const clientEmail = await createJoinedClient(business.code);
  const client = await signInApi(clientEmail, E2E_PASSWORD);
  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await page.goto(`/coach/clients/${client.userId}`);

  // Criterio 3: sin rutina; "Crear desde cero" la crea y abre el editor.
  await expect(page.getByText("This client doesn't have a program.")).toBeVisible();
  await page.getByRole('button', { name: 'Create from scratch' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Un día');
  await page.getByLabel('Days in the cycle').fill('1');
  await page.getByRole('button', { name: 'Create and edit' }).click();
  await expect(page.getByText('Program of E2E Test')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Un día', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: '← E2E Test' }).click();
  await expect(page.getByText('Un día', { exact: true })).toBeVisible();

  // Criterio 4: "Guardar como plantilla" crea una plantilla nueva.
  await page.getByRole('button', { name: 'Save as template' }).click();
  await page.getByLabel('Name of the new template').fill('Un día plantilla');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(
    '“Un día plantilla” saved as a template. You have it in Programs.',
  );

  // Criterio 6: "Terminar" la deja en Anteriores y sin rutina.
  await page.getByRole('button', { name: 'End', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, end it' }).click();
  await expect(page.getByText("This client doesn't have a program.")).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Previous programs' })).toBeVisible();

  // Asignar una plantilla con el cliente ya elegido.
  await page.getByRole('button', { name: 'Assign a template' }).click();
  const dialog = page.getByRole('dialog', { name: 'Assign a template to E2E Test' });
  await expect(dialog.getByLabel('Template')).toHaveValue(/.+/);
  await dialog.getByRole('button', { name: 'Assign to 1 client' }).click();
  // Mientras se cargan los días de la rutina nueva también hay un "Loading…"
  // con el mismo papel: el aviso se busca por su texto.
  await expect(page.getByRole('status').filter({ hasText: 'assigned' })).toHaveText(
    '“Un día plantilla” assigned.',
  );
  await expect(page.getByText('Un día plantilla', { exact: true })).toBeVisible();

  // Criterio 5: reiniciar dentro de 5 días: la ficha dice que empieza ese día.
  const inFive = new Date();
  inFive.setDate(inFive.getDate() + 5);
  const date = `${String(inFive.getFullYear())}-${String(inFive.getMonth() + 1).padStart(2, '0')}-${String(inFive.getDate()).padStart(2, '0')}`;
  await page.getByRole('button', { name: 'Restart from a date' }).click();
  await page.getByLabel('Restart on').fill(date);
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Program restarted.');
  await expect(page.getByRole('heading', { name: 'Next program' })).toBeVisible();
  await expect(page.getByText(/^Starts on /)).toBeVisible();

  // La plantilla nueva está en "Rutinas".
  await page.goto('/coach/programs');
  await expect(page.getByRole('link', { name: 'Un día plantilla' })).toBeVisible();
});
