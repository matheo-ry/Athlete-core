import type { TemplateItem } from './template-item-schema';

/** Volumen total en kg: series × repeticiones × peso, sumado para todos los elementos. */
export function calculateTotalVolumeKg(items: readonly TemplateItem[]): number {
  return items.reduce((total, item) => total + item.sets * item.reps * item.weightKg, 0);
}
