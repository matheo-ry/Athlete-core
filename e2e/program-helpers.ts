import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { signIn } from './helpers';
import { E2E_PASSWORD, createTestBusiness } from './supabase-helpers';

// Ayudas de los tests del editor de rutinas (PR 2.9 y 2.10).

const suffix = () => Date.now().toString().slice(-5);

/** Un negocio nuevo con la plantilla "Prueba" (semanal) abierta en el lunes, ya de entreno. */
export async function openPruebaMonday(page: Page) {
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

export async function addExercise(page: Page, search: string, name: string) {
  await page.getByRole('button', { name: 'Add exercise' }).click();
  await page.getByLabel('Search by name').fill(search);
  await page
    .getByRole('list', { name: 'Add exercise' })
    // El nombre exacto y, detrás, la forma de medir: "Leg press" no coge "Leg press (single-leg)".
    .getByRole('button', { name: new RegExp(`^${name} ?(Weight|Bodyweight|Time|Distance)`) })
    .click();
}

export const items = (page: Page) =>
  page.getByRole('list', { name: 'Exercises of the day' }).getByRole('listitem');

/** Se ve un ejercicio cada vez (D-106): toca el número del que se quiere ver. */
export async function openExercise(page: Page, position: number) {
  await items(page)
    .nth(position - 1)
    .getByRole('button')
    .click();
}
