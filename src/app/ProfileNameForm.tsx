import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { checkDisplayName, useUpdateProfile } from '@/core/auth';
import { Button, Input } from '@/core/ui';

interface ProfileNameFormProps {
  initialName: string;
}

/** Cambiar el nombre (2 a 60 caracteres, D-058). Lo ve el coach en su lista. */
export function ProfileNameForm({ initialName }: ProfileNameFormProps) {
  const { t } = useTranslation();
  const update = useUpdateProfile();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const problem = checkDisplayName(name);
    if (problem !== null) {
      setError(
        problem === 'too_short'
          ? t('core.auth.errors.nameTooShort')
          : t('core.auth.errors.nameTooLong'),
      );
      return;
    }
    setError(undefined);
    void update.mutateAsync({ displayName: name.trim() }).then((result) => {
      setMessage(
        result.ok
          ? { text: t('app.account.saved'), isError: false }
          : {
              text: t(
                result.reason === 'offline' ? 'core.errors.offline' : 'core.errors.unexpected',
              ),
              isError: true,
            },
      );
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
      <Input
        label={t('app.account.nameLabel')}
        name="name"
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={error}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={update.isPending}>
          {update.isPending ? t('app.account.saving') : t('app.account.saveName')}
        </Button>
        {message !== null ? (
          <p
            role={message.isError ? 'alert' : 'status'}
            className={message.isError ? 'text-danger text-sm font-medium' : 'text-muted text-sm'}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
