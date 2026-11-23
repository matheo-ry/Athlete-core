# core/ui

Componentes base del sistema de diseño PRIME (`docs/cambios/prime-1-sistema.md`). Se pintan solo con las variables de tema, nunca con un color fijo.

- **Materiales** (en `src/index.css`): `glass` (tarjetas, sin desenfoque), `glass-float` (lo que flota: barras, menús, avisos), `glass-photo` (encima de una foto) y `over-photo` (contenedor encima de una foto: su `glass` desenfoca).
- **Tipografía:** `display` (titulares en Hubot Sans ancha), `numeral` (cifras) y `eyebrow` (etiqueta en mayúsculas).
- **Base:** `Button` (`variant`, `size`), `Card` (`tone`), `Input`, `PasswordInput`, `Checkbox`, `Spinner`, `EmptyState`, `ErrorState`, `Icon`, `OfflineBanner`, `PageHeader`, `Avatar`, `ProgressRing`.
- **Fotos:** `Photo`, `HeroBackdrop` y `Ambient`. Las fotos están en `media/` y su registro en `photos.ts` (origen y licencia en D-prime1-3).
- `LineChart`: gráfica de línea en SVG propio (D-135, D-147). Mide su contenedor para que el texto y los 44 px táctiles no encojan. Es un grupo de radio para el teclado (flechas, Inicio y Fin) y lleva un resumen para el lector de pantalla. `ariaLabel` es obligatorio. Los cálculos están en `line-chart-geometry.ts`.
- `PasswordInput`: campo de contraseña con botón para ver lo escrito (DECISIONES D-041).
- `OfflineBanner` y `useOnlineStatus`: el aviso fijo "Sin conexión" (D-061). Va en `app/RootLayout.tsx`.
