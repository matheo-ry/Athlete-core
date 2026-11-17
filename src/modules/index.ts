import type { ModuleManifest } from '@/core/modules';

import { clientsModule } from './clients';
import { exercisesModule } from './exercises';
import { programsModule } from './programs';
import { workoutsModule } from './workouts';

// REGISTRO DE MÓDULOS: la lista de funciones de la app. `app/` solo conoce los
// módulos a través de esta lista. Para añadir uno: impórtalo arriba y ponlo en
// `productModules` (ARQUITECTURA §15).

const productModules: readonly ModuleManifest[] = [
  clientsModule,
  exercisesModule,
  programsModule,
  workoutsModule,
];

// `_template` es un ejemplo para copiar, no una función del producto. Se importa
// de forma condicional para que en la compilación de producción
// (`import.meta.env.DEV` es `false`) ni siquiera se empaquete.
const developmentModules: readonly ModuleManifest[] = import.meta.env.DEV
  ? [(await import('./_template')).templateModule]
  : [];

export const registeredModules: readonly ModuleManifest[] = [
  ...productModules,
  ...developmentModules,
];

/**
 * Claves de los módulos de ejemplo. Se montan siempre en desarrollo, sin flag en
 * la base de datos: el catálogo de flags solo tiene funciones del producto.
 */
export const developmentModuleKeys: ReadonlySet<string> = new Set(
  developmentModules.map((module) => module.key),
);
