import { useTranslation } from 'react-i18next';

import { Button, Card, Icon } from '@/core/ui';

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
    <Card tone="raised" role="alert" className="flex flex-col gap-4 p-5">
      <p className="flex items-start gap-3 text-lg font-semibold">
        <Icon name="smartphone" className="text-primary-readable mt-1 size-5 shrink-0" />
        {t('workouts.device.elsewhere')}
      </p>
      {save.isError ? <p className="text-danger text-sm">{t('workouts.device.error')}</p> : null}
      <Button
        size="lg"
        className="w-full"
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
