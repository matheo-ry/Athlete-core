import type { ModuleManifest } from '@/core/modules';

import { templateModule } from './_template';

// REGISTRO DE MÓDULOS: la lista de funciones de la app. `app/` solo conoce los
// módulos a través de esta lista. Para añadir uno: impórtalo y ponlo en
// `productModules` (ARQUITECTURA §15).

const productModules: readonly ModuleManifest[] = [];

// `_template` es un ejemplo para copiar, no una función del producto: solo se
// registra en desarrollo y no llega a la compilación de producción.
const developmentModules: readonly ModuleManifest[] = import.meta.env.DEV ? [templateModule] : [];

export const registeredModules: readonly ModuleManifest[] = [
  ...productModules,
  ...developmentModules,
];
