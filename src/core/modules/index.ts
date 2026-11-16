export {
  ClientProfileTabContent,
  ClientProfileTabsProvider,
  useClientProfileTabs,
} from './client-profile-tabs';
export { HomeCardContent } from './HomeCardContent';
export { defineModule } from './module-manifest';
export type {
  ClientProfileTab,
  ClientProfileTabProps,
  HomeCard,
  ModuleManifest,
  ModuleNavItem,
  ModuleRoute,
} from './module-manifest';
export {
  collectClientProfileTabs,
  collectHomeCards,
  collectNavItems,
  collectRoutes,
} from './module-registry';
