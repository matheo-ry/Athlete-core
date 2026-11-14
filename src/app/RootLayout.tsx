import { Outlet } from 'react-router';

import { OfflineBanner } from '@/core/ui';

/** Marco común a todas las rutas. */
export function RootLayout() {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <OfflineBanner />
      <Outlet />
    </div>
  );
}
