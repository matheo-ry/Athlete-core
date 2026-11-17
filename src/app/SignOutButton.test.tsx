import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { getUploadQueue } from '@/core/native';
import { createFakeAuthService } from '@/test/fake-auth-service';
import { renderApp } from '@/test/render-app';

const EMAIL = 'client@example.test';
// El identificador que da el servicio falso.
const USER_ID = `user-${EMAIL}`;

async function addPendingWorkout() {
  await getUploadQueue().enqueue(USER_ID, {
    id: 'workout-1',
    kind: 'workout',
    tenantId: 'tenant-1',
    tenantName: 'Iron Lab',
    payload: { sets: 3 },
  });
}

afterEach(async () => {
  await getUploadQueue().clear(USER_ID);
});

describe('cerrar sesión con entrenos sin subir (D-118)', () => {
  it('pregunta antes y, si se cancela, no cierra ni pierde nada', async () => {
    await addPendingWorkout();
    const { user } = await renderApp('/client/profile', {
      auth: createFakeAuthService({ signedInAs: EMAIL }),
    });

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));

    const dialog = await screen.findByRole('alertdialog', {
      name: "You have workouts that haven't been uploaded. If you sign out, they will be lost.",
    });
    expect(dialog).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(await getUploadQueue().list(USER_ID)).toHaveLength(1);
  });

  it('"Cerrar sesión igualmente" cierra y vacía la cola', async () => {
    await addPendingWorkout();
    const { user } = await renderApp('/client/profile', {
      auth: createFakeAuthService({ signedInAs: EMAIL }),
    });

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));
    await user.click(await screen.findByRole('button', { name: 'Sign out anyway' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible();
    await waitFor(async () => {
      expect(await getUploadQueue().list(USER_ID)).toEqual([]);
    });
  });

  it('sin nada pendiente cierra sin preguntar', async () => {
    const { user } = await renderApp('/client/profile', {
      auth: createFakeAuthService({ signedInAs: EMAIL }),
    });

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
