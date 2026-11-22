import { describe, expect, it } from 'vitest';

import {
  MIN_TEXT_CONTRAST,
  contrastRatio,
  ensureContrast,
  pickReadableOn,
  relativeLuminance,
} from './contrast';

describe('relativeLuminance', () => {
  it('va de 0 (negro) a 1 (blanco)', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('rechaza valores que no son un color hex de 6 dígitos', () => {
    expect(() => relativeLuminance('#fff')).toThrow('Expected a 6-digit hex color');
    expect(() => relativeLuminance('blue')).toThrow('Expected a 6-digit hex color');
  });
});

describe('contrastRatio', () => {
  it('negro sobre blanco da el máximo: 21', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('un color consigo mismo da el mínimo: 1', () => {
    expect(contrastRatio('#1e5bd8', '#1e5bd8')).toBeCloseTo(1, 5);
  });

  it('no depende del orden de los colores', () => {
    expect(contrastRatio('#1e5bd8', '#ffffff')).toBeCloseTo(
      contrastRatio('#ffffff', '#1e5bd8'),
      10,
    );
  });
});

describe('pickReadableOn', () => {
  it('elige texto blanco sobre un color oscuro', () => {
    expect(pickReadableOn('#1e3a8a')).toBe('#ffffff');
  });

  it('elige texto oscuro sobre un color claro', () => {
    expect(pickReadableOn('#fde047')).toBe('#000000');
  });
});

describe('pickReadableOn: garantía para cualquier color', () => {
  it('siempre llega al contraste mínimo, elija lo que elija el coach', () => {
    const steps = [0, 51, 102, 153, 204, 255];
    const toHex = (channel: number) => channel.toString(16).padStart(2, '0');

    for (const r of steps) {
      for (const g of steps) {
        for (const b of steps) {
          const color = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
          expect(contrastRatio(pickReadableOn(color), color)).toBeGreaterThanOrEqual(
            MIN_TEXT_CONTRAST,
          );
        }
      }
    }
  });

  it('también en el peor caso: un color de luminosidad media', () => {
    // Con este azul el blanco se queda en 4,4988: por poco, pero no llega.
    const color = '#2f6bff';
    expect(contrastRatio('#ffffff', color)).toBeLessThan(MIN_TEXT_CONTRAST);
    expect(contrastRatio(pickReadableOn(color), color)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });
});

describe('ensureContrast', () => {
  it('no cambia un color que ya se lee bien', () => {
    expect(ensureContrast('#FFFFFF', '#101010')).toBe('#ffffff');
  });

  it('aclara un color oscuro sobre fondo oscuro hasta que se lee', () => {
    const background = '#0e0d0b';
    const original = '#1e3a8a';
    expect(contrastRatio(original, background)).toBeLessThan(MIN_TEXT_CONTRAST);

    const corrected = ensureContrast(original, background);

    expect(contrastRatio(corrected, background)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    expect(relativeLuminance(corrected)).toBeGreaterThan(relativeLuminance(original));
  });

  it('oscurece un color claro sobre fondo claro hasta que se lee', () => {
    const background = '#ffffff';
    const original = '#fde047';
    expect(contrastRatio(original, background)).toBeLessThan(MIN_TEXT_CONTRAST);

    const corrected = ensureContrast(original, background);

    expect(contrastRatio(corrected, background)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    expect(relativeLuminance(corrected)).toBeLessThan(relativeLuminance(original));
  });

  it('respeta un mínimo distinto del de texto', () => {
    const corrected = ensureContrast('#777777', '#ffffff', 7);
    expect(contrastRatio(corrected, '#ffffff')).toBeGreaterThanOrEqual(7);
  });
});
