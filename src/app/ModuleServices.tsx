import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

import { useAuth } from '@/core/auth';
import { logger } from '@/core/lib';
import type { ModuleService } from '@/core/modules';
import { registeredModules } from '@/modules';

// Lo que los módulos hacen sin pantalla (D-143), como subir lo pendiente: con
// la sesión iniciada, en cualquier pantalla y en cualquier espacio. Por eso no
// depende de los flags del espacio activo: un cliente dado de baja ya no puede
// entrar en ese espacio, y lo suyo tiene que intentar subirse igual para
// poder avisarle. Cada módulo decide dentro qué hace en cada espacio.
const SERVICES: readonly ModuleService[] = registeredModules
  .flatMap((module) => module.services ?? [])
  .filter((service) => service.enabled?.() ?? true);

/** Monta los servicios de los módulos mientras hay sesión. */
export function ModuleServices() {
  const { status } = useAuth();
  if (status !== 'signed-in') {
    return null;
  }
  return SERVICES.map((service) => <ServiceContent key={service.key} service={service} />);
}

/** Si el código de un servicio no se puede cargar, la app sigue y queda registrado. */
function ServiceContent({ service }: { service: ModuleService }) {
  const [Component, setComponent] = useState<ComponentType | null>(null);

  useEffect(() => {
    let isCurrent = true;
    service
      .lazy()
      .then((loaded) => {
        if (isCurrent) {
          setComponent(() => loaded.Component);
        }
      })
      .catch((error: unknown) => {
        logger.error('Could not load a module service', {
          service: service.key,
          message: error instanceof Error ? error.message : 'unknown',
        });
      });
    return () => {
      isCurrent = false;
    };
  }, [service]);

  return Component === null ? null : <Component />;
}
