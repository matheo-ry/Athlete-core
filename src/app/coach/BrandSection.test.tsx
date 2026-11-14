import { fireEvent, screen, within } from '@testing-library/react';
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

const MB = 1024 * 1024;
const OLD_LOGO = `${TEST_TENANTS.iron.id}/old-logo.png`;

function imageFile(name: string, type: string, size = 1000): File {
  const file = new File(['fake image'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

/** Las imágenes del logo guardado que se ven fuera de la vista previa (cabecera, espacios…). */
function savedLogosInApp(): HTMLElement[] {
  const preview = screen.getByTestId('brand-preview');
  return screen
    .queryAllByTestId('brand-logo')
    .filter((img) => !preview.contains(img) && img.getAttribute('src')?.includes('/logos/'));
}

/** Iron Lab con un logo ya guardado. */
function ironWithLogo() {
  const iron = {
    ...TEST_TENANTS.iron,
    branding: { ...TEST_TENANTS.iron.branding, logoPath: OLD_LOGO },
  };
  return createFakeTenancySource({
    currentEmail: () => 'coach@example.test',
    memberships: {
      'coach@example.test': [
        {
          tenantId: iron.id,
          role: 'owner',
          status: 'active',
          joinedAt: '2026-11-01T10:00:00Z',
          tenantName: iron.name,
          tenant: iron,
        },
      ],
    },
  });
}

describe('el logo (PR 1.16)', () => {
  it('se ve en la vista previa al elegirlo y, al guardar, en toda la app', async () => {
    const { user } = await openBrand();
    expect(savedLogosInApp()).toHaveLength(0);

    fireEvent.change(screen.getByLabelText('Upload logo'), {
      target: { files: [imageFile('logo.png', 'image/png')] },
    });

    const preview = screen.getByTestId('brand-preview');
    expect(await within(preview).findByTestId('brand-logo')).toHaveAttribute(
      'src',
      expect.stringMatching(/^data:image\/png/),
    );
    expect(savedLogosInApp()).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Save brand' }));

    await screen.findByText('Saved. Your clients will see it the next time they open the app.');
    const logos = savedLogosInApp();
    expect(logos.length).toBeGreaterThan(0);
    expect(logos[0]).toHaveAttribute(
      'src',
      `http://127.0.0.1:54321/storage/v1/object/public/logos/${TEST_TENANTS.iron.id}/fake-logo-1.png`,
    );
    // También en "Mis espacios".
    expect(
      within(screen.getByRole('list', { name: 'Your spaces' })).getByTestId('brand-logo'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove logo' })).toBeVisible();
  });

  it('con una imagen de más de 2 MB, o un SVG o un PDF, lo dice y no la usa', async () => {
    await openBrand();
    const input = screen.getByLabelText('Upload logo');

    fireEvent.change(input, { target: { files: [imageFile('big.png', 'image/png', 3 * MB)] } });
    expect(screen.getByRole('alert')).toHaveTextContent("The logo can't be larger than 2 MB.");

    fireEvent.change(input, { target: { files: [imageFile('logo.svg', 'image/svg+xml')] } });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Format not supported. Use PNG, JPG or WebP.',
    );

    fireEvent.change(input, { target: { files: [imageFile('logo.pdf', 'application/pdf')] } });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Format not supported. Use PNG, JPG or WebP.',
    );
    expect(within(screen.getByTestId('brand-preview')).queryByTestId('brand-logo')).toBeNull();
  });

  it('"Quitar logo" vuelve a enseñar las iniciales y borra el archivo', async () => {
    const tenancy = ironWithLogo();
    const { user } = await renderApp('/coach/settings', { tenancy });
    await screen.findByRole('heading', { name: 'Brand' });
    expect(savedLogosInApp().length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Remove logo' }));
    const preview = screen.getByTestId('brand-preview');
    expect(within(preview).getByTestId('brand-initials')).toHaveTextContent('IL');

    await user.click(screen.getByRole('button', { name: 'Save brand' }));

    await screen.findByText('Saved. Your clients will see it the next time they open the app.');
    expect(savedLogosInApp()).toHaveLength(0);
    expect(screen.getByLabelText('Upload logo')).toBeInTheDocument();
    expect(tenancy.deletedLogoFiles).toEqual([OLD_LOGO]);
  });

  it('cambiar el logo borra el archivo del anterior', async () => {
    const tenancy = ironWithLogo();
    const { user } = await renderApp('/coach/settings', { tenancy });
    await screen.findByRole('heading', { name: 'Brand' });

    fireEvent.change(screen.getByLabelText('Change logo'), {
      target: { files: [imageFile('new.webp', 'image/webp')] },
    });
    await within(screen.getByTestId('brand-preview')).findByTestId('brand-logo');
    await user.click(screen.getByRole('button', { name: 'Save brand' }));

    await screen.findByText('Saved. Your clients will see it the next time they open the app.');
    expect(savedLogosInApp()[0]).toHaveAttribute(
      'src',
      expect.stringContaining('fake-logo-1.webp'),
    );
    expect(tenancy.deletedLogoFiles).toEqual([OLD_LOGO]);
  });

  it('si el logo no carga, se ven las iniciales', async () => {
    await renderApp('/coach/settings', { tenancy: ironWithLogo() });
    await screen.findByRole('heading', { name: 'Brand' });
    const logos = savedLogosInApp();
    const initialsBefore = screen.queryAllByTestId('brand-initials').length;
    const [logo] = logos;

    fireEvent.error(logo as HTMLElement);

    expect(logo).not.toBeInTheDocument();
    expect(savedLogosInApp()).toHaveLength(logos.length - 1);
    expect(screen.getAllByTestId('brand-initials')).toHaveLength(initialsBefore + 1);
  });
});
