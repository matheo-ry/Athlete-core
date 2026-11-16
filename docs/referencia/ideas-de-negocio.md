# Ideas de negocio (NO son decisiones)

> **Atención: esto son ideas, no decisiones.** Salieron hablando con Gemini y el propietario las guardó para no perderlas. **Ningún precio, número, plan ni función de este documento está decidido**, y ningún agente debe construir nada a partir de aquí.
> Lo que sí se ha decidido de cada idea está en la primera parte, y su porqué en `docs/DECISIONES.md` (D-132 a D-134). Si algo de aquí choca con una decisión tomada, manda la decisión.

## Lo decidido de cada idea (2026-11-16)

| Idea | Qué se ha decidido | Dónde |
|---|---|---|
| Precios, planes y tramos de alumnos | Nada todavía. Se deciden en la **Fase 5**, después de hablar con coaches | D-017, D-070 (pregunta 11) |
| Marca blanca solo en los planes caros | **No.** La marca (logo, colores y nombre) es para todos los planes | D-057, D-133 |
| "Funciones a medida" con plazo por plan | **No** como código a medida. Hasta los 100 primeros coaches, lo que pidan tiene prioridad y plazo corto, pero se construye **para todos** (mejora general o flag). Después, por voto general. Si el plazo depende del plan, se decide en la Fase 5 | D-016, D-132 |
| Cobro con Stripe en la web, sin pagos dentro de la app | Pendiente: proveedor y dónde se contrata, en la Fase 5 | P-05 |
| Forma jurídica, IVA y cifras financieras | No es del producto. El propietario lo revisará con un asesor | — |
| Servicios (hosting, vídeos, fotos, notificaciones) | Se eligen en la fase de cada función | P-03, P-07 |
| Chat, check-ins, fotos, nutrición, hábitos, subir vídeos | A futuro, cada uno en su fase | ARQUITECTURA §14, D-136 |
| Modo sin conexión con cronómetro | **Sí, en la Fase 3**, solo en la app del móvil | D-116, D-118, D-123 |
| Unilaterales, ciclos de N días | Hecho en la Fase 2; los unilaterales se apuntan por lado en la Fase 3 | D-072, D-075, D-121 |
| Cobros del coach a sus clientes (Stripe Connect) | Fase 5 | P-05 |
| Semáforo de riesgo de abandono | En parte en la Fase 3: aviso "Sin entrenar desde hace 7 días" | D-128 |
| Tarjetas de récords para Instagram | Aprobada como idea. **Después de la Fase 3** (Fase 6) | D-134 |
| Retos gratuitos de 7 o 14 días | Aprobados como idea: duran unos días, no gastan plazas del plan. **Después de la Fase 5** (Fase 6) | D-134 |
| Pase de compañero de entreno / trae a un amigo | Aprobado como idea. **Después de la Fase 5** (Fase 6) | D-134 |
| Modo Alumni (el exalumno sigue pagando y el coach se lleva una parte) | Aprobado como idea. Necesita pagos y cambia D-055: **después de la Fase 5** (Fase 6). Hay que comprobar las normas de pago de Apple y Google para ese caso | D-055, D-134 |
| Coaches embajadores | Idea para la Fase 6, con los pagos ya hechos | D-134 |
| Directorio público "Encuentra tu coach" | **Sigue el no** hasta tener decenas de coaches | D-053, D-134 |
| Resúmenes con IA, valoración inicial, reseñas, venta de extras, modo pausa, informe pre-renovación, importar Excel en 24 h, app propia en las tiendas | Sin decidir. Ideas para más adelante | — |

---

## El texto original de Gemini

Copiado tal cual. **No son decisiones.**

Aquí tienes el documento maestro completo y detallado que recopila absolutamente todo lo que hemos construido en esta sesión: modelo financiero y fiscal en España, precios escalonados, arquitectura de producto, ventajas competitivas, sistema de ex-alumnos, herramientas de ventas para el coach y estrategia de captación internacional.

📘 Plan Maestro de Negocio y Producto: SaaS B2B para Coaches

1. Modelo de Negocio, Cobros y Fiscalidad (España 2026)
 * Modelo 100 % B2B SaaS (Web-First):
   * Los entrenadores se registran y pagan en tu página web mediante Stripe Billing; después descargan la app gratuita en iOS y Android e inician sesión con su cuenta (sin botones ni enlaces de pago dentro de la app móvil para cumplir las normas de Apple y Google).
   * Ahorro frente a App Store / Google Play: Evitas el 15 % – 30 % de comisión de las tiendas y pagas solo la comisión estándar de Stripe (~1,5 % + 0,25 € por transacción en tarjetas europeas). Además, emites factura completa deducible para el coach.
 * Ventaja fiscal por ventas internacionales (Español e Inglés):
   * Clientes en España: El precio incluye el 21 % de IVA (ej. en un cobro de 70 € PVP, tu base imponible real es 57,85 €).
   * Clientes en EE. UU., Reino Unido, Latinoamérica o profesionales UE con ROI/VIES: Facturas al 0 % de IVA (exportación de servicios / operación intracomunitaria), quedándote el 100 % de la tarifa como base imponible (+21 % extra de ingreso real frente a España).
 * Forma jurídica:
   * Empieza como Autónomo hasta alcanzar de forma estable unos 130 – 150 coaches (~60.000 € – 65.000 € de beneficio neto anual).
   * A partir de ese volumen, da el salto a Sociedad Limitada (SL) para tributar por Impuesto de Sociedades (15 % nueva creación / 23 % pymes) en lugar de escalar al 37 % – 45 % de IRPF.
 * Coste de infraestructura técnica:
   * Con una arquitectura eficiente (Supabase/PostgreSQL, Vercel, Cloudflare R2 sin coste de descarga para fotos, Bunny Stream para vídeos y Firebase FCM gratuito para notificaciones push), mantener 250 coaches y 3.500 alumnos activos cuesta apenas 130 € – 270 €/mes (menos del 1,5 % de tus ingresos).

2. Estructura de Planes, Precios y Tiempos de Desarrollo

Todas las funciones base están incluidas desde el primer plan. Lo que diferencia cada tramo es el número de alumnos activos, el alojamiento de vídeos, la marca blanca y el plazo máximo garantizado para desarrollar funciones a medida:

| Característica | Starter | Pro (Más elegido) | Growth | Scale |
|---|---|---|---|---|
| Límite de alumnos activos | 0 – 5 alumnos | 6 – 15 alumnos | 16 – 30 alumnos | +30 alumnos (Ilimitados) |
| Precio Mensual | 35 €/mes | 69 €/mes | 99 €/mes | 149 €/mes |
| Oferta Anual (2 meses gratis) | Solo mensual | 690 €/año (57,50 €/mes) | 990 €/año (82,50 €/mes) | 1.490 €/año (124,17 €/mes) |
| Vídeos en ejercicios | Enlaces YouTube/Vimeo | Enlaces YouTube/Vimeo | Subida directa nativa | Subida directa nativa HD |
| Personalización de marca | Foto y nombre del coach | Marca Blanca completa (logo, colores, portada, PDFs) | Marca Blanca completa | Marca Blanca + Subdominio propio (app.coach.com) |
| Funciones a medida | No incluidas (acceso a mejoras generales) | Plazo máx. 1 mes (suele estar antes) | Plazo máx. 2 semanas (suele estar antes) | Plazo máx. 1 semana (prioridad VIP) |

 * Impacto financiero con 250 coaches (mix 50 % España / 50 % Internacional): Genera unos 20.400 €/mes brutos (18.261,25 €/mes netos tras IVA y Stripe). Si el 30 % de los nuevos clientes de planes Pro, Growth y Scale eligen el pago anual, generas +20.410 € de caja extra en los primeros 6 meses para autofinanciar anuncios desde el Mes 1.
 * Expansión futura (Plan Enterprise VIP ~249 €/mes): Cuando tengas tracción, podrás ofrecer publicación de app propia en App Store y Google Play bajo la cuenta de desarrollador del coach (absorbiendo tú dentro de la cuota los 99 $/año de Apple y 25 $ de Google).

3. Producto: Lo Imprescindible + Ventajas Frente a la Competencia

A. Estándar obligatorio (lo que debes incluir sí o sí)
 * Chat centralizado 1 a 1: Envío de fotos, vídeos de corrección técnica (con borrado automático a los 90 días para ahorrar servidor) y notas de voz con transcripción.
 * Seguimiento y Check-ins: Registro de peso, perímetros, galería comparativa de fotos y formularios semanales configurables.
 * Nutrición y Hábitos: Objetivos de calorías y macros, diario de comidas con fotos o PDF, y checklist diario de hábitos (pasos, agua, sueño) con racha de cumplimiento.
 * Cobros directos del coach (Stripe Connect): Permite que cada entrenador cobre sus mensualidades (100 € – 250 €/mes según país) directamente en su banco con 0 % de comisión extra por tu parte y bloqueo automático de acceso si un alumno deja de pagar.
 * Automatizaciones básicas incluidas: Mensaje de bienvenida al pagar, felicitación por récord personal (PR) y recordatorio tras días sin entrenar.

B. Tus armas secretas frente a Trainerize, Harbiz, TrueCoach y Everfit
 * Motor Offline-First ultra-rápido (tu app actual): Funciona al instante en gimnasios y sótanos sin cobertura, con temporizador de descanso fluido y sincronización automática al recuperar WiFi/datos.
 * Programación avanzada real:
   * Microciclos flexibles de N días (5, 7, 8, 9, 10 días...), sin obligar a encajar todo de lunes a domingo.
   * Ejercicios unilaterales reales (registro independiente de peso y repeticiones para pierna/brazo izquierdo y derecho).
   * Contador automático de series efectivas por grupo muscular en tiempo real mientras se arma la rutina.
 * Banco de ejercicios híbrido + Migración en 24h: El coach crea ejercicios propios con notas técnicas y vídeo, y tú le importas gratis su Excel/CSV inicial para eliminar cualquier fricción al cambiarse de app.
 * Resúmenes inteligentes con IA antes del Check-in: Tarjeta de 3 líneas resumiendo entrenos completados, récords batidos y niveles de sueño/estrés antes de la revisión semanal.

4. Herramientas para que el Coach Gane Más Dinero, Retenga Alumnos y Ahorre Tiempo

A. Motor de Ventas para el Coach (Ayudarle a captar clientes)
 * Enlace de "Valoración Inicial" y Calendario filtrado: URL propia (app.tuweb.com/c/carlos) donde el prospecto rellena sus objetivos, lesiones y presupuesto antes de agendar llamada, generando al instante una ficha resumen para el coach.
 * Retos Gratuitos de 7 o 14 Días (Lead Magnet): Enlace público (app.tuweb.com/reto/carlos-14dias) para que los seguidores de Instagram del coach hagan un reto gratuito en tu app con su marca (sin consumir su cupo de alumnos de pago) y reciban una oferta al terminar.
 * Tarjetas de Récords para Instagram Stories: Al batir un récord personal o cumplir 30 días seguidos, la app genera una imagen vertical (9:16) con el logo y @usuario del coach lista para que el alumno la suba a Stories.
 * Reseñas verificadas y Venta de Bonos Extra: Página pública con testimonios reales y opción de vender extras en 1 clic (revisión de técnica, guías) cobrados por Stripe Connect.

B. Retención Activa y Productividad del Coach
 * Semáforo de Riesgo de Abandono: Ordena a los alumnos en Rojo (>5 días sin entrenar), Amarillo (baja adherencia) y Verde, con botón de toque rápido.
 * Informe de "Evolución Total" pre-renovación: Resumen visual enviado 5 días antes de renovar mostrando kilos totales levantados, entrenos cumplidos y cambio físico.
 * Modo "Pausa / Vacaciones" (ej. 15 €/mes): Permite congelar la cuenta en vacaciones sin perder el historial ni cancelar.
 * Revisión rápida de Check-ins (Estilo bandeja única): Vista para revisar fotos, gráficas y responder por audio a 20 clientes en menos de 30 minutos.
 * Clonado de mesociclos con progresión sugerida y banco de respuestas rápidas para el chat.

5. Ecosistema Viral de Crecimiento (Ex-Alumnos y Embajadores)
 * "Modo Diario Alumni" para Ex-Alumnos (Ingresos pasivos compartidos):
   * Un coach genera de media entre 2 y 7 ex-alumnos nuevos al mes (estancia media de 5 meses).
   * Al dar de baja a un alumno, el coach decide si bloquearle o pasarle al Modo Diario Personal (7,99 €/mes), donde el usuario conserva su historial y temporizador offline para entrenar por libre, pero pierde el chat, la dieta y cualquier acceso a otros coaches (mantiene el botón "Volver a contratar a [Su Coach]").
   * Reparto: El coach gana un 20 % recurrente (1,46 €/mes por ex-alumno) descontado automáticamente de su propia factura mensual de Stripe, y tú ingresas 5,47 € netos/mes por usuario (~3.827 €/mes extra al acumular 700 usuarios Alumni).
 * Programa de "Coaches Embajadores":
   * Cada coach tiene un enlace para invitar a otros entrenadores; por cada compañero que se suscriba, recibe un 20 % de descuento recurrente en su propia cuota (con 5 colegas referidos, su app le sale gratis de por vida).
 * "Trae a un amigo" entre alumnos y "Pase de Compañero de Entreno (7 días)":
   * Descuento automático vía Stripe cuando un alumno trae a un amigo, y pase de invitado de 1 semana para entrenar juntos sincronizados.
 * Plantillas Públicas ("Creado con [TuApp]") y Directorio "Encuentra tu Coach":
   * Rutinas públicas compartibles que atraen a otros entrenadores, y un directorio verificado exclusivo para coaches de los planes Growth (99 €) y Scale (149 €).

6. Hoja de Ruta de Captación y Escala (Español e Inglés)
 * Sin barrera de idioma: Para el mercado anglosajón (EE. UU., Reino Unido, Canadá, Australia, donde los coaches cobran 150 $ – 350 $/mes por cliente), apoya los textos, vídeos cortos y chat asíncrono con traducción por IA.
 * Fase 1 (Meses 1–2 — Coste 0 €): Prospección directa en Instagram y LinkedIn (20 mensajes/día) aplicando el "Efecto Espejo": montar una cuenta de prueba con el logo y color del coach antes de escribirle y mandarle la captura.
 * Fase 2 (Mes 3+ — Escala): Activar Google Ads empezando en español (clics más económicos) y escalando a inglés al validar un coste por cliente (CAC) de 40 € – 50 €. Con 1.000 €/mes en Ads (20–25 altas/mes y 4 % de cancelación), alcanzarás los 250 coaches activos entre el mes 13 y el 18, complementado con alianzas con academias y mentores de coaches.
