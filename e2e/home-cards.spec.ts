import { expect, test } from '@playwright/test';

import { chooseSpace, signIn } from './helpers';
import {
  E2E_PASSWORD,
  createJoinedClient,
  createTestBusiness,
  rpc,
  signInApi,
} from './supabase-helpers';

// Los inicios con rutinas (PR 2.18), contra Supabase local.

const suffix = () => Date.now().toString().slice(-5);

function localDate(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${String(date.getFullYear())}-${month}-${String(date.getDate()).padStart(2, '0')}`;
}

const template = (name: string, laps: number | null) => ({
  name,
  blocks: [
    {
      cycle_days: 7,
      laps,
      days: Array.from({ length: 7 }, (_, index) => ({
        day_number: index + 1,
        kind: 'training',
        exercises: [],
      })),
    },
  ],
});

test('el inicio del coach avisa de que Carla no tiene rutina y lleva a su ficha', async ({
  page,
}) => {
  // Criterio 1, con el seed.
  await signIn(page, 'coach.iron@example.com');
  await chooseSpace(page, 'Iron Lab');
  const alerts = page.getByRole('list', { name: 'Programs to look at' });
  await expect(alerts.getByRole('link', { name: /Carla Demo/ })).toContainText('No program');
  // Criterio 6: sin textos provisionales.
  await expect(page.getByText(/next phases|Nothing to show yet/)).toHaveCount(0);
  await alerts.getByRole('link', { name: /Carla Demo/ }).click();
  await expect(page.getByRole('heading', { name: 'Carla Demo', level: 1 })).toBeVisible();
});

test('una rutina de una semana da aviso de que termina; una sin fin, ninguno', async ({ page }) => {
  const business = await createTestBusiness(`E2E Inicio ${suffix()}`);
  const client = await signInApi(await createJoinedClient(business.code), E2E_PASSWORD);
  const assign = async (name: string, laps: number | null) => {
    const saved = (await rpc(business.coach, 'save_program', {
      p_tenant: business.tenantId,
      p_program: template(name, laps),
    })) as { id: string };
    await rpc(business.coach, 'assign_program', {
      p_tenant: business.tenantId,
      p_template: saved.id,
      p_clients: [client.userId],
      p_starts_on: localDate(),
      p_mode: 'calendar',
      p_today: localDate(),
    });
  };

  // Criterio 2.
  await assign('Una semana', 1);
  await signIn(page, business.coachEmail, '/login', E2E_PASSWORD);
  await expect(page).toHaveURL(/\/coach$/);
  await expect(
    page.getByRole('list', { name: 'Programs to look at' }).getByRole('link'),
  ).toContainText(/Program ends /);

  // Criterio 3.
  await assign('Sin fin', null);
  await page.reload();
  await expect(page.getByText('All your clients have a program.')).toBeVisible();
});

test('el inicio de Ana enseña lo de hoy y lleva a "Entreno"', async ({ page }) => {
  // Criterio 4. "Casa + Gym": descanso el martes, el jueves y el domingo.
  await signIn(page, 'ana@example.com');
  await expect(page).toHaveURL(/\/client$/);
  const isRest = [0, 2, 4].includes(new Date().getDay());
  if (isRest) {
    await expect(page.getByText('Today: rest')).toBeVisible();
    await page.getByRole('link', { name: 'Open training' }).click();
  } else {
    await page
      .getByRole('main')
      .getByRole('link', { name: /^(Monday|Wednesday|Friday|Saturday)/ })
      .click();
  }
  await expect(page.getByRole('heading', { name: 'Training', level: 1 })).toBeVisible();
  await expect(page.getByText(/next phases|No workout for today/)).toHaveCount(0);
});

test('el inicio de Carla dice que aún no tiene rutina', async ({ page }) => {
  // Criterio 5, en español.
  await signIn(page, 'carla@example.com');
  await expect(page).toHaveURL(/\/client$/);
  await expect(page.getByText('Tu coach aún no te ha asignado una rutina')).toBeVisible();
});
