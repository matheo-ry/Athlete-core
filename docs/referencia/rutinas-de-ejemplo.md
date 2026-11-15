# Rutinas de ejemplo

Dos rutinas reales del propietario, sin ningún dato personal. Sirven para dos cosas:

1. **Datos inventados del seed** (PR 2.5 y 2.12): son las plantillas de Iron Lab, para que los criterios de aceptación se comprueben con algo real.
2. **Referencia de diseño:** así escribe una rutina un coach de gimnasio. Solo dice cuántas series lleva cada ejercicio; el resto se añade al cargarla.

## Cómo se cargan en el seed

- Las dos son **plantillas de Iron Lab** (`coach.iron@example.com`).
- Si un ejercicio existe con ese mismo nombre en `biblioteca-ejercicios.md`, se usa el de la biblioteca. Si no, se crea como **ejercicio propio de Iron Lab** con la medida que indica la tabla. Así el seed tiene ejercicios de los dos tipos.
- **Prescripción inventada**, para que haya de todo:
  - Por defecto: las series de la tabla, de 8 a 12 repeticiones, RIR 1 y 2 minutos de descanso.
  - "Abdomen": 12 a 15 repeticiones y 1 minuto de descanso.
  - "Remo Gironda agarre amplio" (miércoles): series distintas. La primera de 6 a 8 repeticiones con RIR 1; las otras dos, de 10 a 12 con RIR 0.
  - "Extensión de cuádriceps" (miércoles): la última serie, al fallo.
  - "Hip thrust": nota del coach "Pausa de 1 segundo arriba".
  - "Flexiones con mochila": carga objetivo de 10 kg (el lastre).
- Asignaciones (PR 2.12): Ana tiene "Casa + Gym"; Bruno, "Pecho / Espalda y Brazo / Pierna"; Carla no tiene rutina.

## 1. "Casa + Gym" — semanal

Un bloque con un ciclo de 7 días, que se repite hasta que el coach lo cambie.

En un bloque semanal la app ya pone "Lunes", "Martes"…, así que el nombre del día se deja vacío (D-095).

| Día | Tipo | Nombre | Subtítulo | Lugar |
|---|---|---|---|---|
| Lunes | Entreno | | Empuje + dorsal + bíceps | Casa |
| Martes | Descanso | | | |
| Miércoles | Entreno | | Tirón + pierna | Gym |
| Jueves | Descanso | | | |
| Viernes | Entreno | | Empuje | Casa |
| Sábado | Entreno | | Tirón + pierna | Gym |
| Domingo | Descanso | | | |

### Lunes — Casa (7 ejercicios, 20 series)

| Orden | Ejercicio | Series | Medida |
|---|---|---|---|
| 1 | Flexiones con mochila | 3 | corporal |
| 2 | Flexiones con pies en la cama | 3 | corporal |
| 3 | Elevaciones laterales con mancuernas | 3 | peso |
| 4 | Flexiones esfinge | 3 | corporal |
| 5 | Dominadas prono agarre abierto | 3 | corporal |
| 6 | Curl martillo con mancuernas | 2 | peso |
| 7 | Abdomen | 3 | corporal |

### Miércoles — Gym (8 ejercicios, 19 series)

| Orden | Ejercicio | Series | Medida |
|---|---|---|---|
| 1 | Remo Gironda agarre amplio | 3 | peso |
| 2 | Jalón agarre estrecho/neutro (plano sagital) | 2 | peso |
| 3 | Aperturas | 3 | peso |
| 4 | Extensión de tríceps en polea, codo pegado | 3 | peso |
| 5 | Curl predicador en máquina | 2 | peso |
| 6 | Extensión de cuádriceps | 2 | peso |
| 7 | Curl femoral | 2 | peso |
| 8 | Hip thrust | 2 | peso |

### Viernes — Casa (5 ejercicios, 16 series)

| Orden | Ejercicio | Series | Medida |
|---|---|---|---|
| 1 | Flexiones con mochila | 3 | corporal |
| 2 | Flexiones con pies en la cama | 3 | corporal |
| 3 | Elevaciones laterales con mancuernas | 4 | peso |
| 4 | Flexiones esfinge | 3 | corporal |
| 5 | Abdomen | 3 | corporal |

### Sábado — Gym (7 ejercicios, 18 series)

| Orden | Ejercicio | Series | Medida |
|---|---|---|---|
| 1 | Remo Gironda agarre amplio | 3 | peso |
| 2 | Pec deck invertido | 2 | peso |
| 3 | Jalón agarre estrecho/neutro (plano sagital) | 2 | peso |
| 4 | Curl predicador en máquina | 3 | peso |
| 5 | Extensión de cuádriceps | 2 | peso |
| 6 | Curl femoral | 3 | peso |
| 7 | Hip thrust | 3 | peso |

## 2. "Pecho / Espalda y Brazo / Pierna" — ciclo de 8 días

Un bloque con un ciclo de 8 días. Al no durar 7, cada vuelta cae en días distintos de la semana: es el caso que obliga a que la app no dependa de la semana (D-075).

El propietario no indicó dónde iban los descansos. Se colocan así, y el coach puede moverlos:

| Día | Tipo | Nombre | Lugar |
|---|---|---|---|
| Día 1 | Entreno | Pecho / Espalda | Gym |
| Día 2 | Entreno | Brazo / Pierna 1 | Gym |
| Día 3 | Descanso | | |
| Día 4 | Entreno | Espalda / Pecho | Gym |
| Día 5 | Entreno | Brazo / Pierna 2 | Gym |
| Día 6 | Descanso | | |
| Día 7 | Descanso | | |
| Día 8 | Descanso | | |

### Día 1 — Pecho / Espalda (9 ejercicios, 21 series)

| Orden | Ejercicio | Series | Medida |
|---|---|---|---|
| 1 | Press horizontal en máquina | 3 | peso |
| 2 | Press inclinado | 2 | peso |
| 3 | Aperturas en polea sentado | 2 | peso |
| 4 | Remo en T | 3 | peso |
| 5 | Jalón dorsal plano frontal | 2 | peso |
| 6 | Jalón dorsal plano sagital | 2 | peso |
| 7 | Laterales en polea (hombro) | 3 | peso, unilateral |
| 8 | Hombro posterior | 1 | peso |
| 9 | Abdomen | 3 | corporal |

### Día 2 y Día 5 — Brazo / Pierna (9 ejercicios, 21 series)

Los dos días son iguales.

| Orden | Ejercicio | Series | Medida |
|---|---|---|---|
| 1 | Press francés | 2 | peso |
| 2 | Extensión de tríceps en polea | 3 | peso |
| 3 | Curl banco Scott unilateral | 3 | peso, unilateral |
| 4 | Martillo en polea | 2 | peso |
| 5 | Elevaciones laterales | 3 | peso |
| 6 | Hombro posterior | 1 | peso |
| 7 | Extensión de cuádriceps | 3 | peso |
| 8 | Sentadilla péndulo | 2 | peso |
| 9 | Curl femoral sentado | 2 | peso |

### Día 4 — Espalda / Pecho (9 ejercicios, 20 series)

| Orden | Ejercicio | Series | Medida |
|---|---|---|---|
| 1 | Remo en T | 3 | peso |
| 2 | Jalón dorsal plano frontal | 2 | peso |
| 3 | Jalón dorsal plano sagital | 2 | peso |
| 4 | Press horizontal en máquina | 2 | peso |
| 5 | Press inclinado | 2 | peso |
| 6 | Aperturas en polea sentado | 2 | peso |
| 7 | Laterales en polea (hombro) | 3 | peso, unilateral |
| 8 | Hombro posterior | 1 | peso |
| 9 | Abdomen | 3 | corporal |

## 3. "Fuerza básica" — para Norte Strength

Inventada, corta, para que el segundo negocio del seed tenga una rutina con la que probar el aislamiento. Un bloque semanal: lunes, miércoles y viernes de entreno, todos iguales, con ejercicios de la biblioteca.

| Orden | Ejercicio | Series | Repeticiones |
|---|---|---|---|
| 1 | Sentadilla con barra | 3 | 5 |
| 2 | Press de banca con barra | 3 | 5 |
| 3 | Remo con barra | 3 | 8 |
| 4 | Plancha | 3 | 45 segundos |
