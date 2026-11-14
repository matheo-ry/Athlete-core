import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
  TERMS_VERSION,
  checkDisplayName,
  checkEmail,
  checkNewPassword,
  useAuthAction,
} from '@/core/auth';
import type { AuthFailureReason, SignupInput } from '@/core/auth';
import { useLanguage } from '@/core/i18n';
import { defaultWeightUnitFor } from '@/core/lib';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  terms?: string;
}

/**
 * El formulario de registro (D-040, D-041, D-058 y D-060): valida, crea la cuenta
 * y avisa con `onCreated` para pasar a confirmar el email.
 */
export function useSignupForm(initialEmail: string, onCreated: (input: SignupInput) => void) {
  const { t } = useTranslation();
  const language = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<AuthFailureReason | null>(null);
  const signUp = useAuthAction<SignupInput>((service, input) => service.signUp(input));

  const validate = (): SignupInput | null => {
    const errors: FieldErrors = {};
    const nameError = checkDisplayName(name);
    if (nameError !== null) {
      errors.name =
        nameError === 'too_short'
          ? t('core.auth.errors.nameTooShort')
          : t('core.auth.errors.nameTooLong');
    }
    const checkedEmail = checkEmail(email);
    if (!checkedEmail.ok) {
      errors.email =
        checkedEmail.error === 'required'
          ? t('core.auth.errors.emailRequired')
          : t('core.auth.errors.emailInvalid');
    }
    const passwordError = checkNewPassword(password);
    if (passwordError !== null) {
      errors.password =
        passwordError === 'too_short'
          ? t('core.auth.errors.passwordTooShort')
          : t('core.auth.errors.passwordTooLong');
    }
    if (!acceptedTerms) {
      errors.terms = t('core.auth.errors.termsRequired');
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !checkedEmail.ok) {
      return null;
    }
    return {
      email: checkedEmail.email,
      password,
      displayName: name.trim(),
      locale: language,
      weightUnit: defaultWeightUnitFor(navigator.language),
      termsVersion: TERMS_VERSION,
    };
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    const input = validate();
    if (input === null) {
      return;
    }
    void signUp.mutateAsync(input).then((result) => {
      if (result.ok) {
        onCreated(input);
      } else {
        setFailure(result.reason);
      }
    });
  };

  return {
    fields: { name, email, password, acceptedTerms },
    setName,
    setEmail,
    setPassword,
    setAcceptedTerms,
    fieldErrors,
    failure,
    setFailure,
    isSubmitting: signUp.isPending,
    handleSubmit,
    /** Lo que se guardaría ahora mismo, sin validar (para "Confirmar mi email"). */
    currentInput: validate,
  };
}
