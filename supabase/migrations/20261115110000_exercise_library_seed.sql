-- =====================================================================
-- Migración 9: los 120 ejercicios de la plataforma (Fase 2, PR 2.2)
--
-- Carga en exercise_library la lista de
-- docs/referencia/biblioteca-ejercicios.md, tal cual (DECISIONES D-071 y
-- D-072), y la reparte a los negocios que ya existen. Los negocios nuevos
-- la reciben con el trigger de la migración 8.
--
-- Sin instrucciones ni vídeos: los pone cada coach (D-074).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EL CATÁLOGO
--    Las filas salen del documento con un script, no escritas a mano. El
--    grupo es el apartado del documento; los valores en inglés de grupo,
--    material y forma de medir son los de D-089.
--    Columnas: clave, inglés, español, grupo, material, medida, unilateral.
-- ---------------------------------------------------------------------
insert into public.exercise_library
  (key, name_en, name_es, muscle_group, equipment, measurement, is_unilateral)
values
  -- Pecho (14)
  ('barbell_bench_press', 'Barbell bench press', 'Press de banca con barra', 'chest', 'barbell', 'weight_reps', false),
  ('incline_barbell_bench_press', 'Incline barbell bench press', 'Press inclinado con barra', 'chest', 'barbell', 'weight_reps', false),
  ('dumbbell_bench_press', 'Dumbbell bench press', 'Press de banca con mancuernas', 'chest', 'dumbbells', 'weight_reps', false),
  ('incline_dumbbell_press', 'Incline dumbbell press', 'Press inclinado con mancuernas', 'chest', 'dumbbells', 'weight_reps', false),
  ('machine_chest_press', 'Machine chest press', 'Press de pecho en máquina', 'chest', 'machine', 'weight_reps', false),
  ('incline_machine_press', 'Incline machine press', 'Press inclinado en máquina', 'chest', 'machine', 'weight_reps', false),
  ('smith_machine_bench_press', 'Smith machine bench press', 'Press de banca en multipower', 'chest', 'machine', 'weight_reps', false),
  ('dumbbell_fly', 'Dumbbell fly', 'Aperturas con mancuernas', 'chest', 'dumbbells', 'weight_reps', false),
  ('pec_deck_fly', 'Pec deck fly', 'Aperturas en máquina (pec deck)', 'chest', 'machine', 'weight_reps', false),
  ('cable_crossover', 'Cable crossover', 'Cruce de poleas', 'chest', 'cable', 'weight_reps', false),
  ('seated_cable_fly', 'Seated cable fly', 'Aperturas en polea sentado', 'chest', 'cable', 'weight_reps', false),
  ('push_up', 'Push-up', 'Flexiones', 'chest', 'bodyweight', 'bodyweight_reps', false),
  ('decline_push_up', 'Decline push-up', 'Flexiones con pies elevados', 'chest', 'bodyweight', 'bodyweight_reps', false),
  ('chest_dip', 'Dip', 'Fondos en paralelas', 'chest', 'bodyweight', 'bodyweight_reps', false),
  -- Espalda (16)
  ('pull_up', 'Pull-up', 'Dominadas', 'back', 'bodyweight', 'bodyweight_reps', false),
  ('chin_up', 'Chin-up', 'Dominadas supinas', 'back', 'bodyweight', 'bodyweight_reps', false),
  ('lat_pulldown', 'Lat pulldown', 'Jalón al pecho', 'back', 'cable', 'weight_reps', false),
  ('neutral_grip_lat_pulldown', 'Neutral-grip lat pulldown', 'Jalón con agarre neutro', 'back', 'cable', 'weight_reps', false),
  ('close_grip_lat_pulldown', 'Close-grip lat pulldown', 'Jalón con agarre estrecho', 'back', 'cable', 'weight_reps', false),
  ('barbell_row', 'Barbell row', 'Remo con barra', 'back', 'barbell', 'weight_reps', false),
  ('dumbbell_row', 'Dumbbell row', 'Remo con mancuerna', 'back', 'dumbbells', 'weight_reps', true),
  ('seated_cable_row', 'Seated cable row', 'Remo en polea baja (Gironda)', 'back', 'cable', 'weight_reps', false),
  ('t_bar_row', 'T-bar row', 'Remo en T', 'back', 'barbell', 'weight_reps', false),
  ('machine_row', 'Machine row', 'Remo en máquina', 'back', 'machine', 'weight_reps', false),
  ('chest_supported_row', 'Chest-supported row', 'Remo con pecho apoyado', 'back', 'machine', 'weight_reps', false),
  ('cable_pullover', 'Cable pullover', 'Pullover en polea', 'back', 'cable', 'weight_reps', false),
  ('deadlift', 'Deadlift', 'Peso muerto', 'back', 'barbell', 'weight_reps', false),
  ('back_extension', 'Back extension', 'Hiperextensiones', 'back', 'bodyweight', 'bodyweight_reps', false),
  ('dumbbell_shrug', 'Dumbbell shrug', 'Encogimientos con mancuernas', 'back', 'dumbbells', 'weight_reps', false),
  ('inverted_row', 'Inverted row', 'Remo invertido', 'back', 'bodyweight', 'bodyweight_reps', false),
  -- Hombro (13)
  ('overhead_press', 'Overhead press', 'Press militar con barra', 'shoulders', 'barbell', 'weight_reps', false),
  ('dumbbell_shoulder_press', 'Dumbbell shoulder press', 'Press de hombro con mancuernas', 'shoulders', 'dumbbells', 'weight_reps', false),
  ('machine_shoulder_press', 'Machine shoulder press', 'Press de hombro en máquina', 'shoulders', 'machine', 'weight_reps', false),
  ('arnold_press', 'Arnold press', 'Press Arnold', 'shoulders', 'dumbbells', 'weight_reps', false),
  ('dumbbell_lateral_raise', 'Dumbbell lateral raise', 'Elevaciones laterales con mancuernas', 'shoulders', 'dumbbells', 'weight_reps', false),
  ('cable_lateral_raise', 'Cable lateral raise', 'Elevaciones laterales en polea', 'shoulders', 'cable', 'weight_reps', true),
  ('machine_lateral_raise', 'Machine lateral raise', 'Elevaciones laterales en máquina', 'shoulders', 'machine', 'weight_reps', false),
  ('front_raise', 'Front raise', 'Elevaciones frontales', 'shoulders', 'dumbbells', 'weight_reps', false),
  ('dumbbell_reverse_fly', 'Dumbbell reverse fly', 'Pájaros con mancuernas', 'shoulders', 'dumbbells', 'weight_reps', false),
  ('reverse_pec_deck', 'Reverse pec deck', 'Pec deck invertido', 'shoulders', 'machine', 'weight_reps', false),
  ('face_pull', 'Face pull', 'Face pull', 'shoulders', 'cable', 'weight_reps', false),
  ('cable_rear_delt_fly', 'Cable rear delt fly', 'Hombro posterior en polea', 'shoulders', 'cable', 'weight_reps', true),
  ('upright_row', 'Upright row', 'Remo al mentón', 'shoulders', 'barbell', 'weight_reps', false),
  -- Bíceps (10)
  ('barbell_curl', 'Barbell curl', 'Curl con barra', 'biceps', 'barbell', 'weight_reps', false),
  ('ez_bar_curl', 'EZ-bar curl', 'Curl con barra Z', 'biceps', 'barbell', 'weight_reps', false),
  ('dumbbell_curl', 'Dumbbell curl', 'Curl con mancuernas', 'biceps', 'dumbbells', 'weight_reps', false),
  ('hammer_curl', 'Hammer curl', 'Curl martillo', 'biceps', 'dumbbells', 'weight_reps', false),
  ('incline_dumbbell_curl', 'Incline dumbbell curl', 'Curl inclinado con mancuernas', 'biceps', 'dumbbells', 'weight_reps', false),
  ('preacher_curl', 'Preacher curl', 'Curl predicador con barra', 'biceps', 'barbell', 'weight_reps', false),
  ('machine_preacher_curl', 'Machine preacher curl', 'Curl predicador en máquina', 'biceps', 'machine', 'weight_reps', false),
  ('cable_curl', 'Cable curl', 'Curl en polea', 'biceps', 'cable', 'weight_reps', false),
  ('cable_hammer_curl', 'Cable hammer curl', 'Curl martillo en polea', 'biceps', 'cable', 'weight_reps', false),
  ('concentration_curl', 'Concentration curl', 'Curl concentrado', 'biceps', 'dumbbells', 'weight_reps', true),
  -- Tríceps (10)
  ('triceps_pushdown', 'Triceps pushdown', 'Extensión de tríceps en polea', 'triceps', 'cable', 'weight_reps', false),
  ('rope_pushdown', 'Rope pushdown', 'Extensión de tríceps con cuerda', 'triceps', 'cable', 'weight_reps', false),
  ('overhead_cable_triceps_extension', 'Overhead cable triceps extension', 'Extensión de tríceps sobre la cabeza en polea', 'triceps', 'cable', 'weight_reps', false),
  ('skull_crusher', 'Skull crusher', 'Press francés', 'triceps', 'barbell', 'weight_reps', false),
  ('overhead_dumbbell_triceps_extension', 'Overhead dumbbell triceps extension', 'Extensión de tríceps sobre la cabeza con mancuerna', 'triceps', 'dumbbells', 'weight_reps', false),
  ('triceps_kickback', 'Triceps kickback', 'Patada de tríceps', 'triceps', 'dumbbells', 'weight_reps', true),
  ('close_grip_bench_press', 'Close-grip bench press', 'Press de banca con agarre cerrado', 'triceps', 'barbell', 'weight_reps', false),
  ('bench_dip', 'Bench dip', 'Fondos en banco', 'triceps', 'bodyweight', 'bodyweight_reps', false),
  ('diamond_push_up', 'Diamond push-up', 'Flexiones diamante', 'triceps', 'bodyweight', 'bodyweight_reps', false),
  ('sphinx_push_up', 'Sphinx push-up', 'Flexiones esfinge', 'triceps', 'bodyweight', 'bodyweight_reps', false),
  -- Antebrazo (3)
  ('wrist_curl', 'Wrist curl', 'Curl de muñeca', 'forearms', 'barbell', 'weight_reps', false),
  ('reverse_curl', 'Reverse curl', 'Curl inverso', 'forearms', 'barbell', 'weight_reps', false),
  ('farmers_walk', 'Farmer''s walk', 'Paseo del granjero', 'forearms', 'dumbbells', 'distance', false),
  -- Cuádriceps (13)
  ('back_squat', 'Back squat', 'Sentadilla con barra', 'quads', 'barbell', 'weight_reps', false),
  ('front_squat', 'Front squat', 'Sentadilla frontal', 'quads', 'barbell', 'weight_reps', false),
  ('smith_machine_squat', 'Smith machine squat', 'Sentadilla en multipower', 'quads', 'machine', 'weight_reps', false),
  ('hack_squat', 'Hack squat', 'Sentadilla hack', 'quads', 'machine', 'weight_reps', false),
  ('pendulum_squat', 'Pendulum squat', 'Sentadilla péndulo', 'quads', 'machine', 'weight_reps', false),
  ('leg_press', 'Leg press', 'Prensa de piernas', 'quads', 'machine', 'weight_reps', false),
  ('leg_extension', 'Leg extension', 'Extensión de cuádriceps', 'quads', 'machine', 'weight_reps', false),
  ('bulgarian_split_squat', 'Bulgarian split squat', 'Sentadilla búlgara', 'quads', 'dumbbells', 'weight_reps', true),
  ('dumbbell_lunge', 'Dumbbell lunge', 'Zancadas con mancuernas', 'quads', 'dumbbells', 'weight_reps', false),
  ('goblet_squat', 'Goblet squat', 'Sentadilla goblet', 'quads', 'dumbbells', 'weight_reps', false),
  ('step_up', 'Step-up', 'Subida al cajón', 'quads', 'dumbbells', 'weight_reps', true),
  ('bodyweight_squat', 'Bodyweight squat', 'Sentadilla con peso corporal', 'quads', 'bodyweight', 'bodyweight_reps', false),
  ('pistol_squat', 'Pistol squat', 'Sentadilla a una pierna', 'quads', 'bodyweight', 'bodyweight_reps', true),
  -- Femoral (8)
  ('romanian_deadlift', 'Romanian deadlift', 'Peso muerto rumano con barra', 'hamstrings', 'barbell', 'weight_reps', false),
  ('dumbbell_romanian_deadlift', 'Dumbbell Romanian deadlift', 'Peso muerto rumano con mancuernas', 'hamstrings', 'dumbbells', 'weight_reps', false),
  ('stiff_leg_deadlift', 'Stiff-leg deadlift', 'Peso muerto con piernas rígidas', 'hamstrings', 'barbell', 'weight_reps', false),
  ('lying_leg_curl', 'Lying leg curl', 'Curl femoral tumbado', 'hamstrings', 'machine', 'weight_reps', false),
  ('seated_leg_curl', 'Seated leg curl', 'Curl femoral sentado', 'hamstrings', 'machine', 'weight_reps', false),
  ('good_morning', 'Good morning', 'Buenos días', 'hamstrings', 'barbell', 'weight_reps', false),
  ('nordic_hamstring_curl', 'Nordic hamstring curl', 'Curl nórdico', 'hamstrings', 'bodyweight', 'bodyweight_reps', false),
  ('single_leg_romanian_deadlift', 'Single-leg Romanian deadlift', 'Peso muerto rumano a una pierna', 'hamstrings', 'dumbbells', 'weight_reps', true),
  -- Glúteo (8)
  ('barbell_hip_thrust', 'Barbell hip thrust', 'Hip thrust con barra', 'glutes', 'barbell', 'weight_reps', false),
  ('machine_hip_thrust', 'Machine hip thrust', 'Hip thrust en máquina', 'glutes', 'machine', 'weight_reps', false),
  ('glute_bridge', 'Glute bridge', 'Puente de glúteo', 'glutes', 'bodyweight', 'bodyweight_reps', false),
  ('cable_glute_kickback', 'Cable glute kickback', 'Patada de glúteo en polea', 'glutes', 'cable', 'weight_reps', true),
  ('machine_glute_kickback', 'Machine glute kickback', 'Patada de glúteo en máquina', 'glutes', 'machine', 'weight_reps', true),
  ('hip_abduction_machine', 'Hip abduction machine', 'Abducción de cadera en máquina', 'glutes', 'machine', 'weight_reps', false),
  ('sumo_deadlift', 'Sumo deadlift', 'Peso muerto sumo', 'glutes', 'barbell', 'weight_reps', false),
  ('cable_pull_through', 'Cable pull-through', 'Pull-through en polea', 'glutes', 'cable', 'weight_reps', false),
  -- Aductores (2)
  ('hip_adduction_machine', 'Hip adduction machine', 'Aducción de cadera en máquina', 'adductors', 'machine', 'weight_reps', false),
  ('copenhagen_plank', 'Copenhagen plank', 'Plancha Copenhague', 'adductors', 'bodyweight', 'time', true),
  -- Gemelo (4)
  ('standing_calf_raise', 'Standing calf raise', 'Elevación de talones de pie', 'calves', 'machine', 'weight_reps', false),
  ('seated_calf_raise', 'Seated calf raise', 'Elevación de talones sentado', 'calves', 'machine', 'weight_reps', false),
  ('leg_press_calf_raise', 'Leg press calf raise', 'Elevación de talones en prensa', 'calves', 'machine', 'weight_reps', false),
  ('single_leg_calf_raise', 'Single-leg calf raise', 'Elevación de talones a una pierna', 'calves', 'bodyweight', 'bodyweight_reps', true),
  -- Abdomen (11)
  ('crunch', 'Crunch', 'Crunch abdominal', 'abs', 'bodyweight', 'bodyweight_reps', false),
  ('cable_crunch', 'Cable crunch', 'Crunch en polea', 'abs', 'cable', 'weight_reps', false),
  ('machine_crunch', 'Machine crunch', 'Crunch en máquina', 'abs', 'machine', 'weight_reps', false),
  ('hanging_leg_raise', 'Hanging leg raise', 'Elevación de piernas colgado', 'abs', 'bodyweight', 'bodyweight_reps', false),
  ('lying_leg_raise', 'Lying leg raise', 'Elevación de piernas tumbado', 'abs', 'bodyweight', 'bodyweight_reps', false),
  ('plank', 'Plank', 'Plancha', 'abs', 'bodyweight', 'time', false),
  ('side_plank', 'Side plank', 'Plancha lateral', 'abs', 'bodyweight', 'time', true),
  ('ab_wheel_rollout', 'Ab wheel rollout', 'Rueda abdominal', 'abs', 'other', 'bodyweight_reps', false),
  ('russian_twist', 'Russian twist', 'Giro ruso', 'abs', 'bodyweight', 'bodyweight_reps', false),
  ('pallof_press', 'Pallof press', 'Press Pallof', 'abs', 'cable', 'weight_reps', true),
  ('mountain_climbers', 'Mountain climbers', 'Escaladores', 'abs', 'bodyweight', 'time', false),
  -- Cuerpo completo (4)
  ('kettlebell_swing', 'Kettlebell swing', 'Swing con kettlebell', 'full_body', 'kettlebell', 'weight_reps', false),
  ('burpee', 'Burpee', 'Burpees', 'full_body', 'bodyweight', 'bodyweight_reps', false),
  ('power_clean', 'Power clean', 'Cargada de potencia', 'full_body', 'barbell', 'weight_reps', false),
  ('sled_push', 'Sled push', 'Empuje de trineo', 'full_body', 'other', 'distance', false),
  -- Cardio (4)
  ('treadmill', 'Treadmill', 'Cinta de correr', 'cardio', 'machine', 'distance', false),
  ('stationary_bike', 'Stationary bike', 'Bicicleta estática', 'cardio', 'machine', 'time', false),
  ('rowing_machine', 'Rowing machine', 'Remo ergómetro', 'cardio', 'machine', 'distance', false),
  ('jump_rope', 'Jump rope', 'Comba', 'cardio', 'other', 'time', false)
;


-- ---------------------------------------------------------------------
-- 2. LA COPIA PARA LOS NEGOCIOS QUE YA EXISTEN
--    En una función para poder repetirla: cuando la plataforma añada
--    ejercicios al catálogo, la migración que los añada la vuelve a llamar
--    (D-071). Solo pone los que faltan: no duplica nada y no toca los que
--    el coach haya cambiado o archivado.
--    Sin permisos para nadie (D-032): solo se llama desde una migración.
-- ---------------------------------------------------------------------
create function public.copy_exercise_library_to_all_tenants()
returns void
language sql set search_path = '' as $$
  insert into public.exercises
    (tenant_id, library_key, measurement, is_unilateral, muscle_group, equipment)
  select t.id, l.key, l.measurement, l.is_unilateral, l.muscle_group, l.equipment
  from public.tenants t
  cross join public.exercise_library l
  on conflict (tenant_id, library_key) do nothing;
$$;

select public.copy_exercise_library_to_all_tenants();
