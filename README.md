# ATHLETE CORE

App para coaches de gimnasio y sus clientes. Una sola app (web, iOS y Android): el coach crea rutinas y sigue a sus clientes; el cliente entra con el código de su coach, ve su marca y registra sus entrenos.

## Por dónde empezar

| Si eres… | Lee |
|---|---|
| Nuevo en el proyecto | `EMPEZAR-AQUI.md` |
| Alguien que empieza un chat nuevo con una IA | `CONTEXTO.md` |
| Un agente de IA | `CONTEXTO.md` y `AGENTS.md` |
| Alguien que va a hacer un cambio | `docs/GUIA-GIT.md` |
| Alguien que no sabe dónde va un archivo | `docs/ARQUITECTURA.md` |

## Documentación

| Archivo | Qué contiene |
|---|---|
| `CONTEXTO.md` | Resumen de la app y de sus últimos cambios, para cada chat nuevo |
| `AGENTS.md` | Reglas y normas de código |
| `docs/ARQUITECTURA.md` | Carpetas, módulos, perfiles, base de datos |
| `docs/GUIA-GIT.md` | Cómo se hace un cambio, paso a paso |
| `docs/ESTADO.md` | Qué está hecho, qué está en curso y qué toca |
| `docs/DECISIONES.md` | Decisiones tomadas y su porqué |
| `docs/PROMPTS.md` | Plantillas de prompt para los agentes |
| `docs/referencia/` | SQL de partida para la base de datos |

## Cómo arrancar el proyecto

### Qué necesitas instalado

| Qué | Versión | Para qué |
|---|---|---|
| **Node.js** | 24 (la que fija `.nvmrc`) | Ejecutar y compilar la app |
| **Git** | Cualquiera reciente | Guardar y subir los cambios |
| **GitHub CLI** (`gh`), opcional | Cualquiera reciente | Abrir Pull Requests desde la terminal |
| **Docker Desktop** | Desde la Fase 1 | Base de datos local (Supabase) |

### Primera vez

```bash
git clone https://github.com/TU-USUARIO/athlete-core.git
cd athlete-core
npm install        # instala las dependencias y las comprobaciones automáticas de Git
npm run dev        # arranca la app
```

Abre <http://localhost:5173>. No hace falta configurar nada más: en esta fase la app funciona con datos de ejemplo y sin base de datos.

- **Variables de entorno (opcional por ahora):** copia `.env.example` como `.env.local` y rellénalo. `.env.local` nunca se sube a Git. Serán obligatorias a partir de la Fase 1.
- **Carpeta del proyecto:** no la pongas dentro de OneDrive, Dropbox o similares. Sincronizar `node_modules` da errores al instalar.

### Qué vas a ver

Arriba aparece una barra de **herramientas de desarrollo** (solo existe en desarrollo, no en la app publicada):

- **Ver como:** cambia entre la zona del **coach** (`/coach`) y la del **cliente** (`/client`).
- **Marca:** cambia entre dos coaches de ejemplo, cada uno con sus colores, o elige **Sin coach** para ver la bienvenida que verá un usuario nuevo, con la marca de ATHLETE CORE.

El idioma (inglés o español) se cambia con los botones **English / Español** de cada pantalla. La entrada de menú **Template** es el módulo de ejemplo: tampoco llega a la app publicada.

### Comandos del día a día

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca la app en local |
| `npm run check` | Formato + lint + tipos + tests + build. **Tiene que pasar antes de pedir revisión** |
| `npm run test` / `npm run test:watch` | Tests unitarios (una vez / al guardar) |
| `npm run test:e2e` | Tests en un navegador de verdad. La primera vez: `npx playwright install chromium` |
| `npm run lint:fix` y `npm run format` | Arreglan solos lo que se puede arreglar de estilo y formato |
| `npm run new:module <nombre>` | Crea un módulo nuevo a partir de `src/modules/_template` |

La lista completa está en `docs/ARQUITECTURA.md` §13. Los comandos `db:*` (base de datos local) llegan en la Fase 1.

### Si algo falla

| Problema | Qué hacer |
|---|---|
| El commit es rechazado | Lee el mensaje: o el formato del mensaje no es `tipo(ámbito): descripción`, o el lint ha encontrado algo. Se arregla; no se salta |
| No me deja subir la rama | O estás intentando subir `main` (usa una rama), o `npm run check` ha fallado |
| `npm install` da errores de permisos o de archivos bloqueados | Comprueba que la carpeta no está dentro de OneDrive y cierra el servidor de desarrollo |
| "Import prohibido por las fronteras…" | Estás importando algo que la arquitectura no permite. Mira `docs/ARQUITECTURA.md` §6 |

Más casos en `docs/GUIA-GIT.md` §11.

## Dónde va cada cosa

```
src/core/      Cimientos que usan todas las funciones (zona protegida)
src/modules/   Las funciones de la app: una carpeta por función
src/app/       Arranque, rutas y la carcasa de coach y de cliente
supabase/      Base de datos (desde la Fase 1)
e2e/           Tests en navegador
scripts/       Scripts de ayuda
```

Cada carpeta tiene un `README.md` corto que dice qué va dentro y qué no. El detalle está en `docs/ARQUITECTURA.md`.
