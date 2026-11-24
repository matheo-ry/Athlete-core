import { useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { Input } from '@/core/ui';

import type { BodyWriteStatus } from '../api/useBodyData';
import { parseEntryDate } from '../model/body-entry';

/** Lo que se dice cuando apuntar (o borrar) no sale. */
export function failureMessage(t: TFunction, status: Exclude<BodyWriteStatus, 'ok'>): string {
  if (status === 'offline') {
    return t('core.errors.offline');
  }
  return status === 'no_consent'
    ? t('workouts.body.errors.noConsent')
    : t('core.errors.unexpected');
}

/** El aviso bajo un formulario: en rojo si algo falló, y leído al aparecer. */
export function FormMessage({ message, isError }: { message: string | null; isError: boolean }) {
  if (message === null) {
    return null;
  }
  return (
    <p
      role={isError ? 'alert' : 'status'}
      className={isError ? 'text-danger text-sm' : 'text-primary-readable text-sm font-medium'}
    >
      {message}
    </p>
  );
}

/** El día al que corresponde lo apuntado: hoy de partida, y nunca uno futuro. */
export function DateField({
  value,
  today,
  onChange,
}: {
  value: string;
  today: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Input
      type="date"
      label={t('workouts.body.date')}
      value={value}
      max={today}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    />
  );
}

/** El mensaje de una fecha que no vale, o `null` si vale. */
export function dateError(t: TFunction, value: string, today: string): string | null {
  const result = parseEntryDate(value, today);
  if (result.ok) {
    return null;
  }
  return result.reason === 'future'
    ? t('workouts.body.errors.dateFuture')
    : t('workouts.body.errors.dateInvalid');
}

/** "Borrar" con una pregunta antes: un toque de más no pierde un dato. */
export function DeleteEntry({
  label,
  disabled,
  onConfirm,
}: {
  label: string;
  disabled: boolean;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const [isAsking, setIsAsking] = useState(false);

  if (!isAsking) {
    return (
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        className="focus-ring text-muted hover:text-danger min-h-11 rounded-lg px-3 text-sm font-semibold"
        onClick={() => {
          setIsAsking(true);
        }}
      >
        {t('workouts.body.delete')}
      </button>
    );
  }
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      <span className="text-muted text-sm">{t('workouts.body.deleteAsk')}</span>
      <button
        type="button"
        disabled={disabled}
        className="focus-ring text-danger min-h-11 rounded-lg px-3 text-sm font-semibold"
        onClick={() => {
          setIsAsking(false);
          onConfirm();
        }}
      >
        {t('workouts.body.deleteYes')}
      </button>
      <button
        type="button"
        className="focus-ring text-muted min-h-11 rounded-lg px-3 text-sm font-semibold"
        onClick={() => {
          setIsAsking(false);
        }}
      >
        {t('workouts.body.deleteNo')}
      </button>
    </div>
  );
}
