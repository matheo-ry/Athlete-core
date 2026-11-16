import { createContext, useContext, useEffect, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';

import { logger } from '../lib';
import { ErrorState, Spinner } from '../ui';

import type { ClientProfileTab, ClientProfileTabProps } from './module-manifest';

// Las pestañas de la ficha de un cliente las aportan los módulos activos
// (ARQUITECTURA §5). La carcasa del coach las pone aquí; la ficha (módulo
// clients) las lee sin importar ningún otro módulo (ARQUITECTURA §6).

const ClientProfileTabsContext = createContext<readonly ClientProfileTab[]>([]);

export function ClientProfileTabsProvider({
  tabs,
  children,
}: {
  tabs: readonly ClientProfileTab[];
  children: ReactNode;
}) {
  return <ClientProfileTabsContext value={tabs}>{children}</ClientProfileTabsContext>;
}

/** Las pestañas de los módulos activos, en el orden en que se registraron. */
export function useClientProfileTabs(): readonly ClientProfileTab[] {
  return useContext(ClientProfileTabsContext);
}

/** El contenido de una pestaña: su código se carga la primera vez que se abre. */
export function ClientProfileTabContent({
  tab,
  ...props
}: ClientProfileTabProps & { tab: ClientProfileTab }) {
  const [loaded, setLoaded] = useState<{
    tab: ClientProfileTab;
    Component: ComponentType<ClientProfileTabProps>;
  } | null>(null);
  const [failed, setFailed] = useState<ClientProfileTab | null>(null);

  useEffect(() => {
    let isCurrent = true;
    tab
      .lazy()
      .then(({ Component }) => {
        if (isCurrent) {
          setLoaded({ tab, Component });
        }
      })
      .catch((error: unknown) => {
        logger.error('Could not load a client profile tab', {
          tab: tab.key,
          message: error instanceof Error ? error.message : 'unknown',
        });
        if (isCurrent) {
          setFailed(tab);
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [tab]);

  if (failed === tab) {
    return <ErrorState />;
  }
  if (loaded === null || loaded.tab !== tab) {
    return <Spinner />;
  }
  const { Component } = loaded;
  return <Component {...props} />;
}
