import { useTranslation } from 'react-i18next';

import { Button, Card } from '@/core/ui';

import { useSaveActiveWorkout } from '../api/useActiveWorkout';
import { useExerciseInfo } from '../api/useStartWorkout';
import type { ActiveWorkout } from '../model/active-workout';
import { takeOver } from '../model/workout-handover';
import type { RemoteWorkout } from '../model/workout-handover';

/**
 * "Este entreno está abierto en otro dispositivo" con "Seguir aquí" (D-124):
 * lo trae a este móvil, con lo apuntado en los dos.
 */
export function OtherDeviceNotice({
  remote,
  local,
}: {
  remote: RemoteWorkout;
  local: ActiveWorkout | null;
}) {
  const { t } = useTranslation();
  const save = useSaveActiveWorkout();
  const { exerciseInfo, isPending } = useExerciseInfo();

  return (
    <Card role="alert" className="flex flex-col gap-3">
      <p className="font-semibold">{t('workouts.device.elsewhere')}</p>
      {save.isError ? <p className="text-sm">{t('workouts.device.error')}</p> : null}
      <Button
        className="self-start"
        disabled={isPending || save.isPending}
        onClick={() => {
          save.mutate(
            takeOver({
              remote,
              local,
              exerciseInfo,
              now: new Date().toISOString(),
              newId: () => crypto.randomUUID(),
            }),
          );
        }}
      >
        {t('workouts.device.continueHere')}
      </Button>
    </Card>
  );
}
