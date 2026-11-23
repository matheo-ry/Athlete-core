import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/core/lib';
import { buttonClassName, Icon, Input } from '@/core/ui';

import type { ExerciseFilters, ExerciseOrigin } from '../model/exercise-list';
import { EQUIPMENT, MUSCLE_GROUPS } from '../model/exercise-schema';
import { FilterSelect } from './FilterSelect';

const ORIGINS: readonly ExerciseOrigin[] = ['all', 'own', 'platform'];

interface ExerciseFilterBarProps {
  filters: ExerciseFilters;
  onChange: (filters: ExerciseFilters) => void;
}

/** El buscador y los tres filtros de D-073. Se combinan todos entre sí. */
export function ExerciseFilterBar({ filters, onChange }: ExerciseFilterBarProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const active = [filters.muscleGroup, filters.equipment, filters.origin].filter(
    (value) => value !== 'all',
  ).length;

  return (
    <div className="flex flex-col gap-3">
      <Input
        label={t('exercises.list.search')}
        type="search"
        name="search"
        value={filters.query}
        onChange={(event) => onChange({ ...filters, query: event.target.value })}
      />
      {/* En el móvil los filtros van plegados: el buscador basta casi siempre. */}
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={buttonClassName('secondary', 'self-start sm:hidden')}
      >
        <Icon name="sliders" className="size-4" />
        {active > 0
          ? t('exercises.list.filtersActive', { count: active })
          : t('exercises.list.filters')}
      </button>
      {/* Dos columnas y el origen debajo a todo lo ancho; tres en pantallas anchas. */}
      <div className={cn(isOpen ? 'grid' : 'hidden', 'grid-cols-2 gap-3 sm:grid sm:grid-cols-3')}>
        <FilterSelect
          label={t('exercises.list.muscleGroup')}
          value={filters.muscleGroup}
          options={[
            { value: 'all', label: t('exercises.list.allMuscleGroups') },
            ...MUSCLE_GROUPS.map((group) => ({
              value: group,
              label: t(`exercises.muscleGroups.${group}`),
            })),
          ]}
          onChange={(muscleGroup) => onChange({ ...filters, muscleGroup })}
        />
        <FilterSelect
          label={t('exercises.list.equipment')}
          value={filters.equipment}
          options={[
            { value: 'all', label: t('exercises.list.allEquipment') },
            ...EQUIPMENT.map((item) => ({ value: item, label: t(`exercises.equipment.${item}`) })),
          ]}
          onChange={(equipment) => onChange({ ...filters, equipment })}
        />
        <FilterSelect
          className="col-span-2 sm:col-span-1"
          label={t('exercises.list.origin')}
          value={filters.origin}
          options={ORIGINS.map((origin) => ({
            value: origin,
            label: t(`exercises.list.origins.${origin}`),
          }))}
          onChange={(origin) => onChange({ ...filters, origin })}
        />
      </div>
    </div>
  );
}
