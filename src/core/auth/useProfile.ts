import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AuthResult } from './auth-types';
import type { ProfilePatch, UserProfile } from './profile';
import { useAuth } from './useAuth';

function profileQueryKey(userId: string | null) {
  return ['auth', 'profile', userId] as const;
}

/** El perfil del usuario que ha entrado (D-058). */
export function useProfile() {
  const { service, user, status } = useAuth();
  const userId = status === 'signed-in' && user !== null ? user.id : null;
  return useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: () => service.getProfile(),
    enabled: userId !== null,
  });
}

/** ¿Hace falta la contraseña actual para cambiarla? (D-042) */
export function useNeedsCurrentPassword() {
  const { service, user } = useAuth();
  return useQuery({
    queryKey: ['auth', 'needs-current-password', user?.id ?? null],
    queryFn: () => service.needsCurrentPassword(),
    enabled: user !== null,
  });
}

/**
 * Cambiar el perfil. Se ve al momento (se actualiza la caché antes de
 * guardar) y, si no se puede guardar, vuelve a como estaba.
 */
export function useUpdateProfile() {
  const { service, user } = useAuth();
  const queryClient = useQueryClient();
  const key = profileQueryKey(user?.id ?? null);

  return useMutation<AuthResult, Error, ProfilePatch, { previous: UserProfile | undefined }>({
    mutationFn: (patch) =>
      navigator.onLine
        ? service.updateProfile(patch)
        : Promise.resolve({ ok: false, reason: 'offline' }),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<UserProfile>(key);
      if (previous !== undefined) {
        queryClient.setQueryData<UserProfile>(key, { ...previous, ...patch });
      }
      return { previous };
    },
    onSuccess: (result, _patch, context) => {
      if (!result.ok && context.previous !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onError: (_error, _patch, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
    },
  });
}
