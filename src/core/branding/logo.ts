import { env } from '../config';

// El logo del coach (D-057): PNG, JPG o WebP de 2 MB como máximo. SVG no: puede
// llevar código dentro. Se guarda en Storage, en el espacio público "logos",
// dentro de la carpeta del negocio (D-051). Storage también rechaza lo que no
// cumpla esto; aquí se comprueba antes para avisar sin esperar a subirlo.

export const LOGO_BUCKET = 'logos';
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

const LOGO_EXTENSIONS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
} as const;

export type LogoType = keyof typeof LOGO_EXTENSIONS;

/** Para el selector de archivos: solo enseña los formatos admitidos. */
export const LOGO_ACCEPT = Object.keys(LOGO_EXTENSIONS).join(',');

export type LogoProblem = 'too_large' | 'invalid_type';

function isLogoType(type: string): type is LogoType {
  return Object.hasOwn(LOGO_EXTENSIONS, type);
}

/** Por qué no vale este archivo como logo, o `null` si vale. */
export function checkLogoFile(file: { type: string; size: number }): LogoProblem | null {
  if (!isLogoType(file.type)) {
    return 'invalid_type';
  }
  return file.size > LOGO_MAX_BYTES ? 'too_large' : null;
}

/**
 * Dónde se guarda un logo nuevo: `<tenant_id>/<nombre al azar>.<extensión>`.
 * Cada logo tiene un nombre nuevo: así nadie ve el anterior por la caché.
 */
export function logoPathFor(tenantId: string, type: string, id: string): string | null {
  return isLogoType(type) ? `${tenantId}/${id}.${LOGO_EXTENSIONS[type]}` : null;
}

/** La dirección pública de un logo guardado. Se puede ver sin sesión (D-051). */
export function logoUrl(path: string): string {
  const safePath = path.split('/').map(encodeURIComponent).join('/');
  return `${env.supabase.url}/storage/v1/object/public/${LOGO_BUCKET}/${safePath}`;
}
