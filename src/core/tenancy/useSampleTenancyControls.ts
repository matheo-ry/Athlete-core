import type { SampleTenancyControls } from './tenancy-context';
import { useTenancyContext } from './useTenancy';

/**
 * Cambiar de tenant y de rol a mano. SOLO lo usa el selector de desarrollo
 * (Fase 0): con datos reales, el tenant y el rol no se eligen así.
 */
export function useSampleTenancyControls(): SampleTenancyControls {
  return useTenancyContext().sampleControls;
}
