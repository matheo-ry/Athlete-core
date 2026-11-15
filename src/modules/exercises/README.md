# Módulo `exercises`

- **Qué hace:** la biblioteca de ejercicios del coach (DECISIONES D-071 a D-073). En `/coach/exercises`: la lista por orden alfabético, con el grupo muscular, el material y las etiquetas "Unilateral" y "Propio"; pestañas "Activos" y "Archivados" con su número; buscador por nombre sin tildes ni mayúsculas; filtros de grupo, material y origen ("Todos", "Míos", "De la plataforma"), que se combinan entre sí y con el buscador.
- **Nombre en el idioma de quien mira:** un ejercicio del catálogo al que el coach no ha cambiado el nombre (`name` vacío) se ve en inglés o en español según el idioma de la app (D-071). Se cargan los dos nombres del catálogo, así que cambiar de idioma no vuelve a pedir nada.
- **La búsqueda y los filtros se hacen en la app**, sobre la lista ya cargada (D-073), en `model/exercise-list.ts`. El número de cada pestaña es el total, sin contar la búsqueda ni los filtros.
- **Datos:** `exercises` (los del negocio) con el nombre de `exercise_library` (el catálogo), en `api/exercises-api.ts`. El RLS solo deja leerlos al coach (owner y staff). La API devuelve 1.000 filas como mucho: se piden primero los activos, que nunca pasan de 1.000 (D-086).
- **El cliente no ve nada de este módulo** todavía: verá los ejercicios dentro de su rutina (PR 2.15).
- **Flag:** `exercises` (tipo core, activo para todos), añadido en la migración `20261115120000_exercises_feature.sql`.
- **Estado:** solo lectura (PR 2.3). Crear, editar, archivar, recuperar y duplicar llegan en el PR 2.4.
