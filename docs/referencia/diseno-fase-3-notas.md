# Diseño de la Fase 3 — notas de trabajo

> **Archivo temporal** del chat de diseño de la Fase 3. Recoge lo que dice el propietario mientras se diseña, para que no se pierda si el chat se corta.
> **No son decisiones.** Las decisiones se escriben al final en `docs/DECISIONES.md`, y este archivo se borra en el mismo PR (rama `docs/diseno-fase-3`).
> Si abres un chat nuevo para seguir el diseño: lee esto, después el prompt del propietario (el mensaje que abrió el chat de diseño), y sigue por la tanda pendiente.

## Ya decidido por el propietario antes de las preguntas

1. **Guardado en el móvil (sin conexión)**: todo se guarda al instante en el móvil y se sube solo; no se pierde nada al cerrar la app, al quitarla de la multitarea o al apagar el móvil; "Reanudar" un entreno sin cerrar; la fecha del entreno es la del último dato cambiado; si se hace el día entero se guarda solo; el entreno de hoy ya está en el móvil antes de perder la cobertura. Hay que cubrir el límite de Safari (borra lo guardado tras unos 7 días sin abrir la web; en modo privado no guarda) y dejarlo escrito. Cambia P-06 y D-061, y choca con ARQUITECTURA §14 ("Modo sin conexión completo" fuera): enseñar el cambio exacto y esperar la aprobación.
2. **Cronómetro de descanso**: arranca solo al apuntar una serie; usa el descanso del coach, si no hay el del cliente (2:00 de partida, editable en ajustes), y si el cliente lo cambia en el entreno, manda el suyo; barra fija siempre a la vista; pausar, parar, saltar, sumar y restar; no cambia la rutina; en superseries y circuitos arranca al acabar la ronda; en unilaterales, al apuntar los dos lados; vibración y sonido (se pueden apagar); en la web no avisa con el móvil bloqueado (escribirlo); la cuenta sigue bien al volver a la app.
3. **Los 100 primeros coaches**: lo que pidan tiene prioridad y un plazo corto, pero siempre para todos (mejora general o flag). Después de 100, voto general. Decisión nueva.
4. **Marca para todos los planes** (D-057). Se confirma.
5. **Ideas de Gemini**: no son decisiones. Precios en la Fase 5; directorio público sigue en no (D-053) hasta tener decenas de coaches; Modo Alumni aprobado como idea, después de la Fase 5 (cambia D-055; comprobar las normas de pago de Apple y Google); retos gratis y pase para un amigo, aprobados como idea, después de la Fase 5; chat, nutrición, hábitos, check-ins, fotos y vídeos, a futuro; servicios, en su fase; tarjetas de récords para Instagram: recomendar si van en la Fase 3 o después.

## Capturas de su app de apuntes (referencia, no copiar el aspecto)

- Un ejercicio por pantalla con puntos de "ejercicio N de M"; historial reciente arriba; pestañas de series (SET 1, 2, 3).
- Peso (o "Lastre · Extra · Total 85 kg" en los de peso corporal: suma su peso corporal), repeticiones y RIR con botones − y + **y también con teclado** al tocar el número.
- Valores en gris = lo que hizo la última vez.
- Cronómetro con atajos 1:00, 1:30, 3:00, 3:30; pausar, bloquear y reiniciar.
- "Configuración universal" de cada ejercicio, compartida entre rutinas: "Pies juntos / Agarre línea 3 / Asiento 2".
- Notas del ejercicio del día, abajo.
- Resumen del día: N ejercicios, series hechas "6/20", última vez, "Terminar entreno" y papelera; cada ejercicio con su anillo "3/3".
- Inicio: "Entreno en curso" con "Continuar"; racha de semanas; nivel ("Nv. 1 · Novato"); semana L-D; peso corporal con "Actualizar" e historial; logros (1/18).
- Métricas por rutina; "Descargar Excel"; "Copia de seguridad"; "Rutinas anteriores".
- Historial en texto: "DIA 1: 45X8(1) / 45X7(1) / 45X6(0)", con una campana si hay nota. "(F)" = al fallo.
- Gráficas por ejercicio: peso, 1RM, volumen y repeticiones; último, récord y % de progreso; cada día con sus series, 1RM estimado, volumen, reps totales y la nota.
- Excel: hoja "Día a día" (fecha · rutina · día; ejercicio, serie 1..3 como "45X8(1)", nota), una hoja por rutina (ejercicio → DIA N, fecha, series, nota) y una hoja "Peso corporal".
- **Lo que NO quiere**: el muñeco; el botón "Marcar serie hecha" ("es un lío": la serie se ilumina con el color de la app y ya).
- Los datos raros de las capturas (5.9 kg, 0X0, 10→52) eran pruebas, no reales. Pero enseñan que un dato mal apuntado estropea el % de progreso: hay que mejorarlo.

## Respuestas de la tanda 1

1. **Cómo entrena**: abre la app ya en el gym. "Iniciar entreno" desde el día que toca o desde el inicio ("Hoy toca"). Entra al primer ejercicio; las series de aproximación y calentamiento **no las apunta**. Hace una serie efectiva y la apunta al terminar. **En cuanto mueve un dato de la serie, empieza el descanso.** El móvil va al bolsillo o al suelo. Al acabar el descanso suena un aviso sutil tipo alarma, **también con la pantalla apagada o en otra app**; mientras suena, **baja un poco el volumen de la música**; y sale una **notificación** por si no lleva cascos o tiene el volumen bajo. **El cronómetro es de toda la app**: si apunta la última serie de press y pasa al siguiente ejercicio, sigue contando. **Al terminar el entreno se guarda solo.**
2. **Un botón "igual que la anterior"**: sí, estaría bien.
3. **Botones − y + y teclado**, para los tres datos. RIR y repeticiones, cómodos con − y +; peso alto, mejor con teclado.
4. **Strong y Hevy, lo que le molestaba**: no se podían apuntar unilaterales; las notificaciones a veces no sonaban; no se podía un microciclo de 8 días; faltaban ejercicios; feas; **si cerraba la app o se apagaba el móvil, no se guardaba nada**.
5. **Máquina ocupada**: añadir un botón para cambiar de máquina o de ejercicio (normal por la tarde). **Que no salga en la gráfica** del ejercicio original, **pero que el coach lo sepa**: si ve 3 o 4 semanas de cambio, cambia la rutina.
6. **Dos tipos de notas**:
   - **Nota del día** (abajo): "dolor de hombro, por eso tiré menos", "no había discos", "calenté poco".
   - **Set-up de cada ejercicio** (asiento, posición de manos, altura de la polea, línea del agarre), que tiene que tener **dos cosas**: los apuntes del coach (altura de brazos, cómo hacer la serie…) y los del cliente, que dependen de su gimnasio y su máquina.
7. **Rachas, niveles y logros**: activos por defecto; el coach los puede quitar. **Minilogro cada vez que se sube peso o repeticiones en una serie** respecto a la vez anterior. Ejemplo: antes 80×12, 80×10, 75×12; ahora 80×13 (logro: más repes), 80×10 (nada), 80×9 (logro: más peso). Sale al apuntar la serie.
   - Del lastre: sirve para la salud y el control; "mismas repes pesando más es avance; una repe más pesando menos puede ser estancamiento".
8. **Rapidez**: entrar casi directo al entreno. **Con un entreno empezado, cada vez que abre la app va directo al ejercicio que le toca.**

## Cosas a tener en cuenta (detectadas por el chat de diseño)

- La alarma con la pantalla apagada, la notificación y bajar la música **no se pueden hacer bien en la web**: llegan con la app nativa (Fase 4, notificación local, no push). Es justo una de sus quejas de Strong y Hevy. Decidido ya: escribirlo como límite de la Fase 3.
- La nota del día puede contener lesiones o dolores: es dato de salud (P-12), igual que el peso corporal.
- El "Total 85 kg" con lastre usa el peso corporal: dato de salud (P-12).
