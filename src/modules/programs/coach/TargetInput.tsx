import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/core/ui';

import { parseTarget, targetText } from '../model/prescription';
import type { TargetKind, TargetPatch } from '../model/prescription';
import type { ProgramSet } from '../model/program-document';

interface TargetInputProps {
  label: string;
  set: ProgramSet;
  kind: TargetKind;
  onChange: (patch: TargetPatch) => void;
}

/**
 * Repeticiones ("8" o "8-12"), segundos o metros, según la forma de medir
 * (D-072). Mientras lo escrito no vale ("8-"), se queda en el campo sin
 * cambiar la rutina, con su aviso.
 */
export function TargetInput({ label, set, kind, onChange }: TargetInputProps) {
  const { t } = useTranslation();
  const saved = targetText(set, kind);
  const [text, setText] = useState(saved);
  const [seen, setSeen] = useState(saved);

  // Si la serie cambia por otro lado (más series, "todas iguales"), el campo
  // enseña lo nuevo, salvo que sea justo lo que se está escribiendo.
  if (saved !== seen) {
    setSeen(saved);
    const typed = parseTarget(text, kind);
    if (typed === null || targetText({ ...set, ...typed }, kind) !== saved) {
      setText(saved);
    }
  }
  const isInvalid = parseTarget(text, kind) === null;

  return (
    <Input
      label={label}
      inputMode="numeric"
      autoComplete="off"
      className="w-24"
      value={text}
      error={isInvalid ? t(`programs.prescription.errors.${kind}`) : undefined}
      onChange={(event) => {
        setText(event.target.value);
        const patch = parseTarget(event.target.value, kind);
        if (patch !== null) {
          onChange(patch);
        }
      }}
    />
  );
}
