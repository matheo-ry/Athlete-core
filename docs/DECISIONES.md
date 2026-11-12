# DECISIONES

Registro de decisiones del proyecto y su porqué. Antes de proponer cambiar algo, mira si ya se decidió aquí.

Cómo añadir una: copia el formato, usa el siguiente número y no borres las antiguas. Si una decisión cambia, se añade una nueva que diga "sustituye a D-0XX".

---

## Decisiones tomadas

### D-001 · Una sola app para web, iOS y Android
- **Fecha:** 2026-11-12
- **Decisión:** un repositorio y un solo código con React + Vite + TypeScript, empaquetado para móvil con Capacitor.
- **Por qué:** equipo pequeño; un solo código que mantener y una sola publicación por tienda.
- **Revisar si:** Capacitor limita una función nativa imprescindible.

### D-002 · Supabase como backend
- **Fecha:** 2026-11-12
- **Decisión:** Postgres, Auth, Storage y Edge Functions de Supabase.
- **Por qué:** RLS permite aislar los datos de cada coach en la propia base de datos; sin servidor propio que mantener.
- **Revisar si:** costes o límites lo hacen inviable.

### D-003 · Una carpeta por función
- **Fecha:** 2026-11-12
- **Decisión:** cada función vive en `src/modules/<función>/` con una forma fija (ARQUITECTURA §5).
- **Por qué:** cambios pequeños y localizados, fáciles de revisar y de deshacer; los agentes leen menos código; el colaborador puede trabajar sin tocar `core/`.
- **Revisar si:** los módulos empiezan a necesitarse entre sí constantemente.

### D-004 · Dos perfiles dentro de la misma app
- **Fecha:** 2026-11-12
- **Decisión:** coach y cliente comparten app y login. Cada perfil tiene su carcasa (`app/coach`, `app/client`) y sus pantallas dentro de cada módulo (`coach/`, `client/`).
- **Por qué:** una sola app que publicar y mantener; lógica y datos compartidos por función.
- **Revisar si:** el panel del coach crece tanto que conviene una web aparte.

### D-005 · Multi-tenant por fila
- **Fecha:** 2026-11-12
- **Decisión:** todas las tablas de negocio llevan `tenant_id`, RLS y claves foráneas compuestas. Los permisos se conceden de forma explícita, tabla a tabla.
- **Por qué:** el aislamiento no depende de que el código de la app esté bien escrito.
- **Revisar si:** nunca. Es la regla que no se negocia.

### D-006 · El cliente se une con un código del coach
- **Fecha:** 2026-11-12
- **Decisión:** una sola app en las tiendas. El cliente escribe el código de su coach y ve su marca dentro de la app. Las altas pasan por funciones de la base de datos que comprueban el límite del plan.
- **Por qué:** una publicación en vez de una por coach; sin problemas con las normas de las tiendas sobre apps duplicadas.
- **Revisar si:** los coaches piden app propia en la tienda (sería un plan superior).

### D-007 · Inglés y español desde el primer día
- **Fecha:** 2026-11-12
- **Decisión:** todos los textos pasan por i18next, con `en` y `es`.
- **Por qué:** validar con coaches cercanos en español y vender fuera en inglés con la misma app. Añadir idiomas después es barato; sacar textos escritos directamente en el código es caro.

### D-008 · Primera versión para coaches de gym con foco en fuerza
- **Fecha:** 2026-11-12
- **Decisión:** rutinas, cargas, RM, RPE y progreso.
- **Por qué:** es lo que el equipo conoce y practica; deja la puerta abierta a powerlifting o a entrenamiento híbrido.
- **Revisar si:** las entrevistas con coaches señalan un nicho más concreto.

### D-009 · Código en inglés; documentación y commits en español
- **Fecha:** 2026-11-12
- **Por qué:** el inglés es el estándar del código y de las librerías; el equipo lee y decide mejor en español.

### D-010 · Unidades y formatos
- **Fecha:** 2026-11-12
- **Decisión:** pesos en kg en la base de datos (se muestran en kg o lb), fechas en UTC, dinero en céntimos con su moneda.
- **Por qué:** se vende en países que usan libras; guardar una sola unidad evita errores de conversión.

### D-011 · npm como gestor de paquetes
- **Fecha:** 2026-11-12
- **Por qué:** viene con Node; nada más que instalar ni que aprender.

### D-012 · Flujo de Git
- **Fecha:** 2026-11-12
- **Decisión:** `main` protegida, una rama por tarea, Pull Request, CI obligatorio, "squash merge" y Conventional Commits en español (GUIA-GIT.md).
- **Por qué:** todo cambio queda registrado y se puede deshacer; el trabajo del colaborador y de los agentes siempre pasa por revisión.

### D-013 · Tres entornos
- **Fecha:** 2026-11-12
- **Decisión:** local (Supabase local con Docker), staging y producción. Solo el propietario accede a producción.
- **Por qué:** los agentes pueden recrear y probar la base de datos sin riesgo.
- **Revisar si:** Docker da demasiados problemas en Windows. Alternativa: desarrollar contra staging.

### D-014 · Interfaz con Tailwind y componentes propios
- **Fecha:** 2026-11-12
- **Decisión:** Tailwind CSS y componentes base en `core/ui`, pintados con variables de tema. Se puede partir de componentes de shadcn/ui copiados a `core/ui`. Iconos con lucide-react.
- **Por qué:** el tema por variables es justo lo que necesita la marca de cada coach. Un único juego de iconos evita mezclar estilos.
- **Revisar si:** el juego de iconos se queda corto para el gimnasio (faltan iconos de material o ejercicios).

### D-015 · Estado con TanStack Query y contextos
- **Fecha:** 2026-11-12
- **Decisión:** TanStack Query para datos del servidor; contextos de `core/` para sesión, tenant, idioma y tema. Sin Redux.
- **Por qué:** menos piezas; casi todo el estado de la app son datos del servidor.

### D-016 · Sin desarrollo a medida por cliente
- **Fecha:** 2026-11-12
- **Decisión:** lo que pida un coach se construye como módulo o ajuste genérico, activable con un flag. Nunca código para un coach concreto.
- **Por qué:** una sola base de código que mantener con poco tiempo disponible.

### D-017 · Planes y límites provisionales
- **Fecha:** 2026-11-12
- **Decisión:** `free` (3 clientes), `starter` (10), `pro` (30) y `studio` (sin límite). El límite se comprueba en la base de datos.
- **Revisar si:** siempre que se cambien los precios. Son valores de partida.

### D-018 · Dependencias entre módulos
- **Fecha:** 2026-11-12
- **Decisión:** un módulo solo puede usar a otro a través de su `index.ts` y si está en la tabla de ARQUITECTURA §6. Iniciales: `programs → exercises`; `workouts → programs, exercises`; `progress → workouts, exercises`.
- **Por qué:** las rutinas necesitan ejercicios; prohibirlo del todo obligaría a duplicar. Limitarlo a una dirección evita enredos.

### D-019 · Cómo se decide un feature flag
- **Fecha:** 2026-11-12
- **Decisión:** interruptor general del flag → excepción del tenant (si no ha caducado) → tipo del flag y plan (ARQUITECTURA §9). Los flags `core` y `kill_switch` están activos por defecto; `addon` y `release`, no.
- **Por qué:** un módulo nuevo de tipo `core` funciona para todos sin tener que apuntarlo en cada plan, y cualquier función se puede apagar para todos sin desplegar.

### D-020 · Cambios de plan antes de que existan los pagos
- **Fecha:** 2026-11-12
- **Decisión:** hasta la Fase 5, el plan de un coach lo cambia el propietario a mano en la base de datos. El coach no puede cambiarlo desde la app.
- **Por qué:** permite dar planes de fundador a los primeros coaches sin construir todavía los pagos.

---

## Pendientes de decidir

| Nº | Qué | Cuándo hay que decidirlo |
|---|---|---|
| P-01 | Nombre de la app y dominio | Antes de la Fase 1 (sustituir `[NOMBRE_APP]`) |
| P-02 | Nicho definitivo tras hablar con coaches | Antes de la Fase 2 |
| P-03 | Hosting de la web: Vercel o Cloudflare Pages. Comprobar en ambos el coste con dos personas subiendo código y las condiciones de uso comercial | Antes de enseñar la app a coaches |
| P-04 | Biblioteca global de ejercicios: cómo conviven los ejercicios de la plataforma con los propios de cada coach | Fase 2 |
| P-05 | Pagos: proveedor para la suscripción del coach, cobros del coach a sus clientes y dónde se contrata (web o app, según las normas de las tiendas) | Fase 5 |
| P-06 | Modo sin conexión para registrar entrenos | Tras los primeros pilotos |
| P-07 | Notificaciones push | Fase 4 |
| P-08 | Servicio para compilar iOS en la nube | Fase 4 |
| P-09 | Cómo se entra: email y contraseña, enlace por email o cuenta de Google/Apple; y si se exige confirmar el email al registrarse. Antes de ofrecer el acceso con Google, comprobar qué exige Apple a las apps que usan accesos de terceros | Antes del segundo PR de la Fase 1 |
| P-10 | Servicio de avisos de errores y de caídas | Fase 4 |

---

## Versiones instaladas

(Se rellena al terminar la Fase 0: Node, React, Vite, TypeScript, Tailwind, React Router, TanStack Query, Supabase, Capacitor…)
