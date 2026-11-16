-- =====================================================================
-- Los 120 ejercicios de la plataforma (PR 2.2, DECISIONES D-071 y D-072).
-- Comprueba el catálogo real que carga la migración 9, la copia que
-- recibe un negocio nuevo y que repetir la copia no duplica nada.
--
-- Usuarios inventados: A crea un negocio dentro del test.
-- =====================================================================
begin;
-- En staging, el usuario temporal de la CLI (cli_login_postgres) es miembro
-- de postgres pero no asume el rol automáticamente ni tiene permisos sobre
-- "extensions" ni "auth". Asumimos postgres y concedemos uso de "extensions"
-- a public para que pgTAP siga disponible tras cualquier "reset role;".
set local role postgres;
grant usage on schema extensions to public;
create extension if not exists pgtap with schema extensions;
set local search_path to "$user", public, extensions;

select plan(11);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'coach-a@example.test');

-- ----- El catálogo -----
select is((select count(*)::int from public.exercise_library), 120,
  'catálogo: tiene 120 filas');
select is((select count(distinct key)::int from public.exercise_library), 120,
  'catálogo: las 120 claves son distintas');
-- Los apartados de docs/referencia/biblioteca-ejercicios.md, con su número.
select is(
  (select string_agg(muscle_group || ' ' || n, ', ' order by muscle_group)
   from (select muscle_group, count(*) as n from public.exercise_library group by muscle_group) g),
  'abs 11, adductors 2, back 16, biceps 10, calves 4, cardio 4, chest 14, forearms 3, '
  || 'full_body 4, glutes 8, hamstrings 8, quads 13, shoulders 13, triceps 10',
  'catálogo: cada grupo tiene los ejercicios que dice el documento');
-- Tres filas al azar del documento: la 21, la 66 y la 108.
select is(
  (select string_agg(row(key, name_en, name_es, muscle_group, equipment, measurement,
                         is_unilateral)::text, ' ' order by key)
   from public.exercise_library
   where key in ('dumbbell_row', 'farmers_walk', 'side_plank')),
  '(dumbbell_row,"Dumbbell row","Remo con mancuerna",back,dumbbells,weight_reps,t) '
  || '(farmers_walk,"Farmer''s walk","Paseo del granjero",forearms,dumbbells,distance,f) '
  || '(side_plank,"Side plank","Plancha lateral",abs,bodyweight,time,t)',
  'catálogo: tres filas coinciden con el documento');

-- ----- Un negocio nuevo recibe los 120 -----
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}';
select set_config('t.ta', public.create_tenant('Coach A', 'test-terms')::text, true);
select is(
  (select count(*)::int from public.exercises where tenant_id = current_setting('t.ta')::uuid),
  120, 'copia: un negocio nuevo recibe 120 ejercicios');
select is(
  (select count(*)::int from public.exercises e
   join public.exercise_library l on l.key = e.library_key
   where e.tenant_id = current_setting('t.ta')::uuid
     and e.name is null and e.archived_at is null and e.created_by is null
     and e.instructions is null and e.video_url is null
     and (e.measurement, e.is_unilateral, e.muscle_group, e.equipment)
       = (l.measurement, l.is_unilateral, l.muscle_group, l.equipment)),
  120, 'copia: cada uno lleva los datos del catálogo, sin nombre propio, instrucciones ni vídeo');

-- ----- La copia no es cosa del coach -----
select throws_ok('select public.copy_exercise_library_to_all_tenants()', '42501', null,
  'repetir la copia: un usuario no puede lanzarla');

-- ----- Repetir la copia no duplica nada -----
set local role postgres;
select public.copy_exercise_library_to_all_tenants();
select public.copy_exercise_library_to_all_tenants();
select is(
  (select count(*)::int from public.exercises where tenant_id = current_setting('t.ta')::uuid),
  120, 'repetir la copia: ejecutarla dos veces deja 120');

-- ----- Solo pone los que faltan y no toca los cambiados (D-071) -----
update public.exercises set name = 'Sentadilla de la casa', archived_at = now()
where tenant_id = current_setting('t.ta')::uuid and library_key = 'back_squat';
delete from public.exercises
where tenant_id = current_setting('t.ta')::uuid and library_key = 'plank';
select public.copy_exercise_library_to_all_tenants();
select is(
  (select count(*)::int from public.exercises where tenant_id = current_setting('t.ta')::uuid),
  120, 'repetir la copia: repone el ejercicio que faltaba');
select is(
  (select row(name, archived_at is not null)::text from public.exercises
   where tenant_id = current_setting('t.ta')::uuid and library_key = 'back_squat'),
  '("Sentadilla de la casa",t)',
  'repetir la copia: no toca el ejercicio que el coach cambió y archivó');
select is(
  (select count(*)::int from public.exercises e
   where not exists (select 1 from public.exercises d
                     where d.tenant_id = e.tenant_id and d.library_key = e.library_key and d.id <> e.id)
     and e.library_key is not null
     and e.tenant_id = current_setting('t.ta')::uuid),
  120, 'repetir la copia: ningún ejercicio del catálogo está dos veces');

select * from finish();
rollback;
