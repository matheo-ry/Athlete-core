/**
 * Cálculo del 1RM estimado (D-129):
 * Fórmula de Epley: peso × (1 + repeticiones ÷ 30).
 *
 * El RIR se suma a las repeticiones (ej. 80 × 8 con RIR 2 se calcula como 80 × 10).
 * Con RPE, RIR = 10 − RPE.
 * Al fallo, RIR = 0.
 *
 * Regla: NO se calcula con más de 12 repeticiones (contando el RIR), porque
 * deja de ser fiable a altas repeticiones.
 */

export interface RmCalculationInput {
  weightKg: number | null | undefined;
  reps: number | null | undefined;
  rir?: number | null | undefined;
  rpe?: number | null | undefined;
  intensityType?: string | null | undefined;
  intensityValue?: number | null | undefined;
}

/**
 * Calcula el 1RM estimado en kg según la fórmula de Epley con el RIR sumado.
 * Devuelve null si no hay peso válido, si no hay repeticiones válidas, o si
 * las repeticiones efectivas (reps + RIR) superan 12.
 * Redondea a 1 decimal.
 */
export function calculateEstimatedRm(input: RmCalculationInput): number | null {
  const { weightKg, reps } = input;
  if (weightKg == null || weightKg <= 0) {
    return null;
  }
  if (reps == null || reps <= 0) {
    return null;
  }

  let rir = 0;
  if (input.rir != null) {
    rir = input.rir;
  } else if (input.rpe != null) {
    rir = Math.max(0, 10 - input.rpe);
  } else if (input.intensityType === 'rir') {
    rir = input.intensityValue ?? 0;
  } else if (input.intensityType === 'rpe') {
    rir = Math.max(0, 10 - (input.intensityValue ?? 10));
  } else if (input.intensityType === 'failure') {
    rir = 0;
  }

  // RIR no puede ser negativo
  if (rir < 0) {
    rir = 0;
  }

  const effectiveReps = reps + rir;

  // D-129: "No se calcula con más de 12 repeticiones (contando el RIR)"
  if (effectiveReps > 12) {
    return null;
  }

  const epley = weightKg * (1 + effectiveReps / 30);
  return Math.round(epley * 10) / 10;
}
