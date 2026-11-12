import { templateItemListSchema } from '../model/template-item-schema';
import type { TemplateItem } from '../model/template-item-schema';

// DATOS FALSOS. En un módulo real, este archivo es el único que habla con
// Supabase (`getSupabaseClient()` de '@/core/supabase') y aquí iría la consulta.
// No hace falta filtrar por tenant a mano: lo hace RLS en la base de datos.
const SAMPLE_ROWS: unknown = [
  {
    id: 'aaaaaaaa-0000-4000-8000-000000000001',
    name: 'Back squat',
    sets: 5,
    reps: 5,
    weightKg: 100,
  },
  {
    id: 'aaaaaaaa-0000-4000-8000-000000000002',
    name: 'Bench press',
    sets: 4,
    reps: 6,
    weightKg: 72.5,
  },
  {
    id: 'aaaaaaaa-0000-4000-8000-000000000003',
    name: 'Deadlift',
    sets: 3,
    reps: 3,
    weightKg: 140,
  },
];

const FAKE_NETWORK_DELAY_MS = 150;

export async function fetchTemplateItems(): Promise<TemplateItem[]> {
  await new Promise((resolve) => setTimeout(resolve, FAKE_NETWORK_DELAY_MS));
  // Lo que llega de fuera se valida siempre en la frontera (AGENTS.md §4).
  return templateItemListSchema.parse(SAMPLE_ROWS);
}
