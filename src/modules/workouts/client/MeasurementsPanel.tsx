import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { useLanguage } from '@/core/i18n';
import { DEFAULT_WEIGHT_UNIT, formatLength, fromCm, lengthUnitFor } from '@/core/lib';
import { useHealthConsentPrompt } from '@/core/tenancy';
import { Button, Card, FIELD_LABEL_CLASS, Input, Spinner, fieldClassName } from '@/core/ui';
import { shortDate } from '@/modules/programs';

import type { BodyWriteStatus, OwnHealthData } from '../api/useBodyData';
import { useDeleteBodyMeasurement, useSaveBodyMeasurement } from '../api/useBodyData';
import { todayIso } from '../model/body-entry';
import {
  MAX_MEASUREMENT_CM,
  groupMeasurementHistory,
  measurementTargets,
  parseMeasurementEntry,
  parseTargetKey,
  targetKey,
} from '../model/body-measurements';
import type { MeasurementTarget } from '../model/body-measurements';
import { DateField, DeleteEntry, FormMessage, dateError, failureMessage } from './body-form';
import { useMeasurementLabel } from './useMeasurementLabel';

/**
 * Medidas (D-127): las de la lista, las que quiera y cuando quiera, con fecha y
 * su historial. En cm, o en pulgadas si usa libras. Sin consentimiento dado,
 * al guardar se pide (D-126).
 */
export function MeasurementsPanel({ health }: { health: OwnHealthData }) {
  const { t } = useTranslation();
  const language = useLanguage();
  const unit = useProfile().data?.weightUnit ?? DEFAULT_WEIGHT_UNIT;
  const lengthUnit = lengthUnitFor(unit);
  const labelOf = useMeasurementLabel();
  const selectId = useId();
  const { ensure } = useHealthConsentPrompt();
  const save = useSaveBodyMeasurement();
  const remove = useDeleteBodyMeasurement();
  const today = todayIso(new Date());
  const [key, setKey] = useState(targetKey(measurementTargets()[0] as MeasurementTarget));
  const [date, setDate] = useState(today);
  const [text, setText] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const fail = (status: Exclude<BodyWriteStatus, 'ok'>) => {
    setMessage({ text: failureMessage(t, status), isError: true });
  };

  const submit = async () => {
    const target = parseTargetKey(key);
    const dayProblem = dateError(t, date, today);
    if (target === null || dayProblem !== null) {
      setMessage({ text: dayProblem ?? t('core.errors.unexpected'), isError: true });
      return;
    }
    const entry = parseMeasurementEntry(text, unit);
    if (!entry.ok) {
      setMessage({
        text:
          entry.reason === 'invalid'
            ? t('workouts.body.measure.invalid')
            : t('workouts.body.measure.range', {
                max: Math.floor(fromCm(MAX_MEASUREMENT_CM, unit)),
                unit: lengthUnit,
              }),
        isError: true,
      });
      return;
    }
    if (!(await ensure())) {
      fail('no_consent');
      return;
    }
    const status = await save
      .mutateAsync({
        measuredOn: date,
        kind: target.kind,
        side: target.side,
        valueCm: entry.valueCm,
      })
      .catch((): BodyWriteStatus => 'error');
    if (status === 'ok') {
      setText('');
      setMessage({ text: t('workouts.body.measure.saved'), isError: false });
    } else {
      fail(status);
    }
  };

  const removeEntry = (id: string) => {
    void remove
      .mutateAsync(id)
      .catch((): BodyWriteStatus => 'error')
      .then((status) => {
        if (status === 'ok') {
          setMessage({ text: t('workouts.body.deleted'), isError: false });
        } else {
          fail(status);
        }
      });
  };

  const groups = groupMeasurementHistory(health.measurements);

  return (
    <div className="flex flex-col gap-5">
      <Card tone="raised">
        <form
          className="flex flex-col gap-3"
          noValidate
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor={selectId} className={FIELD_LABEL_CLASS}>
              {t('workouts.body.measure.which')}
            </label>
            <select
              id={selectId}
              className={fieldClassName(false)}
              value={key}
              onChange={(event) => {
                setKey(event.target.value);
                setMessage(null);
              }}
            >
              {measurementTargets().map((target) => (
                <option key={targetKey(target)} value={targetKey(target)}>
                  {labelOf(target)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t('workouts.body.measure.field', { unit: lengthUnit })}
            inputMode="decimal"
            autoComplete="off"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setMessage(null);
            }}
          />
          <DateField
            value={date}
            today={today}
            onChange={(value) => {
              setDate(value);
              setMessage(null);
            }}
          />
          <FormMessage message={message?.text ?? null} isError={message?.isError ?? false} />
          <Button type="submit" size="lg" disabled={save.isPending || health.isPending}>
            {save.isPending ? t('workouts.body.saving') : t('workouts.body.save')}
          </Button>
        </form>
      </Card>
      <section aria-labelledby="body-measure-history" className="flex flex-col gap-3">
        <h2 id="body-measure-history" className="eyebrow">
          {t('workouts.body.history')}
        </h2>
        {health.isPending ? (
          <Spinner />
        ) : groups.length === 0 ? (
          <p className="text-muted text-sm">{t('workouts.body.measure.none')}</p>
        ) : (
          groups.map((group) => (
            <section
              key={group.key}
              aria-label={labelOf(group.target)}
              data-testid={`measure-${group.key}`}
              className="flex flex-col gap-1.5"
            >
              <h3 className="text-sm font-semibold">{labelOf(group.target)}</h3>
              <ul className="flex flex-col gap-1.5">
                {group.records.map((record) => (
                  <li
                    key={record.id}
                    className="surface flex min-h-14 items-center justify-between gap-3 rounded-2xl px-4"
                  >
                    <span className="text-muted text-sm">
                      {shortDate(record.measured_on, language)}
                    </span>
                    <span className="numeric text-lg font-medium">
                      {formatLength(record.value_cm, unit, language)}
                    </span>
                    <DeleteEntry
                      label={`${t('workouts.body.deleteLabel', {
                        date: shortDate(record.measured_on, language),
                      })} · ${labelOf(group.target)}`}
                      disabled={remove.isPending}
                      onConfirm={() => {
                        removeEntry(record.id);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </section>
    </div>
  );
}
