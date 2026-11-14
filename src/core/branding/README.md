# core/branding

Convierte la marca de un coach (`tenants.branding`) en variables CSS de tema, corrigiendo el contraste. Incluye la marca por defecto de la plataforma.

- **Qué marca se ve** (`BrandProvider`, D-057): la de una vista previa abierta (`useBrandPreview`, por ejemplo la del coach de un código); si no, la del tenant activo; si no hay ninguna, la de ATHLETE CORE.
- `brandInitials`: las iniciales de un negocio, para cuando no tiene logo.
- **Logo** (`logo.ts`, D-057): `checkLogoFile` (PNG, JPG o WebP de 2 MB como máximo; SVG no), `logoPathFor` (dónde se guarda: `<tenant_id>/<nombre nuevo>.<extensión>`) y `logoUrl` (su dirección pública en Storage, que se ve sin sesión).
- `BRAND_PALETTE` (D-057): los 12 colores que el coach elige con un toque; incluye los de ATHLETE CORE. `normalizeHexColor` deja un color escrito a mano como lo guarda la base de datos (`#1E5BD8`), o `null` si no es un color.
- `pickReadableOn`: blanco o negro, el que más contraste dé sobre un color (D-028).
