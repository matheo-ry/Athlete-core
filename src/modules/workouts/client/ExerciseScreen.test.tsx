import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/core/auth';
import { i18n } from '@/core/i18n';
import { getDeviceStore } from '@/core/native';
import {
  HealthConsentPromptProvider,
  MEMBERSHIPS_QUERY_KEY,
  TenancyProvider,
  WhenTenancyReady,
  healthConsentQueryKey,
  useHealthConsentPrompt,
} from '@/core/tenancy';
import type { HealthConsentState } from '@/core/tenancy';
import { createFakeAuthService } from '@/test/fake-auth-service';
import {
  FAKE_MEMBERSHIPS,
  TEST_TENANTS,
  createFakeTenancySource,
} from '@/test/fake-tenancy-source';
import { loadAllTranslations } from '@/test/load-translations';

import { readOfflineSetups, setupsKey } from '../api/setups-api';
import { usePreviousPerformance } from '../api/usePreviousPerformance';
import type { ActiveWorkout } from '../model/active-workout';
import { ExerciseScreen } from './ExerciseScreen';

vi.mock('@/core/supabase', () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      upsert: () => Promise.resolve({ error: null }),
      delete: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock('@/modules/exercises', async (importOriginal) => {
  const actual = await importOriginal<object>();
  return {
    ...actual,
    useExerciseOptions: () => ({
      byId: new Map([
        [
          'ex-row',
          {
            id: 'ex-row',
            name: 'Remo Gironda agarre amplio',
            measurement: 'weight_reps',
            isUnilateral: false,
            isArchived: false,
            instructions: 'Espalda recta y codos pegados al cuerpo.',
            videoUrl: null,
          },
        ],
      ]),
      isPending: false,
      isError: false,
    }),
  };
});

vi.mock('../api/usePreviousPerformance', () => ({
  usePreviousPerformance: vi.fn(),
}));

const USER_ID = 'user-client@example.test';
const TENANT_ID = TEST_TENANTS.iron.id;

function makeWorkout(overrides?: Partial<ActiveWorkout>): ActiveWorkout {
  return {
    id: '00000000-0000-4000-8000-000000000010',
    tenantId: TENANT_ID,
    programId: '00000000-0000-4000-8000-000000000020',
    blockId: '00000000-0000-4000-8000-000000000030',
    programDayId: '00000000-0000-4000-8000-000000000040',
    dayNumber: 1,
    startedAt: '2026-11-20T10:00:00.000Z',
    lastChangedAt: '2026-11-20T10:00:00.000Z',
    closedAt: null,
    closeReason: null,
    deviceSince: null,
    lastExercise: 1,
    note: null,
    exercises: [
      {
        id: '00000000-0000-4000-8000-000000000100',
        position: 1,
        exerciseId: 'ex-row',
        programDayExerciseId: '00000000-0000-4000-8000-000000000200',
        measurement: 'weight_reps',
        isUnilateral: false,
        supersetGroup: null,
        restSeconds: 120,
        coachNote: 'Tirar fuerte al esternón.',
        dayNote: null,
        prescribedSets: [],
        isSkipped: false,
        replacesExerciseId: null,
        changedAt: '2026-11-20T10:00:00.000Z',
        sets: [
          {
            id: '00000000-0000-4000-8000-000000000300',
            setNumber: 1,
            side: 'none',
            weightKg: null,
            reps: null,
            durationSeconds: null,
            distanceMeters: null,
            intensityType: null,
            intensityValue: null,
            isDone: false,
            isExtra: false,
            recordedAt: null,
          },
        ],
      },
    ],
    ...overrides,
  };
}

function HealthConsentDialogStub() {
  const { dialog } = useHealthConsentPrompt();
  return dialog.isOpen ? <div role="dialog" aria-label="Tus datos de salud" /> : null;
}

async function renderExerciseScreen(options?: {
  workout?: ActiveWorkout;
  position?: number;
  consent?: HealthConsentState;
}) {
  await loadAllTranslations();
  await i18n.changeLanguage('es');

  const email = 'client@example.test';
  const auth = createFakeAuthService({
    signedInAs: email,
    profiles: { [email]: { weightUnit: 'kg' } },
  });
  const consentState: HealthConsentState = options?.consent ?? {
    status: 'granted',
    grantedAt: '2026-11-16T10:00:00Z',
    textVersion: '2026-11-draft',
  };
  const tenancy = createFakeTenancySource({
    currentEmail: () => auth.currentUser?.email ?? null,
    initialHealthConsent: consentState,
  });

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(
    [...MEMBERSHIPS_QUERY_KEY, USER_ID],
    FAKE_MEMBERSHIPS['client@example.test'],
  );
  queryClient.setQueryData(healthConsentQueryKey(TENANT_ID, USER_ID), consentState);
  const workout = options?.workout ?? makeWorkout();

  const view = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider service={auth}>
        <TenancyProvider source={tenancy}>
          <WhenTenancyReady>
            <HealthConsentPromptProvider>
              <HealthConsentDialogStub />
              <I18nextProvider i18n={i18n}>
                <MemoryRouter initialEntries={['/client/workout?exercise=1']}>
                  <ExerciseScreen workout={workout} position={options?.position ?? 1} />
                </MemoryRouter>
              </I18nextProvider>
            </HealthConsentPromptProvider>
          </WhenTenancyReady>
        </TenancyProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );

  await screen.findByRole('heading', { name: 'Remo Gironda agarre amplio' });

  return { ...view, user: userEvent.setup(), queryClient };
}

describe('PR 3.10 — Notas del día, set-up y "¿Seguro?" (D-120, D-122, D-126)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(usePreviousPerformance).mockReturnValue(null);
    await getDeviceStore().remove(setupsKey(USER_ID, TENANT_ID));
  });

  it('Criterio 3: Veo la nota del coach y las instrucciones del ejercicio', async () => {
    await renderExerciseScreen();

    // Nombre del ejercicio
    expect(screen.getByRole('heading', { name: 'Remo Gironda agarre amplio' })).toBeVisible();

    // Nota del coach en la rutina
    const coachNote = screen.getByTestId('coach-note');
    expect(coachNote).toHaveTextContent('Tirar fuerte al esternón.');

    // Instrucciones del ejercicio de la biblioteca
    const instructions = screen.getByTestId('exercise-instructions');
    expect(instructions).toHaveTextContent('Espalda recta y codos pegados al cuerpo.');
  });

  it('Criterio 1: En "Remo Gironda agarre amplio" escribo el set-up "Asiento 2"; se guarda y persiste para el ejercicio', async () => {
    const { user } = await renderExerciseScreen();

    const setupInput = screen.getByLabelText('Set-up');
    expect(setupInput).toBeVisible();

    await user.type(setupInput, 'Asiento 2');
    fireEvent.blur(setupInput);

    await waitFor(async () => {
      const stored = await readOfflineSetups(USER_ID, TENANT_ID);
      expect(stored['ex-row']).toBe('Asiento 2');
    });
  });

  it('Criterio 2: Escribo la nota "Dolor de hombro": queda en ese entreno', async () => {
    const workout = makeWorkout();
    const { user } = await renderExerciseScreen({ workout });

    const noteInput = screen.getByLabelText('Nota del día');
    expect(noteInput).toBeVisible();

    await user.type(noteInput, 'Dolor de hombro');
    fireEvent.blur(noteInput);

    // La nota se guarda en el entreno
    await waitFor(() => {
      expect(noteInput).toHaveValue('Dolor de hombro');
    });
  });

  it('Criterio 4: Con 35 kg la vez anterior, escribo 5.9: sale "¿Seguro? La vez anterior fueron 35 kg"', async () => {
    vi.mocked(usePreviousPerformance).mockReturnValue({
      exerciseId: 'ex-row',
      programId: '00000000-0000-4000-8000-000000000020',
      dayNumber: 1,
      performedOn: '2026-11-15',
      changedAt: '2026-11-15T10:00:00Z',
      sets: [
        {
          setNumber: 1,
          side: 'none',
          weightKg: 35,
          reps: 10,
          durationSeconds: null,
          distanceMeters: null,
          intensityType: 'rir',
          intensityValue: 1,
        },
      ],
    });

    const { user } = await renderExerciseScreen();

    const weightInput = screen.getByLabelText('Peso (kg)');
    await user.type(weightInput, '5.9');
    fireEvent.blur(weightInput);

    // Aviso "¿Seguro? La vez anterior fueron 35 kg"
    expect(await screen.findByText('¿Seguro? La vez anterior fueron 35 kg')).toBeVisible();

    // Confirmar aplica el peso
    const yesButton = screen.getByRole('button', { name: 'Sí' });
    await user.click(yesButton);

    expect(screen.queryByText('¿Seguro? La vez anterior fueron 35 kg')).toBeNull();
  });

  it('Criterio 5: Sin wifi, escribo una nota y el set-up, cierro la app y la abro: siguen ahí', async () => {
    // 1. Escribimos nota y set-up
    const { user, unmount } = await renderExerciseScreen();

    const setupInput = screen.getByLabelText('Set-up');
    await user.type(setupInput, 'Asiento 2 · Agarre 3');
    fireEvent.blur(setupInput);

    const noteInput = screen.getByLabelText('Nota del día');
    await user.type(noteInput, 'Sensación de fuerza');
    fireEvent.blur(noteInput);

    // 2. Simulamos cerrar la app (desmontar vista)
    unmount();

    // 3. Verificamos que están guardados en el almacenamiento local del dispositivo (sin wifi)
    const storedSetups = await readOfflineSetups(USER_ID, TENANT_ID);
    expect(storedSetups['ex-row']).toBe('Asiento 2 · Agarre 3');

    // 4. Al volver a abrir con el entreno guardado, el set-up y la nota siguen ahí
    const reloadedWorkout = makeWorkout({
      exercises: [
        {
          ...makeWorkout().exercises[0]!,
          dayNote: 'Sensación de fuerza',
        },
      ],
    });

    await renderExerciseScreen({ workout: reloadedWorkout });
    expect(screen.getByLabelText('Nota del día')).toHaveValue('Sensación de fuerza');
    await waitFor(() => {
      expect(screen.getByLabelText('Set-up')).toHaveValue('Asiento 2 · Agarre 3');
    });
  });

  it('Nota del día sin consentimiento: lo pide con el diálogo de salud (D-126)', async () => {
    const { user } = await renderExerciseScreen({
      consent: { status: 'none' },
    });

    const noteInput = screen.getByLabelText('Nota del día');
    await user.click(noteInput);

    // Debe mostrar el modal de consentimiento de datos de salud
    expect(await screen.findByRole('dialog', { name: 'Tus datos de salud' })).toBeVisible();
  });
});
