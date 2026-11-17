import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LineChart } from './LineChart';
import type { ChartPoint } from './LineChart';

const THREE_POINTS: ChartPoint[] = [
  { id: '1', date: '2026-10-01', value: 70, formattedValue: '70 kg' },
  { id: '2', date: '2026-10-08', value: 75, formattedValue: '75 kg' },
  { id: '3', date: '2026-10-15', value: 80, formattedValue: '80 kg' },
];

describe('LineChart', () => {
  it('enseña el mensaje de vacío cuando no hay datos', () => {
    render(<LineChart data={[]} ariaLabel="Peso" emptyMessage="Sin datos aún" />);
    expect(screen.getByTestId('chart-empty')).toHaveTextContent('Sin datos aún');
  });

  it('sin mensaje propio, el vacío sale traducido (no en español fijo)', () => {
    render(<LineChart data={[]} ariaLabel="Weight" />);
    expect(screen.getByTestId('chart-empty')).toHaveTextContent(
      'Not enough data for the chart yet',
    );
  });

  it('pinta un único punto y su tooltip', () => {
    render(<LineChart data={THREE_POINTS.slice(0, 1)} ariaLabel="Peso" />);
    expect(screen.getByTestId('chart-point-0')).toBeInTheDocument();
    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('70 kg');
  });

  it('el último punto está elegido por defecto y es el único en el orden de Tab', () => {
    render(<LineChart data={THREE_POINTS} ariaLabel="Peso" />);
    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('80 kg');
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
    expect(screen.getByRole('radio', { checked: true })).toBe(radios[2]);
  });

  it('se anuncia como grupo con su nombre y un resumen en texto', () => {
    render(<LineChart data={THREE_POINTS} ariaLabel="Peso corporal" />);
    expect(screen.getByRole('radiogroup', { name: 'Peso corporal' })).toBeInTheDocument();
    expect(
      screen.getByText('3 points, from 70 kg (2026-10-01) to 80 kg (2026-10-15)'),
    ).toBeInTheDocument();
  });

  it('la etiqueta de cada punto usa la fecha formateada', () => {
    render(
      <LineChart
        data={THREE_POINTS}
        ariaLabel="Peso"
        formatDateLabel={(d) => `día ${d.slice(8)}`}
      />,
    );
    expect(screen.getByRole('radio', { name: '70 kg, día 01' })).toBeInTheDocument();
  });

  it('al pulsar un punto ejecuta onSelectPoint', () => {
    const onSelect = vi.fn();
    render(<LineChart data={THREE_POINTS} ariaLabel="Peso" onSelectPoint={onSelect} />);
    fireEvent.click(screen.getByTestId('chart-point-0'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '1', value: 70 }));
    expect(screen.getByTestId('chart-point-0')).toHaveAttribute('aria-checked', 'true');
  });

  it('admite selección por teclado con Enter', () => {
    const onSelect = vi.fn();
    render(<LineChart data={THREE_POINTS} ariaLabel="Peso" onSelectPoint={onSelect} />);
    fireEvent.keyDown(screen.getByTestId('chart-point-1'), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '2' }));
  });

  it('las flechas mueven el foco y la selección, y el tooltip sigue al foco', () => {
    const onSelect = vi.fn();
    render(<LineChart data={THREE_POINTS} ariaLabel="Peso" onSelectPoint={onSelect} />);
    const lastPoint = screen.getByTestId('chart-point-2');
    act(() => lastPoint.focus());
    expect(screen.getByTestId('chart-focus-ring')).toBeInTheDocument();

    fireEvent.keyDown(lastPoint, { key: 'ArrowLeft' });
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ id: '2' }));
    expect(screen.getByTestId('chart-point-1')).toHaveFocus();
    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('75 kg');

    fireEvent.keyDown(screen.getByTestId('chart-point-1'), { key: 'Home' });
    expect(screen.getByTestId('chart-point-0')).toHaveFocus();
    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('70 kg');
  });

  it('al mover el puntero, el tooltip muestra el punto más cercano', () => {
    const { container } = render(<LineChart data={THREE_POINTS} ariaLabel="Peso" />);
    const svg = container.querySelector('svg');
    if (svg === null) throw new Error('falta el svg');
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ width: 500, height: 220 }),
    );

    fireEvent.pointerMove(svg, { clientX: 60 });
    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('70 kg');
  });

  it('deja desplazar la página en vertical encima de la gráfica (touch-action: pan-y)', () => {
    const { container } = render(<LineChart data={THREE_POINTS} ariaLabel="Peso" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('touch-pan-y');
    expect(svg).not.toHaveClass('touch-none');
  });

  it('no usa colores fijos: todo sale de las variables de tema', () => {
    const { container } = render(<LineChart data={THREE_POINTS} ariaLabel="Peso" />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
  });
});
