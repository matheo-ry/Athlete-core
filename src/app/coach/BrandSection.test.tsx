import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createFakeTenancySource, TEST_TENANTS } from '@/test/fake-tenancy-source';
import { renderApp, renderAppAs } from '@/test/render-app';

// La marca del coach en Ajustes (PR 1.15, D-057). coach@example.test es la
// dueña de Iron Lab (rojo #DC2626, oscuro).

const appVar = (name: string) => document.documentElement.style.getPropertyValue(name);
const previewVar = (name: string) =>
  screen.getByTestId('brand-preview').style.getPropertyValue(name);

async function openBrand() {
  const view = await renderAppAs('coach@example.test', '/coach/settings');
  await screen.findByRole('heading', { name: 'Brand' });
  const main = screen.getByRole('group', { name: 'Main color' });
  return { ...view, main };
}

describe('la marca del coach (PR 1.15)', () => {
  it('empieza con la marca guardada: nombre, color de la paleta marcado y vista previa', async () => {
    const { main } = await openBrand();

    expect(screen.getByLabelText('Business name')).toHaveValue('Iron Lab');
    expect(within(main).getAllByRole('button')).toHaveLength(12);
    expect(within(main).getByRole('button', { name: 'Red' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(previewVar('--brand-primary')).toBe('#dc2626');
  });

  it('la vista previa cambia antes de guardar; la app, al guardar', async () => {
    const { user, main } = await openBrand();

    await user.click(within(main).getByRole('button', { name: 'Green' }));
    expect(previewVar('--brand-primary')).toBe('#16a34a');
    expect(appVar('--brand-primary')).toBe('#dc2626');

    await user.click(screen.getByRole('button', { name: 'Save brand' }));

    expect(
      await screen.findByText('Saved. Your clients will see it the next time they open the app.'),
    ).toBeVisible();
    expect(appVar('--brand-primary')).toBe('#16a34a');
  });

  it('el nombre nuevo se ve en la cabecera y en "Mis espacios"', async () => {
    const { user } = await openBrand();

    await user.clear(screen.getByLabelText('Business name'));
    await user.type(screen.getByLabelText('Business name'), 'Iron Barbell');
    await user.click(screen.getByRole('button', { name: 'Save brand' }));

    await screen.findByText('Saved. Your clients will see it the next time they open the app.');
    expect(screen.getAllByText('Iron Barbell').length).toBeGreaterThan(1);
    expect(
      within(screen.getByRole('list', { name: 'Your spaces' })).getByText('Iron Barbell'),
    ).toBeVisible();
    expect(screen.queryByText('Iron Lab')).toBeNull();
  });

  it('con un amarillo, el texto de los botones pasa a negro para leerse bien (D-028)', async () => {
    const { user, main } = await openBrand();

    await user.click(within(main).getByRole('button', { name: 'Yellow' }));

    expect(previewVar('--brand-primary')).toBe('#eab308');
    expect(previewVar('--brand-on-primary')).toBe('#000000');
  });

  it('el modo claro u oscuro cambia el fondo', async () => {
    const { user } = await openBrand();
    const darkBackground = previewVar('--brand-background');

    await user.click(screen.getByRole('button', { name: 'Light' }));
    expect(previewVar('--brand-background')).not.toBe(darkBackground);
    await user.click(screen.getByRole('button', { name: 'Save brand' }));

    await screen.findByText('Saved. Your clients will see it the next time they open the app.');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('un color propio escrito a mano, y si no es un color lo dice', async () => {
    const { user } = await openBrand();
    const custom = screen.getByLabelText('Your own main color');

    await user.clear(custom);
    await user.type(custom, '123abc');
    expect(previewVar('--brand-primary')).toBe('#123abc');

    await user.clear(custom);
    await user.type(custom, 'red');
    await user.click(screen.getByRole('button', { name: 'Save brand' }));
    expect(screen.getByText('Write a color like #1E5BD8.')).toBeVisible();
    expect(appVar('--brand-primary')).toBe('#dc2626');
  });

  it('"Volver a los colores de ATHLETE CORE" recupera los originales', async () => {
    const { user, main } = await openBrand();

    await user.click(screen.getByRole('button', { name: 'Back to ATHLETE CORE colors' }));

    expect(within(main).getByRole('button', { name: 'Blue' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
    expect(previewVar('--brand-primary')).toBe('#2563eb');
    expect(previewVar('--brand-accent')).toBe('#ff7a1a');
  });

  it('un nombre de una letra no se guarda', async () => {
    const { user } = await openBrand();

    await user.clear(screen.getByLabelText('Business name'));
    await user.type(screen.getByLabelText('Business name'), 'I');
    await user.click(screen.getByRole('button', { name: 'Save brand' }));

    expect(screen.getByText('Write at least 2 characters.')).toBeVisible();
    expect(screen.getAllByText('Iron Lab').length).toBeGreaterThan(0);
  });

  it('quien no es el dueño no ve la marca', async () => {
    const tenancy = createFakeTenancySource({
      memberships: {
        'coach@example.test': [
          {
            tenantId: TEST_TENANTS.iron.id,
            role: 'staff',
            status: 'active',
            joinedAt: '2026-11-01T10:00:00Z',
            tenantName: TEST_TENANTS.iron.name,
            tenant: TEST_TENANTS.iron,
          },
        ],
      },
    });
    await renderApp('/coach/settings', { tenancy });

    expect(await screen.findByRole('heading', { name: 'My account' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Brand' })).toBeNull();
  });
});
