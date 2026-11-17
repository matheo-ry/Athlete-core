# Módulo `progress`

- **Qué hace:** progreso de cada ejercicio y evolución corporal para el cliente y para el coach (D-129).
  - Ejercicios agrupados por rutina con su historial textual ("DIA 1: 45×8(1)..."), notas, marcas de récords y RM estimado (fórmula de Epley con RIR sumado, no con más de 12 reps).
  - Gráficas interactivas en SVG propio (sin librería, D-135): peso máximo, RM estimado, volumen y repeticiones. Periodos de 4 semanas, 3 meses o todo. % de progreso por RM. Al tocar un punto, desglose del entreno elegido con series y nota.
  - Peso corporal y medidas: pestaña dedicada con selector de métricas, evolución en gráfica y cambio en el periodo, condicionado al consentimiento de salud (D-126, D-127).
- **Tablas que usa:** `workouts`, `workout_exercises`, `workout_sets`, `programs`, `exercises`, `health_consents`, `body_weights`, `body_measurements`.
- **Rutas y vistas:**
  - Cliente: `/client/progress` (menú inferior con icono `chart`, orden 20).
  - Coach: Pestaña "Progreso" en la ficha del cliente (`/coach/clients/:id`).
- **Estado:** ampliado con gráficas y salud (PR 3.16).
