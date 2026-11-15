import { useQuery } from '@tanstack/react-query';

import { useTenancy } from '@/core/tenancy';

import { fetchExercises } from './exercises-api';

export function exercisesQueryKey(tenantId: string | null) {
  return ['exercises', 'list', tenantId] as const;
}

/** Los ejercicios del negocio activo. El tenant va en la clave: al cambiar de espacio no se reutiliza la caché. */
export function useExercises() {
  const { tenant } = useTenancy();
  const tenantId = tenant?.id ?? null;

  return useQuery({
    queryKey: exercisesQueryKey(tenantId),
    queryFn: () => fetchExercises(tenantId ?? ''),
    enabled: tenantId !== null,
  });
}
