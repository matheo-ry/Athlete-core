export {
  ClientProfileTabContent,
  ClientProfileTabsProvider,
  useClientProfileTabs,
} from './client-profile-tabs';
export { defineModule } from './module-manifest';
export type {
  ClientProfileTab,
  ClientProfileTabProps,
  ModuleManifest,
  ModuleNavItem,
  ModuleRoute,
} from './module-manifest';
export { collectClientProfileTabs, collectNavItems, collectRoutes } from './module-registry';
