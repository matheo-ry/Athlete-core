import { describe, expect, it } from 'vitest';

import { LOGO_ACCEPT, LOGO_MAX_BYTES, checkLogoFile, logoPathFor, logoUrl } from './logo';

const MB = 1024 * 1024;

describe('el logo (D-057)', () => {
  it('admite PNG, JPG y WebP de 2 MB como máximo', () => {
    expect(checkLogoFile({ type: 'image/png', size: MB })).toBeNull();
    expect(checkLogoFile({ type: 'image/jpeg', size: LOGO_MAX_BYTES })).toBeNull();
    expect(checkLogoFile({ type: 'image/webp', size: 10 })).toBeNull();
    expect(LOGO_ACCEPT).toBe('image/png,image/jpeg,image/webp');
  });

  it('una imagen de más de 2 MB no vale', () => {
    expect(checkLogoFile({ type: 'image/png', size: 3 * MB })).toBe('too_large');
  });

  it('SVG, PDF o cualquier otro formato no valen', () => {
    expect(checkLogoFile({ type: 'image/svg+xml', size: 10 })).toBe('invalid_type');
    expect(checkLogoFile({ type: 'application/pdf', size: 10 })).toBe('invalid_type');
    expect(checkLogoFile({ type: '', size: 10 })).toBe('invalid_type');
    expect(checkLogoFile({ type: 'toString', size: 10 })).toBe('invalid_type');
  });

  it('se guarda en la carpeta del negocio, con un nombre nuevo y su extensión', () => {
    expect(logoPathFor('tenant-1', 'image/jpeg', 'abc')).toBe('tenant-1/abc.jpg');
    expect(logoPathFor('tenant-1', 'image/webp', 'abc')).toBe('tenant-1/abc.webp');
    expect(logoPathFor('tenant-1', 'image/gif', 'abc')).toBeNull();
  });

  it('se ve en la dirección pública del espacio de logos', () => {
    expect(logoUrl('tenant-1/abc.png')).toBe(
      'http://127.0.0.1:54321/storage/v1/object/public/logos/tenant-1/abc.png',
    );
  });
});
