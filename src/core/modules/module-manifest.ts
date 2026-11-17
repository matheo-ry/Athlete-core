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

/** Lo que la ficha de un cliente le pasa a cada pestaña. */
export interface ClientProfileTabProps {
  clientId: string;
  clientName: string;
  /** `false` si está dado de baja: se ven sus datos, sin acciones (D-083). */
  isActive: boolean;
}

/** Pestaña que un módulo añade a la ficha de un cliente (vista del coach). */
export interface ClientProfileTab {
  key: string;
  labelKey: string;
  lazy: () => Promise<{ Component: ComponentType<ClientProfileTabProps> }>;
}

/** Tarjeta que un módulo añade al inicio de un perfil (PR 2.18, D-114). */
export interface HomeCard {
  key: string;
  /** Posición en el inicio: de menor a mayor. */
  order: number;
  lazy: () => Promise<{ Component: ComponentType }>;
}

/**
 * Lo que un módulo hace sin pantalla mientras hay sesión, en cualquier pantalla y
 * cualquier espacio (PR 3.4, D-143): por ejemplo, subir lo pendiente. Es un
 * componente que `app/` monta una vez; puede enseñar un aviso.
 */
export interface ModuleService {
  key: string;
  /** Si devuelve `false`, ni se carga su código (por ejemplo, en la web publicada). */
  enabled?: () => boolean;
  lazy: () => Promise<{ Component: ComponentType }>;
}

export interface ModuleManifest {
  /** Nombre único en snake_case. Coincide con su feature flag y con el prefijo de sus textos. */
  key: string;
  routes: Record<Profile, readonly ModuleRoute[]>;
  nav: Record<Profile, readonly ModuleNavItem[]>;
  i18n: ModuleTranslations;
  clientProfileTabs: readonly ClientProfileTab[];
  /** Lo que el módulo enseña en el inicio del coach y en el del cliente. */
  homeCards: Record<Profile, readonly HomeCard[]>;
  /** Opcional: la mayoría de módulos no tiene. */
  services?: readonly ModuleService[];
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
