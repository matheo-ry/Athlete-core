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

Con **Docker Desktop abierto**:

```bash
git clone https://github.com/TU-USUARIO/athlete-core.git
cd athlete-core
npm install        # instala las dependencias y las comprobaciones automáticas de Git
npm run db:start   # arranca la base de datos local (la primera vez tarda unos minutos)
npm run db:reset   # la rellena con los usuarios inventados
npm run dev        # arranca la app
```

- **Variables de entorno (obligatorias):** copia `.env.example` como `.env.local` y pon los valores de `npx supabase status` (`API_URL` y `PUBLISHABLE_KEY`). `.env.local` nunca se sube a Git.
- **Carpeta del proyecto:** no la pongas dentro de OneDrive, Dropbox o similares. Sincronizar `node_modules` da errores al instalar.

### Qué vas a ver

Abre <http://localhost:5173> y entra con uno de los usuarios inventados de `supabase/seed.sql`. Todos tienen la contraseña `password123`:

| Usuario | Qué es |
|---|---|
| `coach.iron@example.com` | Coach de Iron Lab (rojo, fondo oscuro, plan lleno: 3 de 3). Además, clienta de Norte Strength: al entrar elige en cuál de los dos (`/select`) |
| `coach.norte@example.com` | Coach de Norte Strength (verde azulado, fondo claro, plan de 10) |
| `ana@`, `bruno@`, `carla@example.com` | Clientes de Iron Lab. Carla tiene la cuenta en español: al entrar, la app se pone en español |
| `diego@`, `elena@example.com` | Clientes de Norte Strength |
| `fran@example.com` | Dado de baja de Norte Strength |

Códigos de invitación: `IRONLAB1` (Iron Lab) y `NORTE001` (Norte Strength).

Los emails que manda la app no salen de tu ordenador: se ven en <http://127.0.0.1:54324>. La base de datos se ve en <http://127.0.0.1:54323>.

El idioma (inglés o español) se cambia con los botones **English / Español** de cada pantalla. Con la sesión abierta, el idioma se guarda en la cuenta (Perfil o Ajustes) y vale en todos los dispositivos. La entrada de menú **Template** es el módulo de ejemplo: no llega a la app publicada.

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
