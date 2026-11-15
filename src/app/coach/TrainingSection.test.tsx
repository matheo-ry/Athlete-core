import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderAppAs } from '@/test/render-app';

describe('Ajustes del coach: "Entrenamiento" (PR 2.10b, D-076)', () => {
  it('el dueño elige RIR o RPE; por defecto, RIR', async () => {
    const { user } = await renderAppAs('coach@example.test', '/coach/settings');

    const rir = await screen.findByRole('button', { name: 'RIR (reps in reserve)' });
    const rpe = screen.getByRole('button', { name: 'RPE (effort from 1 to 10)' });
    expect(rir).toHaveAttribute('aria-pressed', 'true');

    await user.click(rpe);
    expect(
      await screen.findByRole('button', { name: 'RPE (effort from 1 to 10)', pressed: true }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'RIR (reps in reserve)' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
