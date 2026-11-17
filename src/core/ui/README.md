# core/ui

Componentes base (Button, Input, PasswordInput, Checkbox, Card, Spinner, EmptyState, ErrorState, Icon, OfflineBanner). Se pintan solo con las variables de tema, nunca con un color fijo.

- `LineChart`: gráfica de línea en SVG propio (D-135, D-146). Mide su contenedor para que el texto y los 44 px táctiles no encojan. Es un grupo de radio para el teclado (flechas, Inicio y Fin) y lleva un resumen para el lector de pantalla. `ariaLabel` es obligatorio. Los cálculos están en `line-chart-geometry.ts`.
- `PasswordInput`: campo de contraseña con botón para ver lo escrito (DECISIONES D-041).
- `OfflineBanner` y `useOnlineStatus`: la franja fija "Sin conexión" (D-061). Va en `app/RootLayout.tsx`.
