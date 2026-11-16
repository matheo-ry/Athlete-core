import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';

import type { WeightUnit } from '@/core/lib';
import { loadAllTranslations } from '@/test/load-translations';

import { newDayExercise } from '../model/day-exercises';
import { prescriptionSummary, updateSets } from '../model/prescription';
import type { IntensityScale, TargetKind } from '../model/prescription';
import type { ProgramDayExercise } from '../model/program-document';
import { PrescriptionEditor } from './PrescriptionEditor';

// La línea de un ejercicio (PR 2.10a), suelta: lo que se escribe y el resumen
// que sale. Cómo entra en "Guardar cambios" lo prueban los tests de extremo a
// extremo.
const OPTIONS = { failureLabel: 'To failure', unit: 'kg', locale: 'en' } as const;
const EXERCISE = '00000000-0000-4000-8000-000000000001';

interface HarnessProps {
  initial: ProgramDayExercise;
  kind?: TargetKind;
  scale?: IntensityScale;
  unit?: WeightUnit;
}

function Harness({ initial, kind = 'reps', scale = 'rir', unit = 'kg' }: HarnessProps) {
  const [item, setItem] = useState(initial);
  return (
    <>
      <p data-testid="summary">{prescriptionSummary(item, { ...OPTIONS, unit })}</p>
      <p data-testid="kg">{String(item.sets[0]?.targetLoadKg)}</p>
      <PrescriptionEditor
        item={item}
        name="Row"
        kind={kind}
        scale={scale}
        unit={unit}
        isBodyweight={false}
        onChange={setItem}
      />
    </>
  );
}

const summary = () => screen.getByTestId('summary').textContent;

describe('módulo programs: series y prescripción (PR 2.10a)', () => {
  beforeAll(() => loadAllTranslations());

  it('una línea para todas: series, repeticiones, intensidad y descanso', async () => {
    const user = userEvent.setup();
    render(<Harness initial={newDayExercise(EXERCISE)} />);

    await user.selectOptions(screen.getByLabelText('Sets'), '4');
    await user.type(screen.getByLabelText('Reps'), '10');
    await user.selectOptions(screen.getByLabelText('Intensity'), 'RIR 2');
    await user.click(screen.getByRole('button', { name: '1:30' }));

    expect(summary()).toBe('4 × 10 · RIR 2 · 1:30');
    expect(screen.getByRole('button', { name: '1:30' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('un rango a medio escribir no cambia nada y avisa; al terminarlo, vale', async () => {
    const user = userEvent.setup();
    render(<Harness initial={newDayExercise(EXERCISE)} />);

    await user.type(screen.getByLabelText('Reps'), '8-');
    expect(screen.getByText('Write a number or a range, like 8 or 8-12.')).toBeVisible();
    expect(summary()).toBe('3 × 8');

    await user.type(screen.getByLabelText('Reps'), '12');
    expect(screen.getByLabelText('Reps')).toHaveValue('8-12');
    expect(summary()).toBe('3 × 8-12');
  });

  it('no deja pasar de 10 series', () => {
    render(<Harness initial={newDayExercise(EXERCISE)} />);

    const options = within(screen.getByLabelText('Sets')).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(
      Array.from({ length: 10 }, (_, index) => String(index + 1)),
    );
  });

  it('"Series distintas" despliega cada serie; "Todas iguales" toma la primera', async () => {
    const user = userEvent.setup();
    const initial = updateSets(newDayExercise(EXERCISE), { repsMin: 8, repsMax: 12 }, 'all');
    render(<Harness initial={initial} />);

    await user.click(screen.getByRole('button', { name: 'Different sets' }));
    const last = screen.getByRole('group', { name: 'Set 3' });
    await user.selectOptions(within(last).getByLabelText('Intensity'), 'To failure');
    expect(summary()).toBe('2 × 8-12 + 1 × 8-12 · To failure');

    await user.click(screen.getByRole('button', { name: 'All sets the same' }));
    expect(summary()).toBe('3 × 8-12');
    expect(screen.queryByRole('group', { name: 'Set 3' })).toBeNull();
  });

  it('si las series ya vienen distintas, aparece desplegado', () => {
    let initial = updateSets(newDayExercise(EXERCISE), { repsMin: 10, repsMax: 12 }, 'all');
    initial = updateSets(initial, { repsMin: 6, repsMax: 8 }, 0);
    render(<Harness initial={initial} />);

    expect(within(screen.getByRole('group', { name: 'Set 1' })).getByLabelText('Reps')).toHaveValue(
      '6-8',
    );
    expect(within(screen.getByRole('group', { name: 'Set 2' })).getByLabelText('Reps')).toHaveValue(
      '10-12',
    );
  });

  it('un ejercicio de tiempo pide segundos, no repeticiones', async () => {
    const user = userEvent.setup();
    render(<Harness initial={newDayExercise(EXERCISE)} kind="time" />);

    expect(screen.queryByLabelText('Reps')).toBeNull();
    await user.type(screen.getByLabelText('Seconds'), '45');
    expect(summary()).toBe('3 × 45 s');
  });

  it('lo escrito con la otra escala se sigue viendo, sin convertir (D-076)', () => {
    const initial = updateSets(
      newDayExercise(EXERCISE),
      { intensityType: 'rpe', intensityValue: 7.5 },
      'all',
    );
    render(<Harness initial={initial} />);

    expect(screen.getByLabelText('Intensity')).toHaveDisplayValue('RPE 7.5');
  });

  it('con el ajuste en RPE se ofrece RPE, con medios puntos (PR 2.10b)', async () => {
    const user = userEvent.setup();
    render(<Harness initial={newDayExercise(EXERCISE)} scale="rpe" />);

    const options = within(screen.getByLabelText('Intensity')).getAllByRole('option');
    expect(options.map((option) => option.textContent).slice(0, 4)).toEqual([
      '—',
      'RPE 1',
      'RPE 1.5',
      'RPE 2',
    ]);
    await user.selectOptions(screen.getByLabelText('Intensity'), 'RPE 7.5');
    expect(summary()).toBe('3 × RPE 7.5');
  });

  it('la carga se escribe en libras y se guarda en kilos (PR 2.10b)', async () => {
    const user = userEvent.setup();
    render(<Harness initial={newDayExercise(EXERCISE)} unit="lb" />);

    await user.type(screen.getByLabelText('Load (lb)'), '22');
    expect(screen.getByTestId('kg')).toHaveTextContent('9.98');
    expect(summary()).toBe('3 × 22 lb');
    expect(screen.getByLabelText('Load (lb)')).toHaveValue('22');

    await user.type(screen.getByLabelText('Load (lb)'), 'x');
    expect(screen.getByText('Write a weight, like 22.5.')).toBeVisible();
    expect(screen.getByTestId('kg')).toHaveTextContent('9.98');
  });
});
