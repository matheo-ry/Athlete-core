import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDeviceStore } from '@/core/native';
import { getSupabaseClient } from '@/core/supabase';

import {
  fetchMySetups,
  readOfflineSetups,
  saveClientSetup,
  sendSetup,
  setupsKey,
  writeOfflineSetups,
} from './setups-api';

vi.mock('@/core/supabase', () => ({
  getSupabaseClient: vi.fn(),
}));

describe('setups-api (PR 3.10, D-122)', () => {
  const userId = '00000000-0000-4000-8000-000000000001';
  const tenantId = '00000000-0000-4000-8000-000000000002';
  const exerciseId = '00000000-0000-4000-8000-000000000003';

  beforeEach(async () => {
    vi.clearAllMocks();
    await getDeviceStore().remove(setupsKey(userId, tenantId));
  });

  it('guarda y lee del almacenamiento del teléfono sin conexión (D-118)', async () => {
    expect(await readOfflineSetups(userId, tenantId)).toEqual({});
    await writeOfflineSetups(userId, tenantId, { [exerciseId]: 'Asiento 2 · Agarre 3' });
    const read = await readOfflineSetups(userId, tenantId);
    expect(read).toEqual({ [exerciseId]: 'Asiento 2 · Agarre 3' });
  });

  it('fetchMySetups carga los setups del cliente desde supabase', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEqTenant = vi.fn().mockReturnThis();
    const mockEqClient = vi.fn().mockResolvedValue({
      data: [{ exercise_id: exerciseId, setup: 'Asiento 2' }],
      error: null,
    });

    vi.mocked(getSupabaseClient).mockReturnValue({
      from: vi.fn(() => ({
        select: mockSelect,
      })),
    } as unknown as ReturnType<typeof getSupabaseClient>);

    mockSelect.mockReturnValue({ eq: mockEqTenant });
    mockEqTenant.mockReturnValue({ eq: mockEqClient });

    const result = await fetchMySetups(tenantId, userId);
    expect(result).toEqual({ [exerciseId]: 'Asiento 2' });
  });

  it('saveClientSetup guarda mediante upsert si hay texto', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getSupabaseClient).mockReturnValue({
      from: vi.fn(() => ({
        upsert: mockUpsert,
      })),
    } as unknown as ReturnType<typeof getSupabaseClient>);

    await saveClientSetup(tenantId, userId, exerciseId, 'Asiento 4');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: tenantId,
        client_id: userId,
        exercise_id: exerciseId,
        setup: 'Asiento 4',
      }),
      expect.anything(),
    );
  });

  it('saveClientSetup borra si el setup está vacío', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockEq1 = vi.fn().mockReturnThis();
    const mockEq2 = vi.fn().mockReturnThis();
    const mockEq3 = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(getSupabaseClient).mockReturnValue({
      from: vi.fn(() => ({
        delete: mockDelete,
      })),
    } as unknown as ReturnType<typeof getSupabaseClient>);

    mockDelete.mockReturnValue({ eq: mockEq1 });
    mockEq1.mockReturnValue({ eq: mockEq2 });
    mockEq2.mockReturnValue({ eq: mockEq3 });

    await saveClientSetup(tenantId, userId, exerciseId, '   ');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('sendSetup maneja subidas desde la cola', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getSupabaseClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }),
      },
      from: vi.fn(() => ({
        upsert: mockUpsert,
      })),
    } as unknown as ReturnType<typeof getSupabaseClient>);

    const res = await sendSetup({
      id: 'item-1',
      kind: 'setup',
      tenantId,
      tenantName: 'Iron Lab',
      payload: { exerciseId, setup: 'Asiento 1' },
      revision: 1,
      attempts: 0,
      status: 'pending',
      rejection: null,
    });
    expect(res).toBe('done');
  });
});
