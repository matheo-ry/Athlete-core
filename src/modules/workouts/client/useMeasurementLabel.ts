import { useTranslation } from 'react-i18next';

import type { MeasurementTarget } from '../model/body-measurements';

/** "Cintura" o "Brazo (derecho)": el nombre de una medida, igual que lo ve el coach. */
export function useMeasurementLabel(): (target: MeasurementTarget) => string {
  const { t } = useTranslation();
  return (target) => {
    const kind = t(`workouts.measurements.${target.kind}`);
    return target.side === null ? kind : `${kind} (${t(`workouts.measurements.${target.side}`)})`;
  };
}
