import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import { homePathOf, useTenancyContext } from '@/core/tenancy';
import type { Membership } from '@/core/tenancy';

/**
 * Entrar en un espacio (D-056): pasa a ser el activo, se recuerda en el
 * dispositivo (D-066) y se va a su zona, con su marca.
 */
export function useChooseSpace(options: { replace?: boolean } = {}) {
  const { selectTenant } = useTenancyContext();
  const navigate = useNavigate();
  const { replace = false } = options;

  return useCallback(
    (space: Membership) => {
      selectTenant(space.tenantId);
      void navigate(homePathOf(space), { replace });
    },
    [selectTenant, navigate, replace],
  );
}
