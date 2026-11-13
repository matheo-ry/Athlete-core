# ESTADO DEL PROYECTO

**Última actualización:** 2026-11-13
**Fase actual:** 0 — Esqueleto (terminada el 2026-11-13; su Pull Request está pendiente de fusionar)

Este archivo lo actualiza quien termina una tarea, en el mismo Pull Request, junto con `CONTEXTO.md` (que resume este en una página).

## En curso

- Revisión y fusión del Pull Request de la Fase 0 (rama `chore/fase-0-esqueleto`). Lo fusiona el propietario.

## Siguiente

1. Fusionar el PR de la Fase 0 y, después, proteger `main` (`docs/GUIA-GIT.md` §12).
2. Instalar Docker Desktop (lo necesita la base de datos local).
3. Fase 1, PR 1.1 — Base de datos. El prompt está en `docs/PROMPTS.md` §5. En un chat nuevo.

## Fases

### Fase 0 — Esqueleto (sin funciones de producto) — ✅ terminada el 2026-11-13

- [x] Proyecto base (Vite + React + TypeScript estricto)
- [x] Estructura de carpetas de ARQUITECTURA §4 y §5
- [x] ESLint con fronteras, Prettier, Husky, lint-staged, commitlint
- [x] Comandos de npm de ARQUITECTURA §13
- [x] `core/` mínimo: config, i18n, ui, branding, lib, modules, flags y tenancy (con datos de ejemplo)
- [x] Carcasas de coach y de cliente, con selector de perfil solo en desarrollo
- [x] Módulo `_template` y `npm run new:module`
- [x] Tests configurados (Vitest y Playwright) con ejemplos reales
- [x] `supabase init` (sin tablas) y Capacitor configurado (sin plataformas)
- [x] CI en GitHub Actions
- [x] Versiones anotadas en DECISIONES.md

Además de lo previsto, a petición del propietario:

- [x] Cliente de Supabase en `core/supabase`, sin usar todavía (DECISIONES D-025)
- [x] Tests que vigilan las reglas: fronteras de arquitectura, textos en dos idiomas y forma fija de los módulos (DECISIONES D-024 y D-029)

### Fase 1 — Cuentas, negocio del coach y unirse con código

- [ ] Supabase local y primera migración a partir de `docs/referencia/esquema-base.sql`
- [ ] Tests de aislamiento (RLS) y comprobación en el CI
- [ ] Decidir cómo se entra y si se confirma el email (DECISIONES, P-09)
- [ ] Registro, login y recuperar contraseña
- [ ] Pantalla de bienvenida: "Soy coach" / "Tengo un código"
- [ ] Crear negocio, ver y regenerar el código de invitación
- [ ] Unirse con código o con enlace, con vista previa del coach
- [ ] Guardas de ruta por rol y selector de tenant
- [ ] Marca del coach: nombre, logo y colores aplicados al tema (el logo, en Storage con permisos por tenant)
- [ ] Perfil del usuario: nombre, idioma y unidad de peso
- [ ] Módulo `clients`: lista de clientes y archivar

### Fase 2 — Ejercicios y rutinas (coach)

- [ ] Módulo `exercises`: biblioteca y ejercicios propios
- [ ] Módulo `programs`: crear, editar, duplicar y asignar rutinas

### Fase 3 — Entreno y progreso (cliente)

- [ ] Módulo `workouts`: el cliente ve su rutina y registra series, cargas y RPE
- [ ] El coach revisa los entrenos de cada cliente
- [ ] Módulo `progress`: gráficas, RM estimado y récords
- [ ] Tests de flujos completos en el CI

### Fase 4 — Pilotos

- [ ] Proyectos nativos de Android e iOS
- [ ] Compilación de iOS en la nube y TestFlight
- [ ] Publicación de la web
- [ ] Avisos de errores y de caídas
- [ ] Borrar la cuenta desde dentro de la app (lo piden las tiendas) y que un cliente pueda darse de baja de un coach
- [ ] Textos legales: privacidad, términos y reembolsos
- [ ] Cuentas de desarrollador de Apple y de Google (comprobar los requisitos de prueba previa de Google Play y empezar pronto)
- [ ] 3–5 coaches piloto usando la app

### Fase 5 — Planes y pagos

- [ ] Suscripción del coach y límites por plan
- [ ] Cobros del coach a sus clientes

## Bloqueos y dudas abiertas

- El nombre ya está decidido: ATHLETE CORE (DECISIONES D-021). La sustitución de `[NOMBRE_APP]` en `AGENTS.md` y `docs/ARQUITECTURA.md` está en el PR 2, pendiente de fusionar.
- Falta el dominio de la web (DECISIONES, P-01).
- Antes del PR 1.2 hay que decidir cómo se entra y si se confirma el email (DECISIONES, P-09).
- El PR 2 renombra `.github/CODEOWNERS.txt` a `CODEOWNERS` y corrige el usuario. Proteger `main` (GUIA-GIT §12) no es posible todavía: en un repositorio privado GitHub lo exige de pago (GitHub Pro, gratis con el Student Developer Pack). Mientras tanto protege el hook local que bloquea subir a `main`. Ya está activo: solo "Squash merge" y borrar la rama al fusionar.

## Ideas y deuda

Cosas que alguien ha visto y que no tocaban en su tarea. No se hacen sin convertirlas antes en tarea.

- Limitar los intentos fallidos al escribir un código de invitación (por usuario).
- Que el coach pueda apagar desde sus ajustes las funciones que no use (ARQUITECTURA §9).
- Alta de un segundo coach (`staff`) en el mismo negocio.
- Pasar a TypeScript 7 cuando el lint de TypeScript lo admita (DECISIONES D-022).
- Detectar con lint los textos escritos directamente en un componente (AGENTS.md, regla 7). Hoy se revisa a mano. Haría falta una librería nueva.
- Añadir reglas de accesibilidad al lint (etiquetas, botones de verdad). Haría falta una librería nueva.
- Test de fronteras: añadir el caso permitido de la tabla de dependencias entre módulos cuando existan dos módulos reales (`programs` → `exercises`).
- Zod ocupa buena parte del peso de la app. Si el tamaño llega a importar, valorar su variante ligera.
- Recordar la última elección del selector de desarrollo al recargar la página (hoy vuelve al primer coach de ejemplo).

## Registro de cambios

Lo más nuevo, arriba.

- 2026-11-13 — Fase 0 terminada: proyecto base, estructura de carpetas, calidad (ESLint con fronteras, Prettier, hooks de Git), `core/` mínimo con datos de ejemplo, carcasas de coach y de cliente, módulo `_template`, tests (Vitest y Playwright), `supabase init`, Capacitor y CI. Versiones y decisiones en `docs/DECISIONES.md` (D-021 a D-031).
- 2026-11-12 — Nombre de la app decidido: ATHLETE CORE (DECISIONES D-021).

- 2026-11-12 — Añadido `CONTEXTO.md` (resumen para cada chat nuevo) y la forma de trabajar con chats (`EMPEZAR-AQUI.md` Parte 3, `docs/PROMPTS.md` §0).
- 2026-11-12 — Kit inicial: reglas, arquitectura, guía de Git y esquema base de referencia.
