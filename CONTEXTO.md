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

- **Tecnología:** React + Vite + TypeScript, Tailwind, TanStack Query, Zod, i18next, Supabase (Postgres con RLS), Capacitor para móvil.
- **Carpetas:** `src/core/` (cimientos, zona protegida), `src/modules/<función>/` (una carpeta por función), `src/app/` (rutas y carcasas de coach y cliente).
- **Seguridad:** toda tabla de negocio lleva `tenant_id` y RLS. Lo delicado (crear negocio, unirse con código) va por funciones de la base de datos.
- **Git:** una tarea = una rama = un Pull Request. Commits en Conventional Commits, en español.

## Dónde estamos

- **Fase actual:** 3 — Entreno y progreso, casi terminada (diseño en D-115 a D-136). Las Fases 1 y 2 están terminadas.
- **Lote 3 casi cerrado:** fusionados 3.7 (#90), 3.8 (#101), 3.9a (#102), 3.9b (#103) y 3.10 (#105). Queda el 3.10b (nota final del entreno, D-ideas-10).
- **Lote 4 (el coach):** 3.12 (#91), 3.13 y 3.14 terminados.
- **Lote 5 (progreso):** 3.15, 3.16, 3.17 (#107) y 3.18 terminados. Falta el 3.19 (calentamiento).
- **Rediseño UX 1 a 5:** fusionado en #93 a #96 y #108. Sistema visual cálido, tipografía propia y ajustes de la revisión visual del propietario.
- **Última tarea terminada:** rediseño UX 5 (#108, 2026-11-24). Antes, PR 3.17 (#107), 3.11 (#106) y 3.10 (#105).
- **Siguiente tarea:** **diseño de la Fase 4 — Pilotos** (todavía sin diseñar). Antes, si el propietario lo pide, el PR 3.10b (migración `workouts.note`). Después, el 3.19 (migración `is_warmup`). Ambos en `docs/PROMPTS.md` §7.
- **Decisiones pendientes de la Fase 3:** D-ideas-10 (PR 3.10b) y D-ideas-2 (PR 3.19, sustituye en parte a D-119).

## Cómo será la Fase 3 (diseñada, D-115 a D-136)

- **Entrenar, solo en la app del móvil** (Android desde el 3.1a; iOS, en la Fase 4). Todo se guarda en el teléfono al instante y se sube solo (D-118).
- **Apuntar:** un ejercicio por pantalla; peso, repeticiones y RIR o RPE; la vez anterior en gris y "Igual". Unilaterales, superseries, cambiar o saltar (3.8). Notas del día y set-up (3.10).
- **Cerrar:** cierre solo, "Terminar", "Descartar", resumen final; recordatorio a las 6 horas y cierre a las 12; "Seguir aquí" entre dos móviles (3.6a-c).
- **Cronómetro** con alarma con la pantalla apagada (3.7). **Datos de salud:** un consentimiento por espacio (D-126); peso y medidas en `/client/body` (3.9a/b).
- **Historial:** "Mis entrenos" y corregir un entreno cerrado durante 7 días (3.11).
- **Logros:** minilogros, racha y niveles calculados sin tablas nuevas; el coach puede desactivarlos (3.17, D-3.17-1 a 3).
- **Día saltado:** tres reglas que elige el coach (3.12). **El coach** ve la actividad, los entrenos y los avisos de cada cliente.
- **Progreso:** historial, RM estimado, récords, gráficas y Excel.

## Qué existe ya

- **Cuentas y espacios (Fase 1, hecha):** registro con código de 6 dígitos, contraseña o código, recuperar contraseña, dar de baja y reactivar clientes, varios espacios, marca del coach y unirse con código.
- **Ejercicios y rutinas (Fase 2, hecha):** 120 ejercicios, editor de rutinas con bloques, superseries, sustituir y copiar; asignar a clientes.
- **Entrenos y salud en la base de datos:** `workouts`, `workout_exercises`, `workout_sets`, `sync_workout`, `discard_workout`, `body_weights`, `body_measurements`, `health_consents`, `program_missed_days` y `client_exercise_setups`.
- **Base de datos local:** migraciones en `supabase/migrations/`; tests pgTAP (`npm run db:test`); 2 coaches y 6 clientes inventados (`supabase/seed.sql`, contraseña `password123`).
- **Tests:** unitarios (`npm run check`) y e2e contra Supabase local (`npm run test:e2e`, también en el CI), más "Tests de flujos completos".
- **Staging:** proyecto `athlete-core-staging` con los mismos datos inventados. Emails por Resend. Se prueba con `npm run dev:staging`.
- **Guardado en el móvil:** almacén, cola de subida y `workouts` sin conexión (3.4a y 3.4b, D-143).

## Qué falta (lo próximo)

- Fase 3: PR 3.10b (nota final) y PR 3.19 (calentamiento), `docs/PROMPTS.md` §7.
- **Fase 4 — Pilotos:** diseño pendiente. Incluye iOS (D-116).
- Nutrición e IA, después de la Fase 4 (D-ideas-1). Pruebas gratuitas del coach en la Fase 5 (D-ideas-5).
- Publicar la web (P-03) sigue pendiente. Textos legales definitivos antes del primer usuario real (D-060).
- Las guardas por sesión y por rol son comodidad, no seguridad: los datos los protege el RLS.

## Últimos cambios

Los 5 más recientes, el más nuevo arriba. El historial completo está en `docs/ESTADO.md` y en `docs/cambios/`.

- 2026-11-24 — Rediseño UX 5 (#108): ajustes de la revisión visual del propietario (D-ux5-1 y D-ux5-2).
- 2026-11-24 — PR 3.17 (#107): minilogros, racha, niveles y logros (D-3.17-1 a 3). PR 3.11 (#106): historial y corregir (D-3.11-1 a 3). PR 3.10 (#105): notas del día y set-up (D-3.10-1 a 3).
- 2026-11-24 — PR 3.9b (#103): peso corporal, medidas y lastre con total (D-3.9b-1 a 7). PR 3.9a (#102): consentimiento de datos de salud.
- 2026-11-23 — PR 3.8 (#101): unilaterales, superseries, cambiar y saltar ejercicio (D-3.8-1 a 5).

## A tener en cuenta ahora

- El proyecto vive en `C:\dev\athlete-core`, **fuera de OneDrive** (sincronizar `node_modules` da errores).
- Se usa **TypeScript 6**, no 7: el lint de TypeScript aún no admite la 7 (DECISIONES D-022).
- `main` no está protegida en GitHub: hace falta GitHub Pro (GUIA-GIT §12).
- Los agentes fusionan solos (D-148): Claude sus PR con el CI en verde; Gemini los suyos con el comentario "VISTO BUENO DE CLAUDE". Lo crítico necesita el OK del propietario escrito en el prompt.
- Supabase en plan gratuito (D-063): sin copias de seguridad recuperables. Resend gratuito: 100 emails al día.
- **Si staging deja de responder**, Supabase lo ha pausado por inactividad. Se reanuda en el panel con **Restore project** (`supabase/README.md`, paso 6).
- Con varios worktrees, los contenedores de Supabase guardan la carpeta que los creó; si se borra, ver `docs/cambios/3.9a-consentimiento-salud.md`.
- El identificador de la app móvil (`app.athletecore.mobile`) es provisional: hay que fijarlo antes de publicar en las tiendas.
- Deuda: claves i18n sin uso `app.clientHome.coachLabel` y `app.coachHome.businessLabel` (UX 5).
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
