import { z } from 'zod';

import type { Language } from '@/core/i18n';

import { WEEKLY_CYCLE_DAYS } from './program-document';

// La lista de plantillas del coach (PR 2.7, D-085): lo que dice cada fila, el
// buscador y "Activas" o "Archivadas". Se hace en la app, sobre la lista ya
// cargada (como los ejercicios, D-073). Lógica pura.

const templateRowSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    updated_at: z.string(),
    archived_at: z.string().nullable(),
    program_blocks: z.array(
      z.object({
        position: z.number(),
        cycle_days: z.number(),
        program_days: z.array(z.object({ kind: z.enum(['training', 'rest']) })),
      }),
    ),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    blocks: [...row.program_blocks]
      .sort((a, b) => a.position - b.position)
      .map((block) => ({
        cycleDays: block.cycle_days,
        trainingDays: block.program_days.filter((day) => day.kind === 'training').length,
      })),
  }));

export type TemplateSummary = z.output<typeof templateRowSchema>;

/** Valida en la frontera lo que devuelve la base de datos (AGENTS.md §4). */
export function parseTemplates(rows: unknown): TemplateSummary[] {
  return z.array(templateRowSchema).parse(rows);
}

export type TemplateTab = 'active' | 'archived';

/**
 * Cómo es el ciclo, para la fila. Con varios bloques, solo cuántos son: cada
 * bloque puede tener su ciclo.
 */
export type CycleDescription =
  | { kind: 'weekly'; trainingDays: number }
  | { kind: 'cycle'; cycleDays: number; trainingDays: number }
  | { kind: 'blocks'; blocks: number };

export function describeCycle(template: TemplateSummary): CycleDescription {
  const [first] = template.blocks;
  if (template.blocks.length !== 1 || first === undefined) {
    return { kind: 'blocks', blocks: template.blocks.length };
  }
  return first.cycleDays === WEEKLY_CYCLE_DAYS
    ? { kind: 'weekly', trainingDays: first.trainingDays }
    : { kind: 'cycle', cycleDays: first.cycleDays, trainingDays: first.trainingDays };
}

function tabOf(template: TemplateSummary): TemplateTab {
  return template.archivedAt === null ? 'active' : 'archived';
}

/** Cuántas hay en cada pestaña, sin contar la búsqueda. */
export function countByTab(templates: readonly TemplateSummary[]): Record<TemplateTab, number> {
  const archived = templates.filter((template) => tabOf(template) === 'archived').length;
  return { active: templates.length - archived, archived };
}

/** Sin mayúsculas ni tildes: "Básica" se encuentra escribiendo "basica". */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/** Las de una pestaña que contienen lo buscado, por orden alfabético. */
export function visibleTemplates(
  templates: readonly TemplateSummary[],
  tab: TemplateTab,
  query: string,
  language: Language,
): TemplateSummary[] {
  const search = fold(query);
  const collator = new Intl.Collator(language, { sensitivity: 'base' });
  return templates
    .filter((template) => tabOf(template) === tab)
    .filter((template) => search === '' || fold(template.name).includes(search))
    .sort((a, b) => collator.compare(a.name, b.name));
}
