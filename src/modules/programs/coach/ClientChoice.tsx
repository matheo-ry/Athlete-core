import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { TenantMember } from '@/core/tenancy';
import { Checkbox, Input } from '@/core/ui';

import type { ClientRoutines } from '../model/assignments';

interface ClientChoiceProps {
  /** Los clientes activos, ya ordenados por nombre. */
  clients: TenantMember[];
  routines: ReadonlyMap<string, ClientRoutines>;
  selected: string[];
  onChange: (selected: string[]) => void;
}

/**
 * Uno o varios clientes activos (D-081), con la rutina que tiene ahora cada
 * uno. El buscador filtra la lista, pero lo ya elegido se conserva.
 */
export function ClientChoice({ clients, routines, selected, onChange }: ClientChoiceProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const query = search.trim().toLocaleLowerCase();
  const visible = clients.filter((client) =>
    client.displayName.toLocaleLowerCase().includes(query),
  );

  const toggle = (userId: string, checked: boolean) =>
    onChange(checked ? [...selected, userId] : selected.filter((id) => id !== userId));

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-foreground mb-1.5 text-sm font-medium">
        {t('programs.assign.clients')}
      </legend>
      <Input
        type="search"
        label={t('programs.assign.searchClients')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {visible.length === 0 ? (
        <p className="text-muted text-sm">{t('programs.assign.noMatches')}</p>
      ) : (
        <ul className="flex flex-col">
          {visible.map((client) => {
            const current = routines.get(client.userId)?.current ?? null;
            return (
              <li key={client.userId}>
                <Checkbox
                  label={
                    <>
                      <span className="font-medium">{client.displayName}</span>{' '}
                      <span className="text-muted">
                        ·{' '}
                        {current === null
                          ? t('programs.assign.noProgram')
                          : t('programs.assign.hasProgram', { name: current.name })}
                      </span>
                    </>
                  }
                  checked={selected.includes(client.userId)}
                  onChange={(event) => toggle(client.userId, event.target.checked)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
