import { useMemo } from 'react';

import { useFeatureFlags } from '@/core/flags';
import type { ModuleManifest } from '@/core/modules';
import { registeredModules } from '@/modules';

/**
 * Módulos cuyo flag está activo para el tenant actual. Si el flag está apagado,
 * ni sus rutas ni sus entradas de menú se montan (ARQUITECTURA §9).
 */
export function useActiveModules(): readonly ModuleManifest[] {
  const flags = useFeatureFlags();
  return useMemo(() => registeredModules.filter((module) => flags.isEnabled(module.key)), [flags]);
}
