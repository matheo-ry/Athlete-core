# UX 4 — Pantallas de acceso

- **Fecha:** 2026-11-23
- **PR:** pendiente (rama `feat/ux-4-acceso`, apilada sobre UX 3 `feat/ux-3-coach`)

## Qué cambió

Último lote del rediseño (D-ux1-3): las pantallas sin sesión y las de después de entrar usan el sistema de UX 1. No cambian la lógica, los datos ni los textos.

- **Primera pantalla** (`/start`): el motivo de órbita de la app con una mancuerna, el título en grande ("Entrena con tu coach") y el campo del código centrado, en mono y espaciado; "Continuar" de 56 px.
- **Marco público**: más aire, y el contenido entra con un ascenso.
- **Unirse** (`/join`): la vista previa del coach en una tarjeta teñida con su marca, con su logo grande; "Crear cuenta" y "Unirme" de 56 px.
- **Entrar, alta, código por email, nueva contraseña, verificar, crear negocio, bienvenida, elegir espacio y textos legales**: títulos grandes con su subtítulo separado, avisos como superficie, la acción principal de 56 px y a todo lo ancho, el código de 6 dígitos en grande y el aviso de borrador legal como chip.
- **Error de ruta**: sin fondo propio, con el resplandor de la marca.

## Decisiones

### D-ux4-1 · Rama apilada sobre UX 3
- **Decisión:** UX 4 sale de `feat/ux-3-coach` y su PR apunta a esa rama.
- **Por qué:** el rediseño va en cuatro PR apilados (#93, #94, #95 y este); se fusionan en orden y cada uno se retarga a `main` al fusionar el anterior.

## Lo que debe saber el siguiente

- El rediseño queda completo en los cuatro lotes. Resumen de las piezas: `docs/cambios/ux-1-sistema-de-diseno.md` (y `src/core/ui/README.md`).
- `program-blocks.spec.ts` › "añade bloques, les pone duración…" es inestable: en local pasa unas veces y otras no (al pulsar "Change" el ciclo no siempre pasa a 8 días antes del paso siguiente). `docs/ESTADO.md` ya lo tenía anotado como uno que en el CI pasó al segundo intento; el CI lo reintenta una vez. En esta pasada falló 3 de 4 veces en local; no se ha aislado si el rediseño lo empeora.
- La primera pasada completa de los e2e tuvo 7 fallos con el ordenador cargado (dos servidores de Vite abiertos); al repetir, pasan todos salvo el anterior.

## Deuda

- Hacer estable `program-blocks.spec.ts` (esperar a que el ciclo cambie antes de escribir las vueltas).
- La primera pantalla podría llevar una ilustración propia de la plataforma en vez del motivo de órbita; queda para cuando haya identidad de marca definitiva.
