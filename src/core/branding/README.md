# core/branding

Convierte la marca de un coach (`tenants.branding`) en variables CSS de tema, corrigiendo el contraste. Incluye la marca por defecto de la plataforma.

- **Qué marca se ve** (`BrandProvider`, D-057): la de una vista previa abierta (`useBrandPreview`, por ejemplo la del coach de un código); si no, la del tenant activo; si no hay ninguna, la de ATHLETE CORE.
- `brandInitials`: las iniciales de un negocio, para cuando no tiene logo.
- `pickReadableOn`: blanco o negro, el que más contraste dé sobre un color (D-028).
