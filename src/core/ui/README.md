# core/ui

Componentes base (Button, Input, PasswordInput, Checkbox, Card, Spinner, EmptyState, ErrorState, Icon, OfflineBanner, PageHeader, Stat, Pill). Se pintan solo con las variables de tema, nunca con un color fijo.

- **Lenguaje visual (D-ux1-1):** neutros cálidos, profundidad sutil y el color del coach como única luz. Texto en Instrument Sans; cifras y etiquetas en Geist Mono. Los estilos compartidos están en `src/index.css` como utilidades de Tailwind: `surface`, `surface-raised`, `surface-accent`, `glass`, `eyebrow` (etiqueta mono en mayúsculas), `numeric` (cifras), `focus-ring` y `animate-rise` (entrada de pantalla; escalonar con `--rise-delay`).
- `Card` admite `tone`: `default`, `raised` o `accent` (tintada con el color del coach, para lo más importante de la pantalla). `Button` admite `size="lg"` (56 px) para la acción principal.
- `PageHeader` (título grande con línea "eyebrow", descripción y acción), `Stat` (cifra con etiqueta y unidad) y `Pill` (chip de estado) son para componer pantallas.
- `EmptyState` y `ErrorState` usan `StateOrbit`, el motivo gráfico de la app: dos órbitas y unas burbujas del acento, en CSS.

- `LineChart`: gráfica de línea en SVG propio (D-135, D-147). Mide su contenedor para que el texto y los 44 px táctiles no encojan. Es un grupo de radio para el teclado (flechas, Inicio y Fin) y lleva un resumen para el lector de pantalla. `ariaLabel` es obligatorio. Los cálculos están en `line-chart-geometry.ts`.
- `PasswordInput`: campo de contraseña con botón para ver lo escrito (DECISIONES D-041).
- `OfflineBanner` y `useOnlineStatus`: la franja fija "Sin conexión" (D-061). Va en `app/RootLayout.tsx`.
