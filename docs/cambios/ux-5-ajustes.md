# UX 5 — Ajustes tras la revisión visual

- **Fecha:** 2026-11-23
- **PR:** pendiente (rama `feat/ux-5-ajustes`, apilada sobre UX 4 `feat/ux-4-acceso`)

## Qué cambió

Las 13 mejoras de la revisión visual del propietario y lo que salió al repasar la app:

- **Entreno:** sin barra inferior en `/client/workout`; la barra del descanso baja al borde; etiquetas de los campos de serie en letra normal (en mayúsculas mono no cabían).
- **Inicios:** sin la tarjeta del coach ni la del negocio (ya están en la cabecera). La actividad del coach enseña las 6 últimas, con fecha, y "Ver todo".
- **Idioma:** fuera de las cabeceras con sesión; el cliente lo cambia en Perfil y el coach en Ajustes (y, en escritorio, abajo en el menú lateral).
- **Rutina del cliente:** dentro de un día, el título "Entreno" queda solo para el lector de pantalla (sigue siendo el h1).
- **Progreso:** peso corporal sin lastre se sigue por repeticiones; sin RM no salen las cifras vacías; historial con las 5 últimas y "Ver todo"; el chip elegido siempre a la vista; la gráfica sin círculos cuando hay más de 12 sesiones.
- **Coach:** filtros de ejercicios plegados en el móvil (icono de deslizadores); en las plantillas, renombrar, duplicar y archivar como iconos (texto en escritorio); dar de baja a un cliente, discreto y con confirmación roja.
- **Marca:** el color propio, plegado bajo "Usar otro color" (abierto si ya se usa uno); icono nuevo de la plataforma (`public/favicon.svg`).
- **Carga:** esqueletos (`SkeletonCard`, `SkeletonList` en `core/ui`) en lugar del círculo en listas, rutina, progreso y tarjetas del inicio.
- **Etiquetas** de 11 a 12 px.

## Decisiones

### D-ux5-1 · Sin guion en las series vacías
- **Decisión:** se probó un "—" en los campos sin referencia y se quitó.
- **Por qué:** entre los botones − y + se leía como otro signo menos.

### D-ux5-2 · Logo de la plataforma provisional
- **Decisión:** solo el icono de la pestaña; las iniciales "AC" siguen en la cabecera.
- **Por qué:** el logo definitivo es una decisión de marca del propietario.

## Lo que debe saber el siguiente

- No se ha pasado la batería completa de e2e tras los últimos cambios (sí los unitarios de las zonas tocadas, tipos y lint). Pasarla antes de fusionar, con `VITE_ALLOW_WEB_WORKOUTS=true`.

## Deuda

- Claves sin uso: `app.clientHome.coachLabel` y `app.coachHome.businessLabel`.
