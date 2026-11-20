# Ideas de Gemini (segunda tanda) — lo que decide el propietario

- **Fecha:** 2026-11-20
- **PR:** pendiente (rama `docs/ideas-gemini-decisiones`)

## Qué cambió

Solo documentación. El propietario revisó una segunda lista de ideas hecha con Gemini (nutrición, IA, entreno en sala, copiloto del coach, captación y vídeos 3D) y decidió idea por idea. Aquí queda lo decidido y el diseño de las series de calentamiento, que cambian D-119. **Nada de esto se construye hasta que llegue su fase**, salvo lo que diga "tras la Fase 3".

## Decisiones

### D-ideas-1 · Nutrición e IA entran en el producto
- **Decisión:** la app tendrá nutrición e IA. **La nutrición llega después de la Fase 4 (pilotos)**; su orden frente a las Fases 5 y 6 se decide al cerrar la 4. La IA será **Gemini Flash Lite**.
- **Por qué:** decisión del propietario: siempre estuvo previsto. Cambia ARQUITECTURA §14 ("Nutrición" fuera de la primera versión) solo en el cuándo: sigue fuera hasta después de los pilotos.
- **Reglas para cuando se construya:**
  - La clave de Gemini **nunca** va en la app (regla de oro 3): se llama desde una función de Supabase (Edge Function), que además lleva la cuenta de usos diarios por usuario (tabla de negocio con `tenant_id` y RLS).
  - Lo que se manda (fotos de comida, textos) puede ser dato de salud: hay que ampliar el consentimiento de D-126 y revisarlo con el abogado en la Fase 4. Usar el nivel **de pago** de la API de Gemini: hay que comprobar que en ese nivel Google no usa los datos para entrenar sus modelos.
  - La respuesta de la IA se valida con Zod y siempre se enseña como **estimación editable** antes de guardarla.

### D-ideas-2 · Series de calentamiento
- **Decisión:** se pueden apuntar series de calentamiento. **Sustituye en parte a D-119** ("El calentamiento no se apunta"). Diseño:
  1. **Interruptor del cliente**, apagado por defecto: Perfil → "Entreno" → "Series de calentamiento" (columna nueva en `profiles`, junto a los ajustes de la migración 21). El coach no las prescribe.
  2. Con el interruptor encendido, **cada ejercicio** del entreno tiene "+ Calentamiento". El cliente elige en cuáles y cuántas: **máximo 5 por ejercicio**. Así, en un día Pecho/Espalda calienta el primero de pecho y el primero de espalda, y los demás no.
  3. **Solo peso y repeticiones**, sin RIR ni RPE. Van siempre **antes** de las series efectivas, numeradas "C1, C2…" y con otro aspecto (etiqueta "Calentamiento").
  4. **Se recuerdan solas, sin guardar nada aparte:** la próxima vez que toque ese mismo ejercicio de ese mismo día de la rutina, salen en gris tantas como hizo la vez anterior, con sus pesos y repeticiones, igual que las efectivas (D-120, "Igual"). Si un día no las hace o las quita, la siguiente vez no salen. Como sale de la vez anterior del **mismo día de la rutina**, el caso Pecho/Espalda funciona solo.
  5. **No cuentan para nada del progreso:** récords, RM estimado, minilogros, gráficas (volumen y repeticiones), historial "45×8(1)", Excel, "series hechas" del resumen y del coach. Tampoco cuentan para cerrar solo el entreno (D-149: basta con las efectivas) ni para "un entreno sin ninguna serie hecha no se guarda": solo con calentamientos, no se guarda.
  6. **Unilaterales:** el calentamiento no va por lado (una fila con `side = 'none'`): menos toques, y el calentamiento no se compara.
  7. **El descanso no arranca solo** tras una serie de calentamiento (sí se puede arrancar a mano). "¿Seguro?" (D-120) no salta en el calentamiento.
  8. **El coach las ve** en el entreno por dentro (D-128), en gris y con la etiqueta, para saber cómo calienta su cliente; no salen en el Excel.
- **Base de datos (migración nueva, regla de oro 6):** `workout_sets.is_warmup boolean not null default false`. El número de serie del calentamiento va aparte (1 a 5): la clave única pasa a `(workout_exercise_id, is_warmup, set_number, side)`. Comprobaciones: un calentamiento no lleva intensidad, no es `is_extra` y su lado es `none`. `sync_workout` acepta el campo nuevo y su test pgTAP lo cubre.
- **Código que hay que tocar:** `workouts/model` (`active-workout.ts`, `close-workout.ts`, `records.ts`, `rm.ts`, `offline-snapshot.ts` para la vez anterior, `workout-format.ts`), `progress/model` (`exercise-history.ts`, `progress-charts.ts`, `export-excel.ts`) y `workouts/api`. Lo más fácil es un filtro único "solo efectivas" en el modelo y usarlo en todos esos sitios, con tests que fallen si un calentamiento se cuela en un récord.
- **Cuándo:** un PR propio **tras el Lote 3 de la Fase 3** (toca la misma pantalla que 3.8 y 3.10). Propuesta: "PR 3.19 — Series de calentamiento".
- **Por qué:** decisión del propietario. Sacarlas de todos los cálculos evita que un 60×10 de calentamiento "bata" una marca o hunda el volumen.

### D-ideas-3 · Entreno en sala
- **Calculadora de discos:** sí, tras la Fase 3. Funciona sin conexión: con el peso de la barra (20 kg o 45 lb) y los discos que hay, dibuja qué cargar a cada lado y, si no cuadra exacto, el más cercano por debajo. kg o lb según la preferencia del cliente.
- **Vídeos 3D de técnica (Blender):** sí, **muy a futuro**, cuando estén los primeros 100. Un botón "Ver técnica" en la pantalla del ejercicio que reproduce el vídeo dentro de la app. Cambiará D-074 (solo enlaces) en ese momento. Hará falta un servicio de vídeo fuera del plan gratuito de Supabase (D-063, D-134).
- **Mapa corporal de molestias:** no. Las molestias van en las notas.
- **Nota de voz post-entreno:** no.

### D-ideas-4 · Copiloto del coach
- **Resumen del cliente:** por ahora **solo calculado, sin IA** (peso, % de cumplimiento, récords, notas recientes), tras la Fase 3.
- **Radar de abandono:** sí, ampliando los avisos de D-128 con los datos de entreno (menos entrenos que su rutina, más días entre entrenos). Tras la Fase 3.
- **Comparar fotos:** superponer a mano, cuando lleguen las fotos de los check-ins. Sin alineado automático.
- **Rachas semanales:** ya decididas (D-130), PR 3.17.
- **Onboarding visual y resumen mensual tipo "Wrapped":** no, por ahora.

### D-ideas-5 · Pruebas gratuitas del coach (completa D-134)
- **Decisión:** se mantiene lo de D-134: un **código de prueba** aparte del normal, que **dura días** (no entrenos) y **no gasta plazas** del plan. Se añade:
  - Mientras dura, el cliente en prueba sale en la lista del coach con la etiqueta "En prueba · quedan N días". No hay pestaña aparte de "leads".
  - **Al acabar**, ve una pantalla de cierre con lo que hizo y un botón para contactar con su coach (el coach tendrá que guardar su contacto en Ajustes).
  - Tiene **7 días para decidir**: si escribe el código normal de su coach, sigue como cliente con todos sus datos y la misma cuenta. Si no, a los 7 días **se borran los datos de esa prueba** (entrenos y datos de salud de ese espacio). La cuenta no se borra. Es la única excepción a "dar de baja no borra" (D-055), y solo para pruebas. El borrado es automático (tarea programada en la base de datos).
- **Cuándo:** en la **Fase 5**, con los límites por plan, porque "no gastar plazas" importa cuando las plazas se cobran. El propietario dejó elegir la fase ("en la que mejor venga"). **Sustituye en parte a D-134**, que la ponía en la Fase 6. El pase para un amigo sigue en la Fase 6.
- **IA en las pruebas:** ver D-ideas-8.
- **Tarjeta para Stories al acabar un entreno o reto:** son las tarjetas de récords ya previstas (D-134, Fase 6).
- **Generador de casos de éxito:** no, por ahora.

### D-ideas-6 · Nutrición: lo decidido de cada idea (para cuando llegue)
- **Dos vistas (guiado para el cliente, avanzado para el coach):** ya existe con los dos perfiles (D-004).
- **TDEE adaptativo** (media móvil semanal del peso y propuesta de ajuste que el coach aprueba): sí, con nutrición.
- **Detector de "límite sano":** no, por ahora.
- **Motor de porciones offline:** sí, a futuro. Base de alimentos: el propietario quiere partir de "OpenMacro" y sumar otras bases. Hay que confirmar cuál es y su licencia (si es Open Food Facts, su licencia ODbL obliga a compartir la base modificada).
- **Motor de porciones con IA, foto de la carta, registro por voz, escáner de nevera, modo rescate y semáforo de saciedad:** sí, con nutrición.
- **Escáner de platos por foto, con tres niveles de precisión:** una foto desde arriba (poca), más una foto de lado que da la altura y la forma del plato (más), más un texto que lo describe (mucha más). Se manda todo junto a Gemini Flash Lite.

### D-ideas-7 · Vídeos 3D en redes y el resto
- **Descargar los vídeos 3D para redes, como extra de pago:** sí, cuando existan los vídeos 3D y los pagos.
- **Cuenta de marketing con los vídeos 3D:** es marketing, fuera de la app. No pide código.
- **Derivar clientes a coaches a cambio de comisión:** no.

### D-ideas-8 · La IA, recortada en las pruebas
- **Decisión:** quien está en prueba usa la IA, pero con topes más bajos y **nunca sin límite**:
  - **Fotos de comida:** 1 plato al día.
  - **Lo demás** (textos, mensajes, voz): un tope diario más bajo que el de los clientes.
  - Al llegar al tope ve un mensaje: "Para usarlo sin este límite, hazte cliente de tu coach". Al pasar a cliente con el código normal (D-ideas-5), tiene los topes de cliente.
- **Por qué:** decisión del propietario: que pruebe la IA y le enganche, sin que el coste se dispare.
- **Cómo:** los topes los lleva la función de Supabase que llama a Gemini (D-ideas-1), según el tipo de espacio (prueba o cliente). Los números exactos se fijan al construir la nutrición.

## Qué está claro, qué está en el aire y qué choca

Repaso hecho el 2026-11-20 de todo lo de este archivo frente a las decisiones anteriores.

**Choques resueltos aquí** (ya no hay dos decisiones):
- Calentamiento: D-119 decía que no se apunta → D-ideas-2. D-119 lleva la marca "Sustituida en parte".
- Pruebas: D-134 las ponía en la Fase 6 → Fase 5 (D-ideas-5). D-134 lleva la marca.
- Pruebas y "dar de baja no borra" (D-055): las pruebas son la única excepción, escrita en D-ideas-5.

**Choques que quedan hasta el PR de resumen del lote** (es solo papeleo):
- ARQUITECTURA §14 dice "Nutrición: fuera de la primera versión" → hay que añadir "llega después de la Fase 4" (zona protegida: con el OK del propietario).
- `docs/ESTADO.md` todavía pone los retos en la Fase 6 y no tiene la nutrición ni el PR 3.19.

**En el aire** (falta que el propietario decida):
1. **Nivel de la API de Gemini:** gratuito o de pago. Con datos de salud hace falta comprobar que Google no los usa para entrenar sus modelos en el nivel que se elija.
2. **Pruebas — qué puede hacer en los 7 días de decidir:** ¿sigue entrenando, o solo ve su resumen?
3. **Pruebas — cuántos días dura y quién lo elige** (¿el coach, entre 3 y 14?).
4. **Pruebas — topes contra el abuso:** cuántas personas en prueba a la vez puede tener un coach, y si la misma persona puede repetir prueba con el mismo coach.
5. **Pruebas — el contacto del coach** en la pantalla de cierre: WhatsApp, email, enlace…
6. **"OpenMacro":** qué base de alimentos es y su licencia.
7. **Nota general al terminar el entreno** (además de la de cada ejercicio, D-122).
8. **Radar de abandono:** el propietario escribió "implementado". Aquí se entiende "ampliarlo" (D-ideas-4); si quería decir "ya está con el aviso de 7 días", no se hace nada más.
9. **Qué IA cuenta como "mensajes"** para los topes: el registro por voz y por texto de la comida, seguro. ¿Habrá un chat con la IA? No está decidido.
10. **Cuánto pagan los coaches por la IA:** incluida en el plan o aparte. Se decide en la Fase 5 con los precios.
11. **Gimnasios como clientes:** el documento de Gemini habla de "entrenadores y gimnasios". Hoy el producto es para coaches (D-070) y el segundo coach del negocio (`staff`) no tiene fase.

**Decidido por Claude dentro de D-ideas-2** (el propietario puede cambiarlo antes del PR 3.19): el calentamiento no va por lado en los unilaterales; el descanso no arranca solo tras un calentamiento; un entreno con solo calentamientos no se guarda; el coach lo ve en gris y no sale en el Excel.

**Completamente claro:** todo lo demás de D-ideas-1 a D-ideas-8.

## Lo que debe saber el siguiente

- Estas decisiones **no** mueven el plan de la Fase 3: lo único que se suma cerca es el PR del calentamiento (D-ideas-2) y lo marcado "tras la Fase 3".
- Al cerrar el lote, el PR de resumen debe llevar a `docs/ESTADO.md` la nutrición e IA después de la Fase 4, el PR 3.19 propuesto y lo que cambia en la Fase 6 (pruebas, D-ideas-5), y a `docs/ARQUITECTURA.md` §14 que la nutrición ya tiene momento (zona protegida: con el OK del propietario).
- "Las molestias en notas" hoy es la nota de cada ejercicio (D-122). Una nota general al terminar el entreno sería un PR pequeño con migración: hoy `workouts` no la tiene (en el aire, punto 7).

## Deuda

Ninguna.
