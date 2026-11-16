import type { FormEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Card } from '@/core/ui';

import type { ClientProgramAction } from '../api/client-program-api';
import { daysBetween } from '../model/calendar';

/** Un año hacia atrás o hacia delante, como la base de datos (D-105). */
const MAX_DAYS = 366;

export const isValidDate = (date: string, today: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) && Math.abs(daysBetween(today, date)) <= MAX_DAYS;

interface FormFrameProps {
  title: string;
  submitLabel: string;
  isPending: boolean;
  error: string | null;
  onSubmit: () => void;
  onCancel: () => void;
  children: ReactNode;
}

/** El marco común de los formularios de la ficha: título, campos, error y botones. */
export function FormFrame(props: FormFrameProps) {
  const { t } = useTranslation();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    props.onSubmit();
  };
  return (
    <Card>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <h3 className="font-semibold">{props.title}</h3>
        {props.children}
        {props.error === null ? null : (
          <p role="alert" className="text-danger text-sm font-medium">
            {props.error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={props.isPending}>
            {props.submitLabel}
          </Button>
          <Button variant="ghost" onClick={props.onCancel}>
            {t('programs.form.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** Lo que reciben los formularios de la pestaña "Rutina". */
export interface FormProps {
  today: string;
  isPending: boolean;
  failure: string | null;
  onRun: (action: ClientProgramAction) => void;
  onCancel: () => void;
}
