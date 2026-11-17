// Cálculos de la pestaña "Peso y medidas", sin React ni i18n.

export const WEIGHT_METRIC = 'weight';

interface DatedRecord {
  measured_on: string;
}

interface MeasurementLike extends DatedRecord {
  kind: string;
  side: string | null;
}

/** Clave de cada medida: el tipo y, si lo tiene, el lado ("arm-right"). */
export function measurementKey(m: Pick<MeasurementLike, 'kind' | 'side'>): string {
  return m.side ? `${m.kind}-${m.side}` : m.kind;
}

/** Agrupa las medidas por tipo y lado, en el orden en que aparecen. */
export function groupMeasurements<T extends MeasurementLike>(
  measurements: readonly T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const m of measurements) {
    const key = measurementKey(m);
    const list = groups.get(key);
    if (list) {
      list.push(m);
    } else {
      groups.set(key, [m]);
    }
  }
  return groups;
}

/**
 * Métrica que se enseña: la elegida si sigue existiendo; si no, el peso si hay
 * pesos; si no, la primera medida. Así un cliente con medidas y sin peso no ve
 * una gráfica vacía sin ninguna métrica marcada.
 */
export function resolveHealthMetric(
  chosen: string | null,
  hasWeights: boolean,
  measurementKeys: readonly string[],
): string | null {
  if (chosen === WEIGHT_METRIC && hasWeights) return chosen;
  if (chosen !== null && measurementKeys.includes(chosen)) return chosen;
  if (hasWeights) return WEIGHT_METRIC;
  return measurementKeys[0] ?? null;
}

export interface HealthSummary {
  last: string;
  /** Cambio del primero al último del periodo, con signo ("+1,5 kg"); null con un solo registro. */
  change: string | null;
}

export function summarizeHealthRecords<T extends DatedRecord>(
  records: readonly T[],
  valueOf: (record: T) => number,
  format: (value: number) => string,
): HealthSummary | null {
  if (records.length === 0) return null;
  const sorted = [...records].sort((a, b) => a.measured_on.localeCompare(b.measured_on));
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const lastText = format(valueOf(last));
  if (sorted.length < 2) return { last: lastText, change: null };

  const raw = valueOf(last) - valueOf(first);
  // Menos de una décima se muestra como 0, no como "-0".
  const diff = Math.abs(raw) < 0.05 ? 0 : raw;
  const text = format(diff);
  return { last: lastText, change: diff > 0 ? `+${text}` : text };
}
