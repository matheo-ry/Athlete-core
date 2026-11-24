import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HealthConsentState } from '@/core/tenancy';
import { createFakeAuthService } from '@/test/fake-auth-service';
import { createFakeTenancySource } from '@/test/fake-tenancy-source';
import { renderApp } from '@/test/render-app';

import type { ClientHealthData } from '../api/workouts-coach-api';
import { todayIso } from '../model/body-entry';

// Peso y medidas del cliente (PR 3.9b, D-126, D-127): la base de datos, falsa.
const api = vi.hoisted(() => ({
  saveBodyWeight: vi.fn(),
  deleteBodyWeight: vi.fn(),
  saveBodyMeasurement: vi.fn(),
  deleteBodyMeasurement: vi.fn(),
}));
const remote = vi.hoisted(() => ({ fetchClientHealthData: vi.fn() }));

vi.mock('../api/body-data-api', () => api);
vi.mock('../api/workouts-coach-api', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...remote,
}));

const GRANTED: HealthConsentState = {
  status: 'granted',
  grantedAt: '2026-11-16T10:00:00Z',
  textVersion: '2026-11-draft',
};
const NONE: HealthConsentState = { status: 'none' };

/** Lo que "hay en la base de datos": el peso y las medidas que se van apuntando. */
let stored: ClientHealthData;

async function openBody(consent: HealthConsentState, path = '/client/body') {
  const auth = createFakeAuthService({ signedInAs: 'client@example.test' });
  const tenancy = createFakeTenancySource({
    currentEmail: () => auth.currentUser?.email ?? null,
    initialHealthConsent: consent,
  });
  return renderApp(path, { auth, tenancy });
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  stored = { hasConsent: true, weights: [], measurements: [] };
  remote.fetchClientHealthData.mockImplementation(() => Promise.resolve(stored));
  api.saveBodyWeight.mockImplementation(
    (_tenant: string, _user: string, measuredOn: string, weightKg: number) => {
      stored = {
        ...stored,
        weights: [
          ...stored.weights.filter((w) => w.measured_on !== measuredOn),
          {
            id: `00000000-0000-4000-8000-0000000000${measuredOn.slice(-2)}`,
            measured_on: measuredOn,
            weight_kg: weightKg,
          },
        ],
      };
      return Promise.resolve('ok');
    },
  );
  api.saveBodyMeasurement.mockImplementation(
    (
      _tenant: string,
      _user: string,
      input: { measuredOn: string; kind: string; side: 'left' | 'right' | null; valueCm: number },
    ) => {
      stored = {
        ...stored,
        measurements: [
          ...stored.measurements,
          {
            id: `00000000-0000-4000-8000-0000000001${String(stored.measurements.length).padStart(2, '0')}`,
            measured_on: input.measuredOn,
            kind: input.kind,
            side: input.side,
            value_cm: input.valueCm,
          },
        ],
      };
      return Promise.resolve('ok');
    },
  );
  api.deleteBodyWeight.mockImplementation((_tenant: string, id: string) => {
    stored = { ...stored, weights: stored.weights.filter((w) => w.id !== id) };
    return Promise.resolve('ok');
  });
});

describe('peso corporal (D-127)', () => {
  it('sin peso apuntado, lo dice y guarda en kg con la fecha de hoy', async () => {
    const { user } = await openBody(GRANTED);
    expect(await screen.findByTestId('body-weight-last')).toHaveTextContent(
      "You haven't logged your weight yet.",
    );

    await user.type(screen.getByLabelText('Weight (kg)'), '85');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Weight logged.')).toBeVisible();
    expect(api.saveBodyWeight).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      todayIso(new Date()),
      85,
    );
    expect(await screen.findByTestId('body-weight-last')).toHaveTextContent(/^85 kg · logged on /);
    expect(within(screen.getByTestId('body-weight-history')).getAllByRole('listitem')).toHaveLength(
      1,
    );
  });

  it('acepta la coma y no guarda un peso que no vale', async () => {
    const { user } = await openBody(GRANTED);
    const field = await screen.findByLabelText('Weight (kg)');

    await user.type(field, 'mucho');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter your weight, for example 82.5.',
    );

    await user.clear(field);
    await user.type(field, '12');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Weight has to be between 20 and 400 kg.',
    );
    expect(api.saveBodyWeight).not.toHaveBeenCalled();

    await user.clear(field);
    await user.type(field, '82,5');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(api.saveBodyWeight).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        todayIso(new Date()),
        82.5,
      );
    });
  });

  it('Criterio 1: con "Ahora no", al ir a apuntar el peso se vuelve a pedir el permiso', async () => {
    const { user, container } = await openBody(NONE);
    await user.click(await screen.findByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container).toBeTruthy();

    await user.type(await screen.findByLabelText('Weight (kg)'), '85');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const dialog = await screen.findByRole('dialog', { name: 'Your health data' });
    expect(api.saveBodyWeight).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'I agree' }));
    await waitFor(() => {
      expect(api.saveBodyWeight).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('Weight logged.')).toBeVisible();
  });

  it('si dice "Ahora no" otra vez, no se guarda nada y se explica por qué', async () => {
    const { user } = await openBody(NONE);
    await user.click(await screen.findByRole('button', { name: 'Not now' }));

    await user.type(await screen.findByLabelText('Weight (kg)'), '85');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(await screen.findByRole('button', { name: 'Not now' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Without your health data permission this can't be saved.",
    );
    expect(api.saveBodyWeight).not.toHaveBeenCalled();
  });

  it('si no se pudo guardar, lo dice y deja lo escrito', async () => {
    api.saveBodyWeight.mockResolvedValueOnce('error');
    const { user } = await openBody(GRANTED);

    const field = await screen.findByLabelText('Weight (kg)');
    await user.type(field, '85');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.',
    );
    expect(field).toHaveValue('85');
  });

  it('el historial deja borrar un peso, con una pregunta antes', async () => {
    stored = {
      hasConsent: true,
      weights: [
        { id: '00000000-0000-4000-8000-000000000001', measured_on: '2026-11-01', weight_kg: 86 },
        { id: '00000000-0000-4000-8000-000000000002', measured_on: '2026-11-08', weight_kg: 85.5 },
      ],
      measurements: [],
    };
    const { user } = await openBody(GRANTED);
    const history = await screen.findByTestId('body-weight-history');
    expect(within(history).getAllByRole('listitem')).toHaveLength(2);

    const [first] = within(history).getAllByRole('button', { name: /^Delete the entry from/ });
    await user.click(first as HTMLElement);
    expect(api.deleteBodyWeight).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    await waitFor(() => {
      expect(
        within(screen.getByTestId('body-weight-history')).getAllByRole('listitem'),
      ).toHaveLength(1);
    });
    expect(api.deleteBodyWeight).toHaveBeenCalledTimes(1);
  });
});

describe('medidas (D-127)', () => {
  it('Criterio 3: apunto cintura 82 y brazo derecho 38 y salen en su historial', async () => {
    const { user } = await openBody(GRANTED, '/client/body?tab=measurements');

    await user.selectOptions(await screen.findByLabelText('Measurement'), 'waist');
    await user.type(screen.getByLabelText('Value (cm)'), '82');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Measurement logged.')).toBeVisible();

    await user.selectOptions(screen.getByLabelText('Measurement'), 'arm-right');
    await user.type(screen.getByLabelText('Value (cm)'), '38');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const waist = await screen.findByTestId('measure-waist');
    expect(within(waist).getByText('82 cm')).toBeVisible();
    const arm = await screen.findByTestId('measure-arm-right');
    expect(within(arm).getByText('38 cm')).toBeVisible();
    expect(api.saveBodyMeasurement).toHaveBeenCalledWith(expect.any(String), expect.any(String), {
      measuredOn: todayIso(new Date()),
      kind: 'arm',
      side: 'right',
      valueCm: 38,
    });
  });

  it('brazo, muslo y gemelo se apuntan por lados; las demás medidas no', async () => {
    await openBody(GRANTED, '/client/body?tab=measurements');
    const select = await screen.findByLabelText('Measurement');

    const options = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(options).toEqual([
      'Waist',
      'Hips',
      'Chest',
      'Shoulders',
      'Neck',
      'Arm (right)',
      'Arm (left)',
      'Thigh (right)',
      'Thigh (left)',
      'Calf (right)',
      'Calf (left)',
    ]);
  });

  it('sin permiso, al guardar una medida se pide', async () => {
    const { user } = await openBody(NONE, '/client/body?tab=measurements');
    await user.click(await screen.findByRole('button', { name: 'Not now' }));

    await user.type(await screen.findByLabelText('Value (cm)'), '82');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('dialog', { name: 'Your health data' })).toBeVisible();
    expect(api.saveBodyMeasurement).not.toHaveBeenCalled();
  });
});

describe('inicio del cliente', () => {
  it('enseña el último peso y lleva a apuntar otro', async () => {
    stored = {
      hasConsent: true,
      weights: [
        { id: '00000000-0000-4000-8000-000000000016', measured_on: '2026-11-16', weight_kg: 85 },
      ],
      measurements: [],
    };
    const { user, router } = await openBody(GRANTED, '/client');

    expect(await screen.findByTestId('body-weight-card-last')).toHaveTextContent(
      /^85 kg · logged on .*16/,
    );
    await user.click(screen.getByRole('link', { name: 'Update' }));
    expect(router.state.location.pathname).toBe('/client/body');
  });

  it('sin peso, invita a apuntarlo', async () => {
    await openBody(GRANTED, '/client');
    expect(await screen.findByTestId('body-weight-card-last')).toHaveTextContent(
      "You haven't logged your weight yet.",
    );
    expect(screen.getByRole('link', { name: 'Log weight' })).toBeVisible();
  });
});
