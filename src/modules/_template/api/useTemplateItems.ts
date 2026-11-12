import { useQuery } from '@tanstack/react-query';

import { useTenancy } from '@/core/tenancy';

import { fetchTemplateItems } from './template-items-api';

/** Los componentes usan este hook; nunca llaman a la base de datos directamente. */
export function useTemplateItems() {
  const { tenant } = useTenancy();

  return useQuery({
    // El tenant va en la clave: al cambiar de coach no se reutiliza la caché del anterior.
    queryKey: ['template', 'items', tenant?.id ?? null],
    queryFn: fetchTemplateItems,
    enabled: tenant !== null,
  });
}
