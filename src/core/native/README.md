# core/native

Envoltorio de las funciones del dispositivo. Es el único sitio que importa `@capacitor/*` (ARQUITECTURA §12): el resto del código pregunta aquí y no depende de Capacitor.

- `platform.ts`: `isNativeApp()` (¿estamos en la app instalada?) y `canLogWorkouts()` (¿se puede empezar o registrar un entreno?). En la app, sí; en el navegador, solo si `core/config` lo permite con `VITE_ALLOW_WEB_WORKOUTS`, que se ignora en cualquier build (DECISIONES D-116). Las pantallas de entreno preguntan siempre a `canLogWorkouts()`.
- `native-shell.ts`: `startNativeShell()`, que se llama una vez al arrancar (`src/main.tsx`). En la app instalada, el botón "atrás" de Android vuelve a la pantalla anterior (en la primera, deja la app en segundo plano) y la barra de estado sigue el modo claro u oscuro de la marca. En el navegador no hace nada.
- **Zonas seguras:** Capacitor pone el tamaño de la barra de estado y de la barra de gestos en las variables CSS `--safe-area-inset-*`; `src/index.css` las convierte en `--safe-top` y `--safe-bottom`, con `env(safe-area-inset-*)` de respaldo para el navegador del móvil.
- `share.ts`: compartir un enlace (menú de compartir del dispositivo) o copiarlo. Hoy con las funciones del navegador; si en la app de móvil hace falta el plugin de Capacitor, se conecta aquí sin tocar a quien lo usa.
