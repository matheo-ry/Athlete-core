import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChoiceChips } from './ChoiceChips';

const OPTIONS = [
  { key: 'a', label: 'Uno' },
  { key: 'b', label: 'Dos' },
] as const;

describe('ChoiceChips', () => {
  it('anuncia el grupo y la opción elegida', () => {
    render(
      <ChoiceChips
        label="Periodo"
        options={OPTIONS}
        value="b"
        onChange={vi.fn()}
        testIdPrefix="x"
      />,
    );
    expect(screen.getByRole('group', { name: 'Periodo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dos' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Uno' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('zona táctil de 44 px y solo clases de tema que existen', () => {
    render(
      <ChoiceChips
        label="Periodo"
        options={OPTIONS}
        value="a"
        onChange={vi.fn()}
        testIdPrefix="x"
      />,
    );
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveClass('min-h-11');
      // surface-raised y primary-contrast no existen en el tema (src/index.css).
      expect(button.className).not.toMatch(/surface-raised|primary-contrast/);
    }
  });

  it('avisa al elegir otra opción', () => {
    const onChange = vi.fn();
    render(
      <ChoiceChips
        label="Periodo"
        options={OPTIONS}
        value="a"
        onChange={onChange}
        testIdPrefix="x"
      />,
    );
    fireEvent.click(screen.getByTestId('x-b'));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
