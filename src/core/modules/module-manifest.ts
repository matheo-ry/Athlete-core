import type { ComponentType } from 'react';

import type { ModuleTranslations } from '../i18n';
import type { Profile } from '../tenancy';
import type { IconName } from '../ui';

// La ficha de un módulo (ARQUITECTURA §5). `app/router.tsx` y las carcasas leen
// estas fichas para montar las rutas y el menú: un módulo nunca se "enchufa" a
// mano en `app/`.

export interface ModuleRoute {
  /** Relativa a la zona del perfil: 'programs' se monta en /coach/programs. */
  path: string;
  /** Carga la pantalla solo cuando se visita. */
  lazy: () => Promise<{ Component: ComponentType }>;
}

export interface ModuleNavItem {
  /** Ruta completa: '/coach/programs'. */
  to: string;
  labelKey: string;
  icon: IconName;
  /** Posición en el menú: de menor a mayor. */
  order: number;
}

/** Pestaña que un módulo añade a la ficha de un cliente (vista del coach). */
export interface ClientProfileTab {
  key: string;
  labelKey: string;
  lazy: () => Promise<{ Component: ComponentType }>;
}

export interface ModuleManifest {
  /** Nombre único en snake_case. Coincide con su feature flag y con el prefijo de sus textos. */
  key: string;
  routes: Record<Profile, readonly ModuleRoute[]>;
  nav: Record<Profile, readonly ModuleNavItem[]>;
  i18n: ModuleTranslations;
  clientProfileTabs: readonly ClientProfileTab[];
}

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const PROFILES: readonly Profile[] = ['coach', 'client'];

/**
 * Declara un módulo. Comprueba al arrancar los errores típicos de un manifest,
 * para que fallen en desarrollo y no como una ruta rota en producción.
 */
export function defineModule(manifest: ModuleManifest): ModuleManifest {
  if (!KEY_PATTERN.test(manifest.key)) {
    throw new Error(`Module key "${manifest.key}" must be snake_case`);
  }

  for (const profile of PROFILES) {
    for (const route of manifest.routes[profile]) {
      if (route.path.startsWith('/')) {
        throw new Error(
          `Module "${manifest.key}": route path "${route.path}" must be relative to /${profile}`,
        );
      }
    }
    for (const item of manifest.nav[profile]) {
      if (!item.to.startsWith(`/${profile}/`)) {
        throw new Error(
          `Module "${manifest.key}": nav link "${item.to}" must start with /${profile}/`,
        );
      }
    }
  }

  return manifest;
}
