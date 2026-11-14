import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { checkNewPassword } from '@/core/auth';
import type { AuthFailureReason, AuthResult } from '@/core/auth';
import { Button, PasswordInput } from '@/core/ui';

import { FailureMessage } from './FailureMessage';

interface NewPasswordStepProps {
  save: (password: string) => Promise<AuthResult>;
  onSaved: () => void;
  isSaving: boolean;
}

/** Elegir una contraseña nueva: 8 caracteres como mínimo (D-041). */
export function NewPasswordStep({ save, onSaved, isSaving }: NewPasswordStepProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [failure, setFailure] = useState<AuthFailureReason | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    const error = checkNewPassword(password);
    if (error !== null) {
      setPasswordError(
        error === 'too_short'
          ? t('core.auth.errors.passwordTooShort')
          : t('core.auth.errors.passwordTooLong'),
      );
      return;
    }
    setPasswordError(undefined);
    void save(password).then((result) => {
      if (result.ok) {
        onSaved();
      } else {
        setFailure(result.reason);
      }
    });
  };

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">{t('app.resetPassword.newTitle')}</h1>
        <p className="text-muted">{t('app.resetPassword.newDescription')}</p>
      </header>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <PasswordInput
          label={t('app.resetPassword.newLabel')}
          hint={t('app.resetPassword.newHint')}
          name="new-password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordError}
        />
        <FailureMessage reason={failure} />
        <Button type="submit" disabled={isSaving}>
          {isSaving ? t('app.resetPassword.saving') : t('app.resetPassword.save')}
        </Button>
      </form>
    </>
  );
}
