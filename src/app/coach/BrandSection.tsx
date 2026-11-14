import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_BRAND, checkLogoFile, normalizeHexColor } from '@/core/branding';
import type { Brand, BrandMode } from '@/core/branding';
import { useUpdateBrand } from '@/core/tenancy';
import type { LogoChange, Tenant, UpdateBrandResult } from '@/core/tenancy';
import { Button, Card, Input } from '@/core/ui';

import { BrandPreviewCard } from './BrandPreviewCard';
import { ColorChoice } from './ColorChoice';
import { LogoChoice } from './LogoChoice';
import { ModeChoice } from './ModeChoice';

interface BrandSectionProps {
  tenant: Tenant;
}

/** El logo en el borrador: el guardado, uno nuevo (con su imagen para verlo) o ninguno. */
type LogoDraft =
  { kind: 'keep' } | { kind: 'replace'; file: File; dataUrl: string } | { kind: 'remove' };

interface Draft {
  name: string;
  primary: string;
  accent: string;
  mode: BrandMode;
  logo: LogoDraft;
}

interface DraftErrors {
  name?: string;
  primary?: string;
  accent?: string;
  logo?: string;
}

const NAME_MIN = 2;
const NAME_MAX = 40; // D-057: el mismo límite que al crear el negocio (D-049)

const FAILURE_KEYS: Record<Exclude<UpdateBrandResult, 'ok'>, string> = {
  invalid_name: 'app.brand.nameTooShort',
  invalid_color: 'app.brand.colorInvalid',
  logo_too_large: 'app.brand.logoTooLarge',
  logo_invalid_type: 'app.brand.logoInvalidType',
  not_allowed: 'app.brand.notAllowed',
  offline: 'core.errors.offline',
  error: 'core.errors.unexpected',
};

function draftFrom(tenant: Tenant): Draft {
  return {
    name: tenant.name,
    primary: tenant.branding.colors.primary,
    accent: tenant.branding.colors.accent,
    mode: tenant.branding.mode,
    logo: { kind: 'keep' },
  };
}

function toLogoChange(logo: LogoDraft): LogoChange {
  return logo.kind === 'replace' ? { kind: 'replace', file: logo.file } : logo;
}

/**
 * "Marca" en los ajustes del coach, solo para el dueño (D-057): el nombre del
 * negocio, el logo, los colores principal y de acento, el modo claro u oscuro,
 * una vista previa antes de guardar y "Volver a los colores de ATHLETE CORE".
 * Al guardar cambia toda su app, y la de sus clientes la próxima vez que la
 * abran.
 */
export function BrandSection({ tenant }: BrandSectionProps) {
  const { t } = useTranslation();
  const updateBrand = useUpdateBrand();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(tenant));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const change = (patch: Partial<Draft>) => {
    setDraft((previous) => ({ ...previous, ...patch }));
    setMessage(null);
  };

  // La vista previa usa lo escrito; si un color aún no es válido, el guardado.
  const preview: Brand = {
    appName: draft.name.trim() === '' ? tenant.name : draft.name.trim(),
    logoPath: tenant.branding.logoPath,
    colors: {
      primary: normalizeHexColor(draft.primary) ?? tenant.branding.colors.primary,
      accent: normalizeHexColor(draft.accent) ?? tenant.branding.colors.accent,
    },
    mode: draft.mode,
  };
  const logoSrc =
    draft.logo.kind === 'replace'
      ? draft.logo.dataUrl
      : draft.logo.kind === 'remove'
        ? null
        : undefined;
  const hasLogo =
    draft.logo.kind === 'replace' ||
    (draft.logo.kind === 'keep' && tenant.branding.logoPath !== null);

  // Se comprueba al elegirlo, para avisar sin esperar a guardar (D-057).
  const pickLogo = (file: File) => {
    const problem = checkLogoFile(file);
    if (problem !== null) {
      setErrors((previous) => ({
        ...previous,
        logo: t(problem === 'too_large' ? 'app.brand.logoTooLarge' : 'app.brand.logoInvalidType'),
      }));
      return;
    }
    setErrors((previous) => ({ ...previous, logo: undefined }));
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        change({ logo: { kind: 'replace', file, dataUrl: reader.result } });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setErrors((previous) => ({ ...previous, logo: undefined }));
    change({ logo: tenant.branding.logoPath === null ? { kind: 'keep' } : { kind: 'remove' } });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const name = draft.name.trim();
    const primary = normalizeHexColor(draft.primary);
    const accent = normalizeHexColor(draft.accent);
    const nextErrors: DraftErrors = {
      name:
        name.length < NAME_MIN
          ? t('app.brand.nameTooShort')
          : name.length > NAME_MAX
            ? t('app.brand.nameTooLong')
            : undefined,
      primary: primary === null ? t('app.brand.colorInvalid') : undefined,
      accent: accent === null ? t('app.brand.colorInvalid') : undefined,
    };
    setErrors(nextErrors);
    if (primary === null || accent === null || nextErrors.name !== undefined) {
      return;
    }
    void updateBrand
      .mutateAsync({
        brand: { name, primary, accent, mode: draft.mode },
        logo: toLogoChange(draft.logo),
      })
      .then((result) => {
        if (result === 'ok') {
          // El logo ya está guardado: a partir de aquí se ve el de la marca.
          setDraft((previous) => ({ ...previous, logo: { kind: 'keep' } }));
          setMessage({ text: t('app.brand.saved'), isError: false });
        } else {
          setMessage({ text: t(FAILURE_KEYS[result]), isError: true });
        }
      });
  };

  const resetColors = () => {
    change({
      primary: DEFAULT_BRAND.colors.primary,
      accent: DEFAULT_BRAND.colors.accent,
      mode: DEFAULT_BRAND.mode,
    });
    setErrors((previous) => ({ ...previous, primary: undefined, accent: undefined }));
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <header>
          <h2 className="text-lg font-semibold">{t('app.brand.title')}</h2>
          <p className="text-muted text-sm">{t('app.brand.description')}</p>
        </header>

        <Input
          label={t('app.brand.nameLabel')}
          hint={t('app.brand.nameHint')}
          name="business-name"
          autoComplete="organization"
          maxLength={60}
          value={draft.name}
          onChange={(event) => change({ name: event.target.value })}
          error={errors.name}
        />
        <LogoChoice
          brand={preview}
          logoSrc={logoSrc}
          hasLogo={hasLogo}
          onPick={pickLogo}
          onRemove={removeLogo}
          error={errors.logo}
        />
        <ColorChoice
          name="primary"
          legend={t('app.brand.primaryLabel')}
          customLabel={t('app.brand.primaryCustomLabel')}
          value={draft.primary}
          onChange={(primary) => change({ primary })}
          error={errors.primary}
        />
        <ColorChoice
          name="accent"
          legend={t('app.brand.accentLabel')}
          customLabel={t('app.brand.accentCustomLabel')}
          value={draft.accent}
          onChange={(accent) => change({ accent })}
          error={errors.accent}
        />
        <ModeChoice value={draft.mode} onChange={(mode) => change({ mode })} />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('app.brand.previewLabel')}</span>
          <BrandPreviewCard brand={preview} logoSrc={logoSrc} />
        </div>

        {message !== null ? (
          <p
            role={message.isError ? 'alert' : 'status'}
            className={message.isError ? 'text-danger text-sm font-medium' : 'text-sm'}
          >
            {message.text}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={updateBrand.isPending}>
            {updateBrand.isPending ? t('app.brand.saving') : t('app.brand.save')}
          </Button>
          <Button type="button" variant="ghost" onClick={resetColors}>
            {t('app.brand.reset')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
