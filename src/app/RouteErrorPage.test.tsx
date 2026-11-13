import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RouteErrorPage } from './RouteErrorPage';

function BrokenScreen(): never {
  throw new Error('Example failure');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RouteErrorPage', () => {
  it('muestra un mensaje traducido y registra el error cuando una pantalla falla', async () => {
    // React y el logger escriben el error en la consola: se silencia y se comprueba.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const router = createMemoryRouter([
      { path: '/', element: <BrokenScreen />, errorElement: <RouteErrorPage /> },
    ]);

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('Example failure')).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith('A screen failed to load or render', {
      message: 'Example failure',
    });
  });
});
