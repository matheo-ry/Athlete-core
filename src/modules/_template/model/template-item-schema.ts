import { z } from 'zod';

// Forma de un elemento tal como llega de `api/`. El tipo sale del esquema, así
// nunca se desincronizan (AGENTS.md §4).
export const templateItemSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  // Siempre en kg. Se convierte a lb solo al mostrarlo.
  weightKg: z.number().nonnegative(),
});

export const templateItemListSchema = z.array(templateItemSchema);

export type TemplateItem = z.infer<typeof templateItemSchema>;
