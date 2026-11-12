# PROMPTS

Plantillas para pedir trabajo a los agentes de IA. Copia, rellena los huecos entre corchetes y pega.

El prompt de la Fase 0 está en `EMPEZAR-AQUI.md`.

---

## 0. Empezar y cerrar un chat

**Regla:** un chat nuevo por cada tarea (= una rama = un PR). En el mismo chat solo se sigue mientras se trabaja en esa misma tarea, por ejemplo para corregir lo que salió en la revisión.

### Al abrir un chat nuevo

Pega esto y, debajo, la tarea (con la plantilla §1, §2 o §3):

```
Chat nuevo. Antes de nada lee CONTEXTO.md y AGENTS.md, y los documentos
que indica AGENTS.md §2 si la tarea los necesita. Resúmeme en 3 líneas en
qué punto está el proyecto y luego empieza con esta tarea:

[pega aquí la tarea]
```

Si aún no tienes la tarea clara, pega solo las 3 primeras líneas y pregúntale qué toca según `docs/ESTADO.md`.

### Antes de cerrar un chat

```
Antes de cerrar este chat comprueba que:
1. CONTEXTO.md y docs/ESTADO.md reflejan lo que hemos hecho (fase,
   última tarea, siguiente tarea y últimos cambios).
2. git status está limpio y todo está subido.
Si falta algo, hazlo en esta misma rama con un commit. Después dime en
3 líneas qué queda pendiente para el próximo chat.
```

### Revisión cruzada

Si una tarea la ha hecho Claude, pide a Gemini que revise el PR con la plantilla §4 (o al revés), cada uno en su chat. Nunca dos agentes escribiendo a la vez en la misma rama.

---

## 1. Plantilla para cualquier tarea

```
Lee AGENTS.md y docs/ESTADO.md antes de empezar. Sigue docs/GUIA-GIT.md.

TAREA: [qué hay que conseguir, en una o dos frases]
MÓDULO: [carpeta de src/modules/ afectada, o "core" si aplica]
RAMA: [tipo/descripcion-corta]

QUÉ DEBE PASAR AL TERMINAR (criterios de aceptación):
1. [Como coach, puedo …]
2. [Como cliente, veo …]
3. [Caso límite: si no hay datos, se muestra …]

FUERA DE ALCANCE (no lo hagas):
- [lo que no quiero que toque]

Si te falta algo importante para empezar, pregúntamelo todo junto ahora.
Si no, trabaja de forma autónoma hasta terminar, con commits pequeños.
Termina como indica AGENTS.md §8: npm run check en verde, docs/ESTADO.md
actualizado, git status limpio, PR abierto y un resumen con cómo probarlo.
```

Consejos:

- Una tarea = un PR de unas 300 líneas como máximo. Si es más grande, divídela antes de pedirla.
- Los criterios de aceptación son lo más importante del prompt. Escríbelos como cosas que se puedan comprobar mirando la app.
- Toda tarea debe salir de algo que haya pedido un coach o de una fase de `docs/ESTADO.md`.

---

## 2. Arreglar un fallo

```
Lee AGENTS.md. Sigue docs/GUIA-GIT.md.

FALLO: [qué pasa]
CÓMO REPRODUCIRLO: [pasos exactos, con qué perfil y en qué pantalla]
QUÉ DEBERÍA PASAR: [comportamiento correcto]
RAMA: fix/[descripcion-corta]

Primero escribe un test que falle por culpa de este fallo. Después arréglalo
con el cambio más pequeño posible. No toques nada que no tenga que ver.
Explícame la causa en dos frases.
```

---

## 3. Crear un módulo nuevo

```
Lee AGENTS.md, docs/ARQUITECTURA.md (§5, §6, §8 y §15) y docs/ESTADO.md.

TAREA: crear el módulo [nombre] — [qué función aporta].
RAMA: feat/modulo-[nombre]

Antes de programar, entrégame un diseño corto y espera mi OK:
1. Pantallas del coach y pantallas del cliente (lista con una línea cada una).
2. Tablas nuevas, con sus columnas y quién puede leer y escribir cada una.
3. De qué otros módulos depende (ARQUITECTURA §6).
4. En cuántos PR lo dividirías y en qué orden.

Después del OK, sigue ARQUITECTURA §15, empezando por el primer PR.
```

---

## 4. Revisar un Pull Request

Sirve para revisar el trabajo del colaborador o de otro agente antes de aprobarlo.

```
Revisa el Pull Request [número o enlace] contra AGENTS.md y docs/ARQUITECTURA.md.
No cambies código: solo revisa.

Dime, por orden de gravedad:
1. Seguridad: tablas sin tenant_id, sin RLS o sin test de aislamiento; secretos;
   uso de la clave service_role; permisos que solo se comprueban en la pantalla.
2. Reglas rotas: fronteras entre módulos, textos sin i18n, código para un
   cliente concreto, dependencias nuevas sin anotar, trampas con tests o lint.
3. Fallos probables: casos límite, estados de carga, vacío y error.
4. Cosas que sobran: cambios que no pedía la tarea.

Para cada punto: archivo, línea, por qué es un problema y cómo arreglarlo.
Acaba con un veredicto: "listo para fusionar", "cambios pequeños" o "rehacer".
```

---

## 5. Fase 1 — Cuentas, negocio del coach y unirse con código

Es una fase grande: va en varios PR. Pídelos de uno en uno.

Antes de empezar:

- Instala **Docker Desktop** y déjalo abierto: Supabase local lo necesita.
- Decide el nombre de la app (DECISIONES, P-01) y sustituye `[NOMBRE_APP]`.

### PR 1.1 — Base de datos

```
Lee AGENTS.md, docs/ARQUITECTURA.md §8 y §9, docs/GUIA-GIT.md §9 y
docs/referencia/ (los tres archivos).

TAREA: poner en marcha la base de datos del proyecto.
RAMA: db/esquema-base

1. Configura Supabase local y los comandos db:start, db:stop, db:reset,
   db:test y db:types de ARQUITECTURA §13.
2. Convierte docs/referencia/esquema-base.sql en la primera migración.
   Valora activar el bloque OPCIONAL de privilegios por defecto y demuestra
   con un test que una tabla nueva sin "grant" no es accesible.
3. Convierte los casos de docs/referencia/pruebas-aislamiento.sql en tests
   pgTAP dentro de supabase/tests/. Deben pasar todos.
   No incluyas las tablas de ejemplo de plantilla-tabla-negocio.sql.
4. Crea supabase/seed.sql con datos inventados: 2 coaches y 5 clientes.
5. Genera los tipos en src/core/supabase/database.types.ts.
6. Añade al CI: base de datos local, migraciones, tests y la comprobación
   de que ninguna tabla pública está sin RLS.

El catálogo de flags (tabla features) empieza vacío: el flag de cada
módulo se añade cuando se crea ese módulo (ARQUITECTURA §15).
No crees pantallas en este PR.
```

### PR 1.2 en adelante

Usa la plantilla de tarea (§1) con cada punto de la Fase 1 de `docs/ESTADO.md`, en este orden:

1. Cliente de Supabase, sesión, registro, login y recuperar contraseña. Antes de pedirlo, decide cómo se entra y si se confirma el email (DECISIONES, P-09) y díselo al agente en el prompt.
2. Pantalla de bienvenida, crear negocio y guardas de ruta por rol. Aquí `core/tenancy` deja de usar datos de ejemplo y lee el tenant y el rol reales.
3. Unirse con código o con enlace (`/join?code=…`), con vista previa del coach.
4. Marca del coach aplicada al tema, y ajustes del coach (nombre, logo, colores, código). El logo va en Storage, en una ruta que empiece por el `tenant_id` y con sus políticas.
5. Perfil del usuario (nombre, idioma, unidad de peso).
6. Módulo `clients`: lista de clientes y archivar. Incluye la migración que añade su flag.

En cada uno, escribe tú los criterios de aceptación: qué debe poder hacer el coach, qué debe ver el cliente y qué pasa en los casos límite (código equivocado, plan lleno, sin conexión).
