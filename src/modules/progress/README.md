# Módulo `progress`

- **Qué hace:** progreso de cada ejercicio para el cliente y para el coach (D-129). Muestra los ejercicios realizados agrupados por rutina (actual y anteriores), con el historial de cada ejercicio en texto ("DIA 1: 45×8(1)..."), marcas de nota, cálculo de RM estimado (fórmula de Epley con RIR sumado, no con más de 12 repeticiones efectivas) y récords de peso máximo y RM.
- **Tablas que usa:** `workouts`, `workout_exercises`, `workout_sets`, `programs`, `exercises`.
- **Rutas y vistas:**
  - Cliente: `/client/progress` (menú inferior con icono `chart`, orden 20).
  - Coach: Pestaña "Progreso" en la ficha del cliente (`/coach/clients/:id`).
- **Estado:** implementado con historial, RM estimado y récords (PR 3.15).
