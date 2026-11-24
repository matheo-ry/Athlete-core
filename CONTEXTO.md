# CONTEXTO — léelo al empezar cada chat

> Resumen de una página para que cualquier chat nuevo (Claude o Gemini) sepa en qué punto está el proyecto sin depender de conversaciones anteriores.
> Los PR normales NO lo tocan (D-153): lo actualiza un solo PR de Claude al cerrar cada lote, resumiendo `docs/cambios/`. Máximo unas 80 líneas. El detalle completo está en `docs/`.

## La app

- **ATHLETE CORE**: app para **coaches de gimnasio (foco en fuerza)** y sus clientes.
- **Una sola app** para web, iOS y Android (los entrenos se registran **solo en la app del móvil**; la web sirve para todo lo demás, D-116), con dos perfiles:
  - **Coach**: crea rutinas, asigna, sigue a sus clientes y personaliza su marca.
  - **Cliente**: entra con el código de su coach, ve la marca de su coach y registra sus entrenos.
- Cada coach es un **tenant**: sus datos están aislados de los demás en la propia base de datos.
- Idiomas: inglés y español. Mercados: España para validar; EE. UU., Reino Unido, Canadá, Australia y Europa para vender.

## Cómo está montada

- **Tecnología:** React + Vite + TypeScript, Tailwind, TanStack Query, Zod, i18next, Supabase (Postgres con RLS), Capacitor para móvil. Fuentes propias (Instrument Sans y Geist Mono) empaquetadas con la app.
- **Carpetas:** `src/core/` (cimientos, zona protegida), `src/modules/<función>/` (una carpeta por función), `src/app/` (rutas y carcasas de coach y cliente).
- **Seguridad:** toda tabla de negocio lleva `tenant_id` y RLS. Lo delicado (crear negocio, unirse con código) va por funciones de la base de datos.
- **Git:** una tarea = una rama = un Pull Request. `main` sin protección en GitHub. Commits en Conventional Commits, en español.

## Dónde estamos

- **Fase actual:** 3 — Entreno y progreso, en construcción (diseño en D-115 a D-137). Las Fases 1 y 2 están terminadas.
- **Cierre del lote 3 (2026-11-24):** fusionados 3.7 (#90), 3.8 (#101), 3.9a (#102) y 3.9b (#103). Con ellos, un día entero de la rutina real se apunta con unilaterales, superseries, cambiar o saltar un ejercicio, cronómetro, peso corporal y medidas.
- **Lote 4 (el coach):** 3.12 fusionado (#91, D-3.12-1 a 4). 3.13 y 3.14 ya estaban.
- **Rediseño UX 1 a 4 (D-ux1-3):** fusionado en #93, #94, #95 y #96. Sistema visual cálido y tipografía propia; cliente, coach y pantallas de acceso ya lo usan.
- **Última tarea terminada:** PR 3.18 (Excel, 2026-11-17). Antes, 3.16 (gráficas) y 3.15 (historial, RM y récords).
- **Siguiente tarea:** **PR 3.10 — Notas del día, set-up y "¿Seguro?"** (Gemini), luego **PR 3.11 — Historial del cliente y corregir** (Gemini) y **PR 3.17 — Minilogros, racha, niveles y logros** (Gemini, tras 3.16 y 3.18, ya en `main`). Las tres tocan `workouts` salvo la 3.17 que también toca `progress`. Qué carpetas toca cada uno y si usa la base local: `docs/PROMPTS.md` §7.
- **Decisiones pendientes de la Fase 3 a tener en cuenta:** D-ideas-2 (PR 3.19, series de calentamiento, después del lote 3) y D-ideas-10 (PR 3.10b, nota final del entreno, después del 3.10). Ambos aparecen en PROMPTS §7.

## Cómo será la Fase 3 (diseñada, D-115 a D-136)

- **Entrenar, solo en la app del móvil** (Android desde el PR 3.1a; iOS, en la Fase 4). Todo se guarda en el teléfono al instante y se sube solo (D-118).
- **Apuntar:** un ejercicio por pantalla; peso, repeticiones y RIR o RPE; la vez anterior en gris y "Igual". Unilaterales, superseries, cambiar o saltar un ejercicio (3.8).
- **Cerrar:** cierre solo, "Terminar", "Descartar", resumen final; recordatorio a las 6 horas y cierre a las 12; "Seguir aquí" entre dos móviles (3.6a-c, D-149 a D-152).
- **Cronómetro** fijo para toda la app, con alarma con la pantalla apagada (3.7, D-3.7-1 a 4).
- **Datos de salud:** un consentimiento por espacio para el peso, las medidas y las notas (D-126). Peso y medidas en `/client/body` (3.9a/3.9b).
- **Día saltado:** tres reglas que elige el coach (3.12).
- **El coach** ve la actividad, los entrenos y los avisos de cada cliente. **Progreso:** historial, RM estimado, récords, gráficas y Excel.

## Qué existe ya

- **Cuentas y espacios (Fase 1, hecha):** registro con código de 6 dígitos, entrar con contraseña o código, recuperar contraseña, dar de baja y reactivar clientes, varios espacios por cuenta, marca del coach (nombre, logo, colores, modo) y unirse con código.
- **Ejercicios y rutinas (Fase 2, hecha):** 120 ejercicios de la plataforma, módulos `exercises` y `programs` con editor, bloques, superseries, sustituir y copiar. Guardado con `save_program`.
- **Entrenos y datos de salud en la base de datos:** `workouts`, `workout_exercises`, `workout_sets` con `sync_workout` y `discard_workout`; `body_weights`, `body_measurements`, `health_consents`, `program_missed_days` y `client_exercise_setups` (D-138 a D-141).
- **Base de datos local:** 21 migraciones; 524 tests pgTAP (`npm run db:test`); 2 coaches y 6 clientes inventados (`supabase/seed.sql`, contraseña `password123`).
- **Tests:** unitarios (`npm run check`) y e2e contra Supabase local (`npm run test:e2e`, también en el CI). El CI corre además "Tests de flujos completos".
- **Staging:** proyecto `athlete-core-staging` de Supabase con los mismos datos inventados. Emails por Resend. Se prueba con `npm run dev:staging`.
- **Guardado en el móvil:** almacén, cola de subida y `workouts` sin conexión (3.4a y 3.4b, D-143).
- **Reglas que se comprueban solas:** ESLint con fronteras, hooks de Git, CI con `npm run check`, base de datos y flujos completos; tests que vigilan fronteras, textos en dos idiomas y la forma de los módulos.

## Qué falta (lo próximo)

- Lote 3 a 5 de la Fase 3: PR 3.10, 3.11, 3.17 y, después, 3.10b y 3.19 (`docs/PROMPTS.md` §7).
- Nutrición e IA, después de la Fase 4 (D-ideas-1, Gemini Flash Lite por API de pago). Pruebas gratuitas del coach en la Fase 5 (D-ideas-5).
- Publicar la web (P-03) sigue pendiente. Textos legales definitivos antes del primer usuario real (D-060).
- Las guardas por sesión y por rol son comodidad, no seguridad: los datos los protege el RLS.

## Últimos cambios

Los 5 más recientes, el más nuevo arriba. El historial completo está en `docs/ESTADO.md` y en `docs/cambios/`.

- 2026-11-24 — Cierre del lote 3 (solo documentación, `docs/cambios/docs-resumen-lote-3.md`): se resumen 3.7 a 3.9b y el rediseño UX 1 a 4 en CONTEXTO y ESTADO, y se marcan lo fusionado en PROMPTS §7.
- 2026-11-24 — PR 3.9b (#103): peso corporal, medidas y lastre con total (D-3.9b-1 a 7).
- 2026-11-23 — PR 3.8 (#101): unilaterales, superseries, cambiar y saltar ejercicio (D-3.8-1 a 5). PR 3.9a (#102): consentimiento de datos de salud (D-3.9a-1 a 4).
- 2026-11-22 a 23 — Rediseño UX 1 a 4 (#93 a #96, D-ux1-1 a D-ux4-1) y arreglo del e2e de bloques (#97).

## A tener en cuenta ahora

- El proyecto vive en `C:\dev\athlete-core`, **fuera de OneDrive** (sincronizar `node_modules` da errores).
- Se usa **TypeScript 6**, no 7: el lint de TypeScript aún no admite la 7 (DECISIONES D-022).
- `main` no está protegida en GitHub: hace falta GitHub Pro (GUIA-GIT §12).
- Los agentes fusionan solos (D-148): Claude sus PR con el CI en verde; Gemini los suyos con el comentario "VISTO BUENO DE CLAUDE". Lo crítico (producción, borrar datos, relajar RLS o permisos, pagos, secretos, historial, reglas de oro) necesita el OK del propietario escrito en el prompt.
- Supabase en plan gratuito (D-063): sin copias de seguridad recuperables. Resend gratuito: 100 emails al día.
- **Si staging deja de responder**, lo más probable es que Supabase lo haya pausado por una semana sin uso. Se reanuda en el panel con **Restore project** (`supabase/README.md`, paso 6).
- Con varios worktrees, los contenedores de Supabase guardan la carpeta que los creó; si se borra, ver `docs/cambios/3.9a-consentimiento-salud.md`.
- El identificador de la app móvil (`app.athletecore.mobile`) es provisional: hay que fijarlo antes de publicar en las tiendas.
- Las ideas de `docs/referencia/ideas-de-negocio.md` **no son decisiones**: lo decidido está en D-132 a D-134 y en `docs/cambios/ideas-gemini-decisiones.md`.

## Para saber más

| Necesito… | Archivo |
|---|---|
| Las reglas y normas de código | `AGENTS.md` |
| Saber dónde va cada cosa | `docs/ARQUITECTURA.md` |
| Hacer un cambio con Git | `docs/GUIA-GIT.md` |
| El estado detallado y las fases | `docs/ESTADO.md` |
| El porqué de una decisión | `docs/DECISIONES.md` (hasta D-153) y `docs/cambios/` (desde D-153) |
| Una plantilla de prompt | `docs/PROMPTS.md` |
