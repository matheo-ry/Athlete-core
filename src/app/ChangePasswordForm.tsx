import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
  checkNewPassword,
  failureMessageKey,
  useAuthAction,
  useNeedsCurrentPassword,
} from '@/core/auth';
import { Button, PasswordInput } from '@/core/ui';

interface PasswordChange {
  next: string;
  current: string | undefined;
}

/**
 * Cambiar la contraseña desde el perfil (D-042). Pide la actual, salvo a quien
 * entró con un código por email. Después se cierran las sesiones de los demás
 * dispositivos y llega el email de aviso.
 */
export function ChangePasswordForm() {
  const { t } = useTranslation();
  // Mientras se averigua cómo se entró, no se enseña el campo de la actual (así
  // no aparece y desaparece) y no se puede enviar. Si no se sabe, se pide.
  const needsCurrentQuery = useNeedsCurrentPassword();
  const needsCurrent = needsCurrentQuery.data ?? needsCurrentQuery.isError;
  const checking = needsCurrentQuery.isPending;
  const change = useAuthAction<PasswordChange>((service, input) =>
    service.updatePassword(input.next, input.current),
  );
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const nextProblem = checkNewPassword(next);
    const nextErrors = {
      current: needsCurrent && current === '' ? t('app.changePassword.currentRequired') : undefined,
      next:
        nextProblem === null
          ? undefined
          : t(
              nextProblem === 'too_short'
                ? 'core.auth.errors.passwordTooShort'
                : 'core.auth.errors.passwordTooLong',
            ),
    };
    setErrors(nextErrors);
    if (nextErrors.current !== undefined || nextErrors.next !== undefined) {
      return;
    }
    void change
      .mutateAsync({ next, current: needsCurrent ? current : undefined })
      .then((result) => {
        if (result.ok) {
          setCurrent('');
          setNext('');
          setMessage({ text: t('app.changePassword.changed'), isError: false });
        } else {
          setMessage({ text: t(failureMessageKey(result.reason)), isError: true });
        }
      });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <h3 className="eyebrow text-muted">{t('app.changePassword.title')}</h3>
      {needsCurrent ? (
        <PasswordInput
          label={t('app.changePassword.currentLabel')}
          name="current-password"
          autoComplete="current-password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          error={errors.current}
        />
      ) : null}
      <PasswordInput
        label={t('app.changePassword.newLabel')}
        hint={t('app.changePassword.newHint')}
        name="new-password"
        autoComplete="new-password"
        value={next}
        onChange={(event) => setNext(event.target.value)}
        error={errors.next}
      />
      {message !== null ? (
        <p
          role={message.isError ? 'alert' : 'status'}
          className={message.isError ? 'text-danger text-sm font-medium' : 'text-sm'}
        >
          {message.text}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={change.isPending || checking}>
        {change.isPending ? t('app.changePassword.changing') : t('app.changePassword.submit')}
      </Button>
    </form>
  );
}
