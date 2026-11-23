# UX 1 — Sistema de diseño y navegación

- **Fecha:** 2026-11-22
- **PR:** pendiente (rama `claude/app-design-ux-improvement-886b99`)

## Qué cambió

Primer lote del rediseño de la app (el propietario pidió una estética propia, que no parezca hecha por una IA, y mucha mejor experiencia). Cambia la base visual de **toda** la app a la vez, sin tocar la lógica:

- **Paleta cálida** (tonos piedra, no azul) en los dos modos, con una capa nueva `--brand-raised` (campos, chips, tarjetas elevadas). El color del coach sigue siendo la única luz: de él se derivan, con `color-mix`, los tonos `primary-soft`, `primary-glow`, `accent-soft` y `danger-soft`.
- **Tipografía propia**: Instrument Sans (texto y titulares, con tracking ajustado) y Geist Mono (cifras, etiquetas y datos), empaquetadas con la app.
- **Profundidad**: utilidades `surface`, `surface-raised`, `surface-accent` y `glass` (reflejo de luz en el borde superior, sombra suave, vidrio mate), más un resplandor del color del coach asomando por arriba del fondo.
- **Componentes base rehechos**: `Button` (píldora, 44 px o 56 px con `size="lg"`, se hunde al pulsar), `Card` (con `tone`: `default`, `raised`, `accent`), `Input` y `PasswordInput` (campo hundido y halo del color del coach), `Checkbox` a medida, `Spinner`, `EmptyState` y `ErrorState` (motivo "órbita" con burbujas del acento, hecho en CSS) y `OfflineBanner` en forma de píldora.
- **Piezas nuevas** en `core/ui`: `PageHeader`, `Stat`, `Pill`, `StateOrbit`.
- **Navegación**: barra inferior flotante de vidrio, con la pestaña activa abierta con su nombre y un indicador que se desliza con resorte (`motion`). Menú lateral del coach con el mismo indicador. Selector de idioma en dos segmentos "EN | ES". Cada pantalla entra con un pequeño ascenso (`animate-rise`).
- **Inicios** del cliente y del coach con fecha de hoy (`formatDayLabel`, nueva en `core/lib`), tarjeta del negocio con su distintivo y entrada escalonada.
- Todo respeta "reducir movimiento" del sistema (`MotionConfig` y `prefers-reduced-motion`).

## Decisiones

### D-ux1-1 · Dirección visual: oscuro cálido, con datos en mono
- **Decisión:** neutros cálidos, superficies con profundidad sutil, titulares grandes y cifras/etiquetas monoespaciadas. Referencias: las capturas del propietario (hábitos en negro y amarillo, meditación, interiorismo, widgets, panel de entreno en verde), de las que se toma la idea, no el aspecto.
- **Por qué:** el propietario eligió esta dirección entre tres. Los colores de la marca los elige cada coach, así que el diseño no depende de un color concreto: solo de neutros y de derivados del color del coach.
- **Librerías nuevas (aprobadas por el propietario en el chat):** `@fontsource-variable/instrument-sans`, `@fontsource-variable/geist-mono` (fuentes autoalojadas: sin pedir nada a terceros y con la app sin conexión) y `motion` (animaciones con resorte).

### D-ux1-2 · `resolve.dedupe` de React en `vite.config.ts`
- **Decisión:** `dedupe: ['react', 'react-dom']`.
- **Por qué:** al añadir `motion`, el optimizador de dependencias de Vite en desarrollo empaquetaba dos copias de React y la app moría con "Invalid hook call". En producción no pasa. Es un archivo de configuración de la raíz (zona protegida): lo pide el arreglo.

### D-ux1-3 · Lotes de rediseño
- **Decisión:** UX 1 (este: sistema y navegación), UX 2 (cliente: inicio, entreno, historial, progreso), UX 3 (coach: listas, fichas, editor de rutinas, ajustes), UX 4 (acceso, bienvenida y estados vacíos).
- **Por qué:** una tarea = un PR, y esto toca casi todas las pantallas.

## Lo que debe saber el siguiente

- Las pantallas de los módulos todavía usan sus propios títulos (`<h1 className="text-2xl font-bold">`), listas y desplegables: heredan colores, fuente y tarjetas, pero no usan aún `PageHeader`, `Stat` ni `Pill`. Eso es el trabajo de UX 2 y UX 3.
- Los estilos nuevos están en `src/index.css` (utilidades `surface`, `glass`, `eyebrow`, `numeric`, `focus-ring`, `animate-rise`). Usar `animate-rise` con `style={{ '--rise-delay': '140ms' }}` para escalonar.
- `animate-rise` usa `backwards` y no `both` a propósito: dejar un `transform` al acabar crearía un contenedor para los elementos `fixed` y `sticky` de dentro.
- `data-mode` (`light` o `dark`) se pone en `<html>` desde `applyBrandToElement`, por si un estilo depende del modo y no es un color.
- En Windows, `vitest` falla desde Git Bash con "failed to find the runner" (la unidad `c:` en minúscula crea dos copias del módulo). Lanzar desde PowerShell, con la ruta empezando en `C:`.
- Probar el aspecto de verdad: `npm run db:start`, `npm run dev`, entrar con los usuarios del seed (`docs/` y `supabase/seed.sql`) en ancho de móvil (375 y 360 px) y de escritorio, en los dos modos.

## Deuda

- Las dos pestañas de la barra inferior más largas ("Ejercicios") caben a 360 px con 5 entradas; con 6 o más habría que pasar a etiquetas debajo del icono o a un menú "Más".
- `FilterSelect` y `TextArea` (en `exercises`) y otros desplegables siguen con sus estilos; conviene subirlos a `core/ui` en UX 3 (ya estaba anotado).
- El grano de película previsto en el fondo no se ha añadido: se valorará con las pantallas de entreno, por el coste en móviles modestos.
- Aviso de háptico al cambiar de pestaña: `@capacitor/haptics` ya está; falta decidir en qué acciones se usa.
