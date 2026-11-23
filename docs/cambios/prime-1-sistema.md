# PRIME 1 — Sistema de diseño, navegación e inicios

- **Fecha:** 2026-11-23
- **PR:** pendiente (rama `feat/prime-1-sistema`)

## Qué cambió

Primer lote de **PRIME**, una segunda dirección visual para la app, muy distinta del rediseño UX 1–4 (#93 a #96). Las dos conviven en PR separados para que el propietario elija cuál se fusiona; ninguna toca la otra. Cambia la base de toda la app sin tocar la lógica: tipografía, color, fotos, cristal, componentes base, la navegación de las dos carcasas y los dos inicios.

## Decisiones

### D-prime1-1 · Dirección visual: cinematográfica, de cristal y con fotos reales
- **Decisión:** fotografía real de gimnasio en blanco y negro, teñida con el color del coach; titulares enormes en una tipografía ancha; tarjetas de cristal que dejan ver el fondo; un fondo ambiental desenfocado en toda la app. Nada de degradados de colores inventados, brillos de neón ni ilustraciones.
- **Por qué:** el propietario pidió "algo mucho más actual y futurista, transparencias, letras grandes, imágenes de fondo, que la gente sienta que es una app súper premium" y que sea muy distinto de UX 1–4. Rechazó tres propuestas planas (Marcador, Póster, Instrumento).
- **Revisar si:** el propietario elige UX 1–4: entonces estos PR se cierran sin fusionar.

### D-prime1-2 · Tipografía: Mona Sans y Hubot Sans
- **Decisión:** `@fontsource-variable/mona-sans` (texto) y `@fontsource-variable/hubot-sans` (titulares y cifras), las dos con eje de anchura 75–125 %. Utilidades `display` (titular ancho y pesado), `numeral` (cifras más estrechas, tabulares) y `eyebrow` (etiqueta pequeña en mayúsculas).
- **Por qué:** son de GitHub con licencia OFL (uso comercial libre), se empaquetan con la app (sin conexión, sin pedir nada a Google) y tienen carácter propio sin ser de "plantilla". Librerías aprobadas por el propietario en el chat ("puedes descargar lo que necesites").

### D-prime1-3 · Siete fotos de Unsplash, en blanco y negro y teñidas por la marca
- **Decisión:** `src/core/ui/media/` con 7 fotos (WebP, 25–385 KB cada una) y su copia diminuta desenfocada (1–4 KB). `Photo` tiñe la foto con el color principal del coach (`mix-blend-color`), añade un velo para leer el texto y grano de película. `HeroBackdrop` la pone fija detrás de la cabecera y se aleja al desplazar (`animation-timeline: scroll()`, solo donde existe). El inicio del cliente cambia de foto con el día de la semana (`photoFor`).
- **Fotos (licencia Unsplash, uso comercial libre sin atribución obligatoria):**
  - `grip` — Xb1d-N04Quc, @tcraye
  - `rack` — gnJqUTCPzzg, @tcraye
  - `squat` — Ogn8fZq20AU, @filipp_roman_photography
  - `chalk` — jybQOCm2jXo, @hg_photo
  - `deadlift` — 9dzWZQWZMdE, @visualsbyroyalz
  - `bar` — WH15dpm1F1E, @bogomolovka
  - `dumbbells` — m4Jqyv5VwqY, @jgrant1
- **Por qué:** el propietario pidió imágenes de fondo que no parezcan "de IA barata". Se eligieron sin caras reconocibles ni logotipos de marcas a la vista. Al pasar a blanco y negro, el color lo pone cada coach y las mismas fotos sirven a todos los negocios.
- **Revisar si:** antes de producción, el propietario revisa las fotos (licencia y que no haya nada reconocible). Cambiar una foto es cambiar su archivo en `media/`.

### D-prime1-4 · El fondo ambiental de toda la app
- **Decisión:** `Ambient` (en `RootLayout`): la foto `rack` diminuta y desenfocada, dos manchas de luz con los dos colores del coach, viñeta y grano. Respira muy despacio (38 s). En modo claro, mucho más suave.
- **Por qué:** es lo que se ve a través del cristal: sin él, el cristal sería un gris plano.

### D-prime1-5 · Cristal sin desenfoque por defecto
- **Decisión:** `glass` (tarjetas) es un velo con un reflejo en el canto de arriba, sin `backdrop-filter`. `glass-float` (barras, menús, avisos) y `glass-photo` (encima de una foto) sí desenfocan. Las pantallas que ponen tarjetas encima de una foto envuelven el contenido en `over-photo`, que añade el desenfoque a su `glass`.
- **Por qué:** un `backdrop-filter` crea un contenedor para los `position: fixed` de dentro: el diálogo de asignar rutina (dentro de una tarjeta de la lista de plantillas) quedaría encerrado en la tarjeta. Además, cada desenfoque cuesta en móviles modestos.

### D-prime1-6 · Navegación: barra flotante y sin barra de título
- **Decisión:** en el móvil (cliente y coach) la navegación es una cápsula de cristal flotante (`ShellDock`) con una lente que se desliza con un muelle hasta la pestaña activa (`--ease-spring`, con `linear()` de CSS, sin librerías). Arriba ya no hay barra: la marca del coach flota como una píldora (`BrandMark variant="chip"`, dentro de `header` para el test del logo) y cada pantalla pone su titular grande. En escritorio, el coach tiene un menú lateral de cristal separado de los bordes, con el idioma abajo. El cliente cambia el idioma en su Perfil (ya existía).
- **Por qué:** más espacio para el contenido y la foto, y el estilo de las apps de iOS y Android actuales. La lente se calcula con el índice de la pestaña (todas miden lo mismo): no hay que medir nada.

### D-prime1-7 · Inicios con foto de cabecera
- **Decisión:** el inicio del cliente pone la foto a casi toda la pantalla, "Hoy" en grande y la tarjeta "Hoy toca" en cristal oscuro encima, con el botón de empezar a todo el ancho. El del coach, la foto, el titular, la cifra de clientes activos (dato que ya existía en `core/tenancy`; texto nuevo `app.coachHome.activeClients`) y los avisos y la actividad en dos columnas en escritorio.

### D-prime1-8 · Listas sin líneas
- **Decisión:** dentro de un panel, las filas no llevan separadores: se iluminan al pasar por encima (`ROW_LINK_CLASS`) y llevan las iniciales en un círculo (`Avatar`).

## Lo que debe saber el siguiente

- **Piezas nuevas de `core/ui`:** `Ambient`, `Avatar`, `HeroBackdrop`, `PageHeader`, `Photo`, `ProgressRing`, `enterDelay`, `fieldClassName` y `FIELD_LABEL_CLASS`, `ROW_LINK_CLASS` y `SECTION_TITLE_CLASS`. `Button` tiene `size="lg"` (56 px) y `variant="danger"`; `buttonClassName(variant, className, size)`. `Card` tiene `tone` (`glass`, `float`, `photo`).
- **`cn` no resuelve choques de clases** (no hay `tailwind-merge`): para cambiar algo que ya pone un componente base, usar `!` (`justify-between!`).
- **`data-mode`** (`light` o `dark`) se pone en `<html>` desde `applyBrandToElement`. La variante `light:` de Tailwind sirve para lo que no es un color.
- **`HeroBackdrop` es `fixed`:** va fuera de cualquier bloque con `animate-enter` (la animación usa `transform` y `filter`, que encerrarían el `fixed` mientras dura).
- **Vite en Windows:** si se lanza desde una ruta con la unidad en minúscula (`c:\…`), el navegador carga dos copias de React y la app sale en negro ("Invalid hook call"). Lanzar desde `C:\…` (en PowerShell, `Set-Location C:\dev\…`).
- Las pantallas de los módulos heredan los colores, la tipografía y el cristal de los componentes base, pero aún no están rediseñadas: son PRIME 2 (cliente), PRIME 3 (coach) y PRIME 4 (acceso).

## Deuda

- La lista de actividad del coach crece sin tope en el inicio: en el móvil empuja los avisos muy abajo. Convendría limitarla (por ejemplo, a 8) con "Ver todo".
- Con 6 o más entradas en la barra flotante (solo en desarrollo, por `Template`), las etiquetas largas se cortan.
