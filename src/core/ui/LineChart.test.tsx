import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LineChart } from './LineChart';
import type { ChartPoint } from './LineChart';

describe('LineChart', () => {
  it('enseña el mensaje de vacío cuando no hay datos', () => {
    render(<LineChart data={[]} emptyMessage="Sin datos aún" />);
    expect(screen.getByTestId('chart-empty')).toHaveTextContent('Sin datos aún');
  });

  it('pinta un único punto en el centro', () => {
    const data: ChartPoint[] = [
      { id: '1', date: '2026-10-01', value: 80, formattedValue: '80 kg' },
    ];
    render(<LineChart data={data} />);
    expect(screen.getByTestId('chart-point-0')).toBeInTheDocument();
    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('80 kg');
  });

  it('pinta múltiples puntos y traza la gráfica', () => {
    const data: ChartPoint[] = [
      { id: '1', date: '2026-10-01', value: 70, formattedValue: '70 kg' },
      { id: '2', date: '2026-10-08', value: 75, formattedValue: '75 kg' },
      { id: '3', date: '2026-10-15', value: 80, formattedValue: '80 kg' },
    ];
    render(<LineChart data={data} />);

    expect(screen.getByTestId('chart-point-0')).toBeInTheDocument();
    expect(screen.getByTestId('chart-point-1')).toBeInTheDocument();
    expect(screen.getByTestId('chart-point-2')).toBeInTheDocument();

    // El último punto está activo por defecto
    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('80 kg');
  });

  it('al pulsar un punto ejecuta onSelectPoint', () => {
    const onSelect = vi.fn();
    const data: ChartPoint[] = [
      { id: '1', date: '2026-10-01', value: 70, formattedValue: '70 kg' },
      { id: '2', date: '2026-10-08', value: 75, formattedValue: '75 kg' },
    ];
    render(<LineChart data={data} onSelectPoint={onSelect} />);

    fireEvent.click(screen.getByTestId('chart-point-0'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '1', value: 70 }));
  });

  it('admite selección por teclado con Enter', () => {
    const onSelect = vi.fn();
    const data: ChartPoint[] = [
      { id: '1', date: '2026-10-01', value: 70, formattedValue: '70 kg' },
    ];
    render(<LineChart data={data} onSelectPoint={onSelect} />);

    fireEvent.keyDown(screen.getByTestId('chart-point-0'), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalled();
  });

  it('al deslizar o mover el puntero actualiza el tooltip del punto más cercano', () => {
    const data: ChartPoint[] = [
      { id: '1', date: '2026-10-01', value: 70, formattedValue: '70 kg' },
      { id: '2', date: '2026-10-15', value: 90, formattedValue: '90 kg' },
    ];
    const { container } = render(<LineChart data={data} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();

    // Simular puntero a la izquierda (cerca del punto 0)
    if (svg) {
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 500,
        height: 220,
        right: 500,
        bottom: 220,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      fireEvent.pointerMove(svg, { clientX: 60 });
      expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('70 kg');
    }
  });
});
