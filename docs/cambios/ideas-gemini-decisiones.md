# Ideas de Gemini (segunda tanda) — lo que decide el propietario

- **Fecha:** 2026-11-20
- **PR:** pendiente (rama `docs/ideas-gemini-decisiones`)

## Qué cambió

Solo documentación. El propietario revisó una segunda lista de ideas hecha con Gemini (nutrición, IA, entreno en sala, copiloto del coach, captación y vídeos 3D) y decidió idea por idea. Aquí queda lo decidido y el diseño de las series de calentamiento, que cambian D-119. **Nada de esto se construye hasta que llegue su fase**, salvo lo que diga "tras la Fase 3".

## Decisiones

### D-ideas-1 · Nutrición e IA entran en el producto
- **Decisión:** la app tendrá nutrición e IA. **Orden:** primero el entreno completo y maduro (Fases 3 y 4, y lo que salga de los pilotos); cuando funcione bien, la nutrición; después, los vídeos 3D (D-ideas-3). La IA será **Gemini Flash Lite, por la API de pago**.
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

### D-ideas-9 · Pruebas gratuitas: el detalle (completa D-ideas-5)
- **Duración:** de **7 a 10 días**; la elige el coach al crear el código de prueba, en la misma pantalla de sus códigos de invitación.
- **Cuántas:** sin límite de personas en prueba por coach.
- **Una prueba por cuenta y coach:** con la misma cuenta (email) no se puede repetir prueba con el mismo coach. Con otro email, sí. Como la cuenta no se borra, basta con recordar "esta cuenta ya probó con este coach" (sin guardar el email aparte).
- **Con otro coach:** es otro espacio, así que empieza de cero.
- **Al acabar la prueba** (los 7 días para decidir):
  - Solo ve **resúmenes que motivan**: kilos levantados esa semana, lo que progresó, cuántos días entrenó y una proyección ("si entrenas un mes como esta semana, podrías llegar a X kg" y, si apuntó su peso, "bajar X kg"). Las proyecciones se enseñan como estimación, nunca como promesa.
  - El resto de la app (entreno y, cuando exista, nutrición) se ve **en gris**, sin poder usarla.
  - El aviso: "Para seguir con tu plan sin perder lo que has apuntado, contrata a tu coach. Tienes N días; después se borrarán y, si contratas más tarde, empezarás de cero".
  - El **contacto del coach**. Decidido por Claude: un único campo "Cómo contactarme" en los Ajustes del coach (enlace o teléfono, validado con Zod).

### D-ideas-10 · Nota final del entreno
- **Decisión:** además de la nota de cada ejercicio (D-122), una **nota del entreno entero**. Sale **sola al terminar**: tanto cuando se cierra solo con todo hecho como con "Terminar" a medias. Es opcional, se puede saltar.
- **Encaja con lo que hay:** es dato de salud, así que sigue D-126 (sin consentimiento, lo pide, igual que la nota de cada ejercicio). Si el entreno se cierra solo a las 12 horas (D-151) no sale; se puede añadir desde el resumen o el historial.
- **Base de datos:** migración nueva con `workouts.note` (hasta 500 caracteres) y `sync_workout` que la acepte.
- **Cuándo:** un PR pequeño **después del 3.10** (notas del día), que toca la misma pantalla. Propuesta: "PR 3.10b — Nota final del entreno". Lo tiene que añadir a `docs/PROMPTS.md` §7 el PR que resuma el lote.

### D-ideas-11 · Radar de abandono
- **Decisión:** como en D-ideas-4: ampliar los avisos de D-128 con los datos de entreno. Tras la Fase 3.

### D-ideas-12 · Chat con IA para el coach
- **Decisión:** el coach podrá preguntar a la IA sobre los datos de sus clientes ("¿quién ha bajado el volumen este mes?") y la IA le contesta **solo con los datos de su negocio**.
- **Regla de seguridad:** la IA lee los datos **con la sesión del coach**, así que pasa por el RLS y no puede ver otro negocio aunque se le pida. **Nunca** con la clave `service_role` (regla de oro 3).
- **Datos de salud:** el peso, las medidas y las notas que se manden a Gemini los tiene que cubrir el consentimiento de cada cliente (D-126), ampliado para la IA.
- **Cuándo:** con la IA (con la nutrición o después). Dificultad alta.

### D-ideas-13 · La IA, incluida en todos los planes
- **Decisión:** precios cerrados. **Todos los planes tienen las mismas funciones** (también la IA); lo único que cambia el precio es el número de clientes. Sigue D-017 y D-133.
- **Ojo:** los topes diarios de uso (D-ideas-1 y D-ideas-8) siguen existiendo para cuidar el coste: es uso razonable, no una función de pago.

### D-ideas-14 · OpenMacro como base de la nutrición
- **Qué es (según el propietario):** app de nutrición de código abierto para Android, con TDEE adaptativo, unos 58.000 alimentos, escáner de códigos de barras y registro con IA. Código con licencia **MIT** (se puede usar en una app comercial cerrada conservando el aviso de copyright y la licencia).
- **Ojo:**
  - Está hecha en **Rust**. Nuestra app es TypeScript, así que no se copia el código tal cual: se **trasladan sus algoritmos** (el del TDEE, por ejemplo), con su aviso MIT.
  - **Los alimentos van con licencias aparte:** USDA (dominio público), FSANZ (CC BY 4.0: hay que citarla) y Open Food Facts (ODbL: citarla y compartir las mejoras que se hagan a esa base, no el código de la app).
  - Esas bases están sobre todo **en inglés**: para España hará falta una base con nombres en español.
  - Antes de usarla, comprobar en su repositorio la licencia y el origen de cada base de alimentos.
- **No usar OpenNutriTracker:** su licencia GPL-3.0 obligaría a publicar el código de la app.

### D-ideas-15 · Plan para gimnasios
- **Decisión:** el plan más grande de coach llega a **500 clientes**. Por encima hay un **plan de gimnasio**, solo para el gimnasio y sus empleados, que asignan rutinas a sus socios. **No es para coaches de fuera** que entrenan en ese gimnasio: ellos contratan su propio plan de coach.
- **Cambia D-017** (provisional), donde el plan `studio` no tenía límite. Los números finales se fijan en la Fase 5.
- **Cómo se evita que lo usen coaches de fuera (propuesta de Claude):** la app no puede saber quién tiene contrato con el gimnasio, así que se combina lo técnico con las condiciones:
  1. **Solo el dueño del gimnasio da de alta a sus empleados** (rol `staff`, que ya existe en la base de datos sin alta, ARQUITECTURA §7), por invitación a su email. Nadie entra como empleado por su cuenta, y el dueño los quita cuando quiera.
  2. **Los socios y sus datos son del gimnasio:** el dueño y todos los empleados los ven (las políticas de hoy ya tratan igual a `owner` y `staff`), y un empleado que se va pierde el acceso a todos. A un coach de fuera no le interesa meter ahí a sus clientes: no serían suyos.
  3. **La marca es la del gimnasio:** un coach de fuera no puede poner la suya.
  4. **Las condiciones del plan** prohíben usarlo para clientes de coaches externos.
  5. Un empleado que además tenga clientes propios puede abrir su propio negocio de coach con la misma cuenta (D-048).
- **Incentivo:** si un coach que entrena en el gimnasio contrata su propio plan de coach invitado por el gimnasio, el gimnasio recibe el **30 % del plan de ese coach**. Necesita pagos.
- **Cuándo:** después de la Fase 5 (pagos y planes). Dificultad alta: alta de empleados, quién ve a qué socio y la marca del gimnasio.

### D-ideas-16 · Chat con IA para el cliente
- **Decisión:** el cliente también puede preguntar a la IA, **solo sobre sus propios datos** y para preguntas sencillas ("¿cuánto levanté el mes pasado en sentadilla?").
- **Nunca le quita autoridad al coach:** si la pregunta es seria (cambiar la rutina o la dieta, dolor, lesión, salud), contesta "Eso háblalo con tu coach" y no opina. Nunca contradice la rutina ni la dieta que puso el coach.
- **Cómo:** igual que el del coach (D-ideas-12): lee con la sesión del cliente, así que el RLS solo le deja ver lo suyo. Tiene topes diarios (D-ideas-1 y D-ideas-8).

### D-ideas-17 · Derechos de los vídeos 3D: lo único que se vende aparte
- **Decisión:** es la **única excepción** a "precios cerrados" (D-ideas-13), y resuelve el choque con D-ideas-7.
  - **Gratis:** subir a redes capturas o grabaciones de pantalla de la app, en las que se ve la app.
  - **De pago:** descargar el vídeo 3D solo, sin sello, para publicarlo como contenido propio.
  - Los coaches de **planes más altos los pagan más baratos**, y hay **paquetes con descuento**.
- **Cuándo:** con los vídeos 3D y los pagos.

## Qué está claro, qué está en el aire y qué choca

Repaso hecho el 2026-11-20 de todo lo de este archivo frente a las decisiones anteriores.

**Choques resueltos aquí** (ya no hay dos decisiones):
- Calentamiento: D-119 decía que no se apunta → D-ideas-2. D-119 lleva la marca "Sustituida en parte".
- Pruebas: D-134 las ponía en la Fase 6 → Fase 5 (D-ideas-5). D-134 lleva la marca.
- Pruebas y "dar de baja no borra" (D-055): las pruebas son la única excepción, escrita en D-ideas-5.

**Choques que quedan hasta el PR de resumen del lote** (es solo papeleo):
- ARQUITECTURA §14 dice "Nutrición: fuera de la primera versión" → hay que añadir "llega después de la Fase 4" (zona protegida: con el OK del propietario).
- `docs/ESTADO.md` todavía pone los retos en la Fase 6 y no tiene la nutrición ni el PR 3.19.

**Resuelto el 2026-11-20** (antes en el aire): API de pago (D-ideas-1), lo que ve tras la prueba, duración, abusos y contacto (D-ideas-9), OpenMacro (D-ideas-14), nota final (D-ideas-10), radar (D-ideas-11), chat con IA (D-ideas-12) y la IA incluida en el plan (D-ideas-13).

**También resuelto:** los vídeos 3D para redes (D-ideas-17, única excepción de pago), los gimnasios (D-ideas-15) y el chat del cliente (D-ideas-16). D-017 queda cambiado en parte por D-ideas-15 (500 clientes como máximo en los planes de coach).

**En el aire** (falta que el propietario decida; ninguno frena nada cercano):
1. **¿Qué es un gimnasio?** ¿Un gimnasio de 200 socios va al plan de gimnasio o a uno de coach? Es decir, si el plan de gimnasio va por tipo de negocio o solo por pasar de 500.
2. **El 30 % para el gimnasio:** ¿todos los meses mientras el coach pague, o solo el primer pago? ¿En dinero o como descuento en la factura del gimnasio?
3. **En el gimnasio, ¿cada empleado ve a todos los socios o solo a los suyos?** Hoy la base de datos deja ver todo a `owner` y `staff`.
4. **Vídeos 3D comprados:** si el coach se da de baja, ¿puede seguir usando los que ya pagó (para siempre) o solo mientras tenga plan?
5. **Chat del cliente con IA:** ¿el coach puede leer lo que su cliente pregunta a la IA?

**Decidido por Claude dentro de D-ideas-2** (el propietario puede cambiarlo antes del PR 3.19): el calentamiento no va por lado en los unilaterales; el descanso no arranca solo tras un calentamiento; un entreno con solo calentamientos no se guarda; el coach lo ve en gris y no sale en el Excel.

**Completamente claro:** todo lo demás de D-ideas-1 a D-ideas-17.

## Lo que debe saber el siguiente

- Estas decisiones **no** mueven el plan de la Fase 3: lo único que se suma cerca es el PR del calentamiento (D-ideas-2) y lo marcado "tras la Fase 3".
- Al cerrar el lote, el PR de resumen debe llevar a `docs/ESTADO.md` la nutrición e IA después de la Fase 4, el PR 3.19 propuesto y lo que cambia en la Fase 6 (pruebas, D-ideas-5), y a `docs/ARQUITECTURA.md` §14 que la nutrición ya tiene momento (zona protegida: con el OK del propietario).
- Lo único cercano para construir: el PR 3.10b (nota final, D-ideas-10) y el PR 3.19 (calentamiento, D-ideas-2). El PR de resumen del lote debe añadir los dos a `docs/PROMPTS.md` §7.

## Deuda

Ninguna.
