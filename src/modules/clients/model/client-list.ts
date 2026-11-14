import type { TenantMember } from '@/core/tenancy';

// La lista de clientes del coach (DECISIONES D-059). Lógica pura.

export type ClientTab = 'active' | 'archived';

/** Un cliente es "Nuevo" durante sus primeros 7 días (D-059). */
export const NEW_CLIENT_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Sin mayúsculas ni tildes: "José" se encuentra escribiendo "jose". */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function isNewClient(joinedAt: string, now: number): boolean {
  const joined = Date.parse(joinedAt);
  return Number.isFinite(joined) && now - joined < NEW_CLIENT_DAYS * DAY_MS;
}

/**
 * Los clientes de una pestaña, que coinciden con la búsqueda, por orden
 * alfabético en el idioma de la app. Los coaches no salen: solo clientes.
 */
export function visibleClients(
  members: readonly TenantMember[],
  tab: ClientTab,
  query: string,
  locale: string,
): TenantMember[] {
  const search = fold(query);
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  return members
    .filter((member) => member.role === 'client' && member.status === tab)
    .filter((member) => search === '' || fold(member.displayName).includes(search))
    .sort((a, b) => collator.compare(a.displayName, b.displayName));
}
