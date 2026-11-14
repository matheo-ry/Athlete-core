import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { isInviteCodeFormat, normalizeInviteCode } from '@/core/tenancy';
import { Button, Input } from '@/core/ui';

interface InviteCodeFormProps {
  initialCode?: string;
  /** Recibe el código ya limpio (mayúsculas, sin espacios ni guiones). */
  onSubmit: (code: string) => void;
}

/** El campo "Código de tu coach" con "Continuar" (D-037 y D-050). */
export function InviteCodeForm({ initialCode = '', onSubmit }: InviteCodeFormProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isInviteCodeFormat(code)) {
      setError(t('app.inviteForm.invalidFormat'));
      return;
    }
    setError(undefined);
    onSubmit(normalizeInviteCode(code));
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label={t('app.inviteForm.label')}
        hint={t('app.inviteForm.hint')}
        name="code"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        className="text-lg tracking-widest uppercase"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        error={error}
      />
      <Button type="submit">{t('app.inviteForm.submit')}</Button>
    </form>
  );
}
