import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { useLanguage } from '@/core/i18n';
import { DEFAULT_WEIGHT_UNIT, formatWeight, fromKg } from '@/core/lib';
import { useHealthConsentPrompt } from '@/core/tenancy';
import { Button, Card, Input, Spinner } from '@/core/ui';
import { shortDate } from '@/modules/programs';

import type { BodyWriteStatus, OwnHealthData } from '../api/useBodyData';
import { useDeleteBodyWeight, useSaveBodyWeight } from '../api/useBodyData';
import { todayIso } from '../model/body-entry';
import {
  MAX_BODY_WEIGHT_KG,
  MIN_BODY_WEIGHT_KG,
  parseWeightEntry,
  sortWeightsNewestFirst,
} from '../model/body-weight';
import { DateField, DeleteEntry, FormMessage, dateError, failureMessage } from './body-form';

/**
 * Peso corporal (D-127): el último, "Actualizar" (apuntar otro día) y el
 * historial. Se escribe en la unidad del cliente y se guarda en kg. Sin el
 * consentimiento dado, al guardar se pide (D-126).
 */
export function WeightPanel({ health }: { health: OwnHealthData }) {
  const { t } = useTranslation();
  const language = useLanguage();
  const unit = useProfile().data?.weightUnit ?? DEFAULT_WEIGHT_UNIT;
  const { ensure } = useHealthConsentPrompt();
  const save = useSaveBodyWeight();
  const remove = useDeleteBodyWeight();
  const today = todayIso(new Date());
  const [date, setDate] = useState(today);
  const [text, setText] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const { latest } = health;

  const fail = (status: Exclude<BodyWriteStatus, 'ok'>) => {
    setMessage({ text: failureMessage(t, status), isError: true });
  };

  const submit = async () => {
    const dayProblem = dateError(t, date, today);
    if (dayProblem !== null) {
      setMessage({ text: dayProblem, isError: true });
      return;
    }
    const entry = parseWeightEntry(text, unit);
    if (!entry.ok) {
      setMessage({
        text:
          entry.reason === 'invalid'
            ? t('workouts.body.weight.invalid')
            : t('workouts.body.weight.range', {
                min: Math.ceil(fromKg(MIN_BODY_WEIGHT_KG, unit)),
                max: Math.floor(fromKg(MAX_BODY_WEIGHT_KG, unit)),
                unit,
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
      .mutateAsync({ measuredOn: date, weightKg: entry.weightKg })
      .catch((): BodyWriteStatus => 'error');
    if (status === 'ok') {
      setText('');
      setMessage({ text: t('workouts.body.weight.saved'), isError: false });
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

  const history = sortWeightsNewestFirst(health.weights);

  return (
    <div className="flex flex-col gap-5">
      <Card tone="raised" className="flex flex-col gap-4">
        {health.isPending ? (
          <Spinner />
        ) : (
          <p className="text-lg font-semibold" data-testid="body-weight-last">
            {latest === null
              ? t('workouts.body.weight.none')
              : t('workouts.body.weight.last', {
                  weight: formatWeight(latest.weight_kg, unit, language),
                  date: shortDate(latest.measured_on, language),
                })}
          </p>
        )}
        <form
          className="flex flex-col gap-3"
          noValidate
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Input
            label={t('workouts.body.weight.field', { unit })}
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
            {save.isPending
              ? t('workouts.body.saving')
              : latest === null
                ? t('workouts.body.save')
                : t('workouts.body.weight.update')}
          </Button>
        </form>
      </Card>
      <section aria-labelledby="body-weight-history" className="flex flex-col gap-2">
        <h2 id="body-weight-history" className="eyebrow">
          {t('workouts.body.history')}
        </h2>
        {health.isPending ? (
          <Spinner />
        ) : history.length === 0 ? (
          <p className="text-muted text-sm">{t('workouts.body.weight.historyEmpty')}</p>
        ) : (
          <ul className="flex flex-col gap-1.5" data-testid="body-weight-history">
            {history.map((weight) => (
              <li
                key={weight.id}
                className="surface flex min-h-14 items-center justify-between gap-3 rounded-2xl px-4"
              >
                <span className="text-muted text-sm">
                  {shortDate(weight.measured_on, language)}
                </span>
                <span className="numeric text-lg font-medium">
                  {formatWeight(weight.weight_kg, unit, language)}
                </span>
                <DeleteEntry
                  label={t('workouts.body.deleteLabel', {
                    date: shortDate(weight.measured_on, language),
                  })}
                  disabled={remove.isPending}
                  onConfirm={() => {
                    removeEntry(weight.id);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
