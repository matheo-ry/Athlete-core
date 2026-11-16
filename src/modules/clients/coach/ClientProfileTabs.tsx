import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/core/lib';
import { ClientProfileTabContent } from '@/core/modules';
import type { ClientProfileTab } from '@/core/modules';
import type { TenantMember } from '@/core/tenancy';

interface ClientProfileTabsProps {
  tabs: readonly ClientProfileTab[];
  client: TenantMember;
}

/**
 * Las pestañas de la ficha (PR 2.14): los botones, si hay más de una, y el
 * contenido de la elegida. Cada pestaña la aporta un módulo por su manifest.
 */
export function ClientProfileTabs({ tabs, client }: ClientProfileTabsProps) {
  const { t } = useTranslation();
  const [selectedKey, setSelectedKey] = useState(tabs[0]?.key ?? '');
  const selected = tabs.find((tab) => tab.key === selectedKey) ?? tabs[0];

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={t('clients.detail.tabsLabel')} className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-pressed={tab === selected}
            onClick={() => setSelectedKey(tab.key)}
            className={cn(
              'flex min-h-11 items-center rounded-lg px-4 text-sm font-medium',
              'focus-visible:outline-primary-readable focus-visible:outline-2',
              tab === selected ? 'bg-primary text-on-primary' : 'bg-surface text-muted',
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
      {selected === undefined ? null : (
        <ClientProfileTabContent
          tab={selected}
          clientId={client.userId}
          clientName={client.displayName}
          isActive={client.status === 'active'}
        />
      )}
    </div>
  );
}
