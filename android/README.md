# android

Proyecto nativo de Android, generado con Capacitor (`npx cap add android`, PR 3.1) y guardado en Git (ARQUITECTURA §12). Envuelve la misma app web: aquí no hay pantallas ni lógica.

- **Qué se toca a mano:** casi nada. El icono (`app/src/main/res/drawable-v24/ic_launcher_foreground.xml` y el color de `values/ic_launcher_background.xml`) y el color de arranque. El identificador `app.athletecore.mobile` es **provisional** (se fija antes de publicar en las tiendas, Fase 4).
- **Qué no se toca:** lo que regenera Capacitor (`capacitor.settings.gradle`, `app/capacitor.build.gradle`) ni la carpeta `app/src/main/assets/public` (la copia de la web, que no se sube a Git).
- **Plugins:** los que estén en `package.json` (`@capacitor/*`) se enlazan solos con `npx cap sync android`. Solo los usa `src/core/native`.
- **Para agentes:** cada vez que cambie la web, hay que volver a generar el APK (`npm run android:build`) para verlo en el móvil. Sin emulador en el ordenador, la prueba en el móvil la hace el propietario con la guía de abajo.

---

## Guía: instalar la app en tu móvil Android (propietario)

Para probar la app en tu móvil: generas en tu ordenador el archivo de la app (un **APK de pruebas**), lo pasas al móvil y lo instalas. La app entra en **staging** (los datos inventados de la nube), nunca en tu ordenador.

### Paso 1. Lo que se instala una sola vez

1. **Android Studio.** Descárgalo de [developer.android.com/studio](https://developer.android.com/studio) e instálalo con las opciones que vienen marcadas.
2. **Ábrelo una vez.** El asistente propone la instalación "Standard": acéptala, acepta las licencias y espera a que termine de descargar (unos minutos). Después puedes cerrarlo: no hace falta abrirlo para generar la app.
3. **El archivo de staging.** Tienes que tener `.env.staging.local` en la carpeta del proyecto. Si ya pruebas con `npm run dev:staging`, ya lo tienes. Si no, `supabase/README.md`, paso 5.

### Paso 2. Generar el archivo de la app

1. Abre la terminal de VS Code en la carpeta del proyecto (`C:\dev\athlete-core`).
2. Escribe `npm run android:build` y pulsa Intro.
3. La primera vez tarda varios minutos (descarga herramientas). Las siguientes, menos de un minuto.
4. Al terminar dice **"Listo"** y dónde está el archivo: `C:\dev\athlete-core\build\athlete-core-staging.apk`.

### Paso 3. Pasarlo al móvil

La forma más fácil, cualquiera de estas dos:

- **Con Google Drive:** sube `athlete-core-staging.apk` a tu Drive desde el ordenador y, en el móvil, ábrelo desde la app de Drive y pulsa **Descargar**.
- **Con el cable USB:** conecta el móvil, elige "Transferencia de archivos" en el aviso del móvil y copia el archivo a la carpeta `Download` del móvil desde el Explorador de Windows.

### Paso 4. Instalarla

1. En el móvil, abre la app **Archivos** (o "Mis archivos"), entra en **Descargas** y pulsa `athlete-core-staging.apk`.
2. La primera vez, Android dice que no permite instalar apps de ese sitio. Pulsa **Ajustes**, activa **Permitir de esta fuente** y vuelve atrás.
3. Pulsa **Instalar**. Si sale un aviso de Google Play Protect ("app desconocida"), pulsa **Instalar de todos modos**: es normal en una app que no viene de Google Play.
4. Aparece **ATHLETE CORE** con su icono azul entre tus apps.

**Para instalar una versión nueva**, repite los pasos 2 a 4: se instala encima y no pierdes la sesión. Si Android dice que "entra en conflicto con un paquete existente" (pasa si el archivo se generó en otro ordenador), desinstala la app y vuelve a instalarla.

### Paso 5. Qué comprobar

- Entra con `ana@example.com` / `password123`: ves su inicio y la pestaña "Entreno".
- El botón **"atrás"** del móvil (o el gesto de deslizar desde el borde) vuelve a la pantalla anterior. En la primera pantalla, deja la app en segundo plano.
- Nada queda tapado por la barra de arriba (hora, batería) ni por la de abajo (botones o barra de gestos).

### Si algo falla

- **"Falta .env.staging.local":** mira el paso 1.3.
- **"No encuentro Java" o "No encuentro las herramientas de Android":** abre Android Studio una vez y deja que termine de instalar (paso 1.2).
- **La app abre pero no entra o se queda cargando:** staging puede estar pausado por una semana sin uso. Se reanuda en el panel de Supabase con **Restore project** (`supabase/README.md`, paso 6).
- **Otro error al generar:** copia el mensaje rojo de la terminal y pásaselo al agente.
