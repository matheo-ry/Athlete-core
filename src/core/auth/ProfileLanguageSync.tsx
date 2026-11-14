import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { toLanguage } from '../i18n';
import { useAuth } from './useAuth';
import { useProfile, useUpdateProfile } from './useProfile';

/**
 * El idioma de la app y el del perfil van a la par (D-058):
 * - al entrar (también en otro dispositivo), la app toma el idioma del perfil;
 * - con sesión, cambiar el idioma (en el perfil o en el selector de arriba) se
 *   guarda en el perfil, y así los emails llegan en el idioma nuevo (D-044).
 * No pinta nada.
 */
export function ProfileLanguageSync() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { mutate: updateProfile } = useUpdateProfile();
  // Para quién ya se ha aplicado el idioma del perfil en esta sesión.
  const appliedFor = useRef<string | null>(null);

  useEffect(() => {
    if (profile === undefined || user === null || appliedFor.current === user.id) {
      return;
    }
    appliedFor.current = user.id;
    if (toLanguage(i18n.language) !== profile.locale) {
      void i18n.changeLanguage(profile.locale);
    }
  }, [profile, user, i18n]);

  useEffect(() => {
    if (user === null) {
      appliedFor.current = null;
    }
  }, [user]);

  useEffect(() => {
    const onLanguageChanged = (language: string) => {
      if (profile === undefined || user === null || appliedFor.current !== user.id) {
        return;
      }
      const next = toLanguage(language);
      if (next !== profile.locale) {
        updateProfile({ locale: next });
      }
    };
    i18n.on('languageChanged', onLanguageChanged);
    return () => i18n.off('languageChanged', onLanguageChanged);
  }, [profile, user, i18n, updateProfile]);

  return null;
}
