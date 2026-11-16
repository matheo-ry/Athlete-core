import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { WeightUnit } from '@/core/lib';
import { Button } from '@/core/ui';

import {
  MAX_SETS,
  areSetsUniform,
  intensityKey,
  intensityValues,
  makeSetsUniform,
  parseIntensityKey,
  setSetCount,
  updateSets,
} from '../model/prescription';
import type { IntensityScale, TargetKind } from '../model/prescription';
import type { ProgramDayExercise, ProgramSet } from '../model/program-document';
import { LoadInput } from './LoadInput';
import { RestControl } from './RestControl';
import { SelectField } from './SelectField';
import { TargetInput } from './TargetInput';

const SET_COUNTS = Array.from({ length: MAX_SETS }, (_, index) => String(index + 1));

interface PrescriptionEditorProps {
  item: ProgramDayExercise;
  /** El nombre del ejercicio, para los lectores de pantalla. */
  name: string;
  kind: TargetKind;
  /** La escala con la que trabaja el coach (D-076). */
  scale: IntensityScale;
  /** La unidad en la que el usuario escribe la carga; se guarda en kg. */
  unit: WeightUnit;
  /** Peso corporal: la carga es el lastre (D-072). */
  isBodyweight: boolean;
  onChange: (item: ProgramDayExercise) => void;
}

/**
 * Lo que hay que hacer en un ejercicio (PR 2.10, D-076): número de series y,
 * en una sola línea para todas, repeticiones e intensidad; con "Series
 * distintas", cada serie por separado. El descanso es del ejercicio.
 */
export function PrescriptionEditor({
  item,
  name,
  kind,
  scale,
  unit,
  isBodyweight,
  onChange,
}: PrescriptionEditorProps) {
  const { t } = useTranslation();
  // Si ya vienen distintas, se abre desplegado.
  const [isSplit, setIsSplit] = useState(() => !areSetsUniform(item.sets));
  const [first] = item.sets;
  if (first === undefined) {
    return null;
  }

  const intensityOptions = (set: ProgramSet) => {
    const current = intensityKey(set);
    const offered = [
      '',
      ...intensityValues(scale).map((value) => `${scale}:${String(value)}`),
      'failure',
    ];
    // Lo escrito con la otra escala no se convierte (D-076): se sigue viendo.
    return (offered.includes(current) ? offered : [current, ...offered]).map((key) => ({
      value: key,
      label:
        key === ''
          ? t('programs.prescription.none')
          : key === 'failure'
            ? t('programs.prescription.failure')
            : key.replace(':', ' ').replace(/^r[a-z]+/, (type) => type.toUpperCase()),
    }));
  };

  const setFields = (set: ProgramSet, index: number | 'all') => (
    <>
      <TargetInput
        label={t(`programs.prescription.target.${kind}`)}
        set={set}
        kind={kind}
        onChange={(patch) => onChange(updateSets(item, patch, index))}
      />
      <SelectField
        label={t('programs.prescription.intensity')}
        value={intensityKey(set)}
        options={intensityOptions(set)}
        onChange={(key) => onChange(updateSets(item, parseIntensityKey(key), index))}
      />
      <LoadInput
        label={t(isBodyweight ? 'programs.prescription.extraLoad' : 'programs.prescription.load', {
          unit,
        })}
        kg={set.targetLoadKg}
        unit={unit}
        onChange={(patch) => onChange(updateSets(item, patch, index))}
      />
    </>
  );

  return (
    <div
      role="group"
      aria-label={t('programs.prescription.label', { name })}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-start gap-2">
        <SelectField
          label={t('programs.prescription.sets')}
          value={String(item.sets.length)}
          options={SET_COUNTS.map((count) => ({ value: count, label: count }))}
          onChange={(count) => onChange(setSetCount(item, Number(count)))}
        />
        {isSplit ? null : setFields(first, 'all')}
      </div>

      {isSplit ? (
        <div className="flex flex-col gap-2">
          {item.sets.map((set, index) => (
            <div
              // Una serie sin guardar todavía no tiene id.
              key={set.id ?? `new-${String(index)}`}
              role="group"
              aria-label={t('programs.prescription.set', { number: index + 1 })}
              className="flex flex-wrap items-start gap-2"
            >
              <span className="text-muted min-w-16 pt-9 text-sm">
                {t('programs.prescription.set', { number: index + 1 })}
              </span>
              {setFields(set, index)}
            </div>
          ))}
        </div>
      ) : null}

      <RestControl
        name={name}
        seconds={item.restSeconds}
        onChange={(restSeconds) => onChange({ ...item, restSeconds })}
      />

      <Button
        variant="ghost"
        className="self-start"
        onClick={() => {
          if (isSplit) {
            onChange(makeSetsUniform(item));
          }
          setIsSplit(!isSplit);
        }}
      >
        {t(isSplit ? 'programs.prescription.makeUniform' : 'programs.prescription.split')}
      </Button>
    </div>
  );
}
