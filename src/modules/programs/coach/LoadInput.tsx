import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { WeightUnit } from '@/core/lib';
import { Input } from '@/core/ui';

import { loadText, parseLoad } from '../model/prescription';

interface LoadInputProps {
  label: string;
  /** La carga guardada, en kg. */
  kg: number | null;
  unit: WeightUnit;
  onChange: (patch: { targetLoadKg: number | null }) => void;
}

/**
 * La carga objetivo, escrita en la unidad del usuario y guardada en kg (PR
 * 2.10b, D-076). Mientras lo escrito no vale, se queda en el campo sin cambiar
 * la rutina, con su aviso.
 */
export function LoadInput({ label, kg, unit, onChange }: LoadInputProps) {
  const { t } = useTranslation();
  const saved = loadText(kg, unit);
  const [text, setText] = useState(saved);
  const [seen, setSeen] = useState(saved);

  // Si la carga cambia por otro lado (otra unidad, "todas iguales"), el campo
  // enseña lo nuevo, salvo que sea justo lo que se está escribiendo.
  if (saved !== seen) {
    setSeen(saved);
    const typed = parseLoad(text, unit);
    if (typed === null || loadText(typed.targetLoadKg, unit) !== saved) {
      setText(saved);
    }
  }

  return (
    <Input
      label={label}
      inputMode="decimal"
      autoComplete="off"
      className="w-24"
      value={text}
      error={parseLoad(text, unit) === null ? t('programs.prescription.errors.load') : undefined}
      onChange={(event) => {
        setText(event.target.value);
        const patch = parseLoad(event.target.value, unit);
        if (patch !== null) {
          onChange(patch);
        }
      }}
    />
  );
}
