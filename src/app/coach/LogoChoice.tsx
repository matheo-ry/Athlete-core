import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { LOGO_ACCEPT } from '@/core/branding';
import type { Brand } from '@/core/branding';
import { Button, buttonClassName } from '@/core/ui';

import { BrandBadge } from '../BrandBadge';

interface LogoChoiceProps {
  brand: Brand;
  /** El logo que se ve ahora: el guardado (`undefined`), uno nuevo sin guardar, o ninguno (`null`). */
  logoSrc: string | null | undefined;
  hasLogo: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
  error?: string;
}

/**
 * Subir, cambiar o quitar el logo (D-057). Se elige un archivo del dispositivo;
 * se ve en la vista previa y se guarda con el resto de la marca.
 */
export function LogoChoice({ brand, logoSrc, hasLogo, onPick, onRemove, error }: LogoChoiceProps) {
  const { t } = useTranslation();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Se vacía para poder elegir otra vez el mismo archivo.
    event.target.value = '';
    if (file !== undefined) {
      onPick(file);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{t('app.brand.logoLabel')}</span>
      <div className="flex items-center gap-4">
        <BrandBadge brand={brand} size="lg" logoSrc={logoSrc} />
        <div className="flex flex-1 flex-wrap gap-2">
          <label className={buttonClassName('secondary')}>
            {t(hasLogo ? 'app.brand.logoChange' : 'app.brand.logoUpload')}
            <input type="file" accept={LOGO_ACCEPT} onChange={handleChange} className="sr-only" />
          </label>
          {hasLogo ? (
            <Button type="button" variant="ghost" onClick={onRemove}>
              {t('app.brand.logoRemove')}
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-muted text-sm">{t('app.brand.logoHint')}</p>
      {error !== undefined ? (
        <p role="alert" className="text-danger text-sm font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
