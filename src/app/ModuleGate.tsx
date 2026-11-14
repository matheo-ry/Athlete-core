import { Navigate, Outlet } from 'react-router';

import { useFeatureFlags } from '@/core/flags';
import type { Profile } from '@/core/tenancy';
import { developmentModuleKeys } from '@/modules';

import { filterActiveModules } from './active-modules';

interface ModuleGateProps {
  moduleKey: string;
  profile: Profile;
}

/**
 * Las pantallas de un módulo solo se abren si su flag está activo para el
 * negocio (ARQUITECTURA §9). Si no, se vuelve al inicio de la zona. Las rutas
 * existen siempre: así el router se crea una sola vez y nunca pierde la
 * navegación cuando cambian los flags (por ejemplo, al cambiar de espacio).
 */
export function ModuleGate({ moduleKey, profile }: ModuleGateProps) {
  const flags = useFeatureFlags();
  const isActive =
    filterActiveModules([{ key: moduleKey }], flags, developmentModuleKeys).length > 0;

  if (!isActive) {
    return <Navigate to={`/${profile}`} replace />;
  }
  return <Outlet />;
}
