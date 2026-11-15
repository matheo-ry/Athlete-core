import { loadModuleTranslations } from '@/core/i18n';
import { registeredModules } from '@/modules';

/**
 * Carga los textos de todos los módulos, para los tests que pintan una pieza
 * suelta sin montar la app entera (`renderApp` ya lo hace por su cuenta).
 */
export function loadAllTranslations(): Promise<void> {
  return loadModuleTranslations(registeredModules);
}
