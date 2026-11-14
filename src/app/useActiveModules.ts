import { useMemo } from 'react';

import { useFeatureFlags } from '@/core/flags';
import type { ModuleManifest } from '@/core/modules';
import { developmentModuleKeys, registeredModules } from '@/modules';

import { filterActiveModules } from './active-modules';

/**
 * Módulos cuyo flag está activo para el tenant actual. Si el flag está apagado,
 * ni sus rutas ni sus entradas de menú se montan (ARQUITECTURA §9).
 *
 * Devuelve la MISMA lista mientras no cambie qué módulos están activos: el router
 * se crea una vez por lista (app/router.tsx), y crear otro perdería la navegación.
 */
export function useActiveModules(): readonly ModuleManifest[] {
  const flags = useFeatureFlags();
  const activeKeys = filterActiveModules(registeredModules, flags, developmentModuleKeys)
    .map((module) => module.key)
    .join(',');
  return useMemo(
    () => registeredModules.filter((module) => activeKeys.split(',').includes(module.key)),
    [activeKeys],
  );
}
