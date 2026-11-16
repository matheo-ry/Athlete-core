-- =====================================================================
-- Migración 19: el día saltado (Fase 3, PR 3.2b)
--
-- La regla del día saltado de cada rutina de cliente y los días que
-- faltó (DECISIONES D-082, D-105, D-125 y D-139).
--
-- Van del lado de las rutinas, no de los entrenos: así programs ("Hoy
-- toca", "Asignadas", los avisos) los lee sin importar workouts
-- (ARQUITECTURA §6). Como el resto de las rutinas, desde la app solo se
-- leen: se escriben con funciones. Solo valen con calendario: en modo
-- lista no hay fechas que faltar (D-125).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. LA REGLA DEL DÍA SALTADO, CON SU HISTORIA
--    Una fila por cada cambio, con el día desde el que vale: el cambio no
--    recalcula el pasado (D-125), y para calcular el pasado hay que saber
--    qué regla valía entonces. Sin filas, la regla es "se pierde".
--      lose: se pierde; recover: se recupera en el siguiente descanso;
--      shift: se mueve todo.
-- ---------------------------------------------------------------------
create table public.program_missed_day_rules (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  program_id  uuid not null,
  rule        text not null check (rule in ('lose','recover','shift')),
  -- El día del coach en que la cambió (D-105).
  starts_on   date not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, id),
  -- Si la cambia dos veces el mismo día, vale la última.
  unique (program_id, starts_on),
  foreign key (tenant_id, program_id)
    references public.programs (tenant_id, id) on delete cascade
);
create index program_missed_day_rules_program_idx
  on public.program_missed_day_rules (tenant_id, program_id, starts_on);

create trigger program_missed_day_rules_set_updated_at
  before update on public.program_missed_day_rules
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 2. LOS DÍAS FALTADOS
--    Un día de entreno cuya fecha pasó sin un entreno de ese día (D-125).
--    Quedan apuntados siempre, aunque luego se haga ese día. Guardan el
--    número de día, como los entrenos, por si el coach lo quita después.
-- ---------------------------------------------------------------------
create table public.program_missed_days (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  program_id      uuid not null,
  block_id        uuid,
  program_day_id  uuid,
  day_number      smallint not null check (day_number between 1 and 28),
  missed_on       date not null,
  created_at      timestamptz not null default now(),
  unique (tenant_id, id),
  -- Cada fecha toca un solo día: apuntarla otra vez no la duplica.
  unique (program_id, missed_on),
  foreign key (tenant_id, program_id)
    references public.programs (tenant_id, id) on delete cascade,
  foreign key (tenant_id, program_id, block_id)
    references public.program_blocks (tenant_id, program_id, id) on delete set null (block_id),
  foreign key (tenant_id, program_id, program_day_id)
    references public.program_days (tenant_id, program_id, id) on delete set null (program_day_id)
);
create index program_missed_days_program_idx
  on public.program_missed_days (tenant_id, program_id, missed_on);


-- ---------------------------------------------------------------------
-- 3. EL COACH CAMBIA LA REGLA (D-125)
--    Vale desde su "hoy" (D-105). Una rutina terminada ya no cambia.
-- ---------------------------------------------------------------------
create function public.set_missed_day_rule(p_tenant uuid, p_program uuid, p_rule text, p_today date)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_program public.programs;
begin
  v_program := private.client_program_for_update(p_tenant, p_program);
  perform private.assert_program_start(p_today, v_program.mode, p_today);
  if v_program.ended_at is not null then
    raise exception 'program_already_ended';
  end if;
  if v_program.mode <> 'calendar' then
    raise exception 'invalid_mode';
  end if;
  if p_rule is null or p_rule not in ('lose','recover','shift') then
    raise exception 'invalid_rule';
  end if;

  insert into public.program_missed_day_rules (tenant_id, program_id, rule, starts_on, created_by)
  values (p_tenant, p_program, p_rule, p_today, auth.uid())
  on conflict (program_id, starts_on) do update
  set rule = excluded.rule, created_by = excluded.created_by;

  insert into public.audit_log (tenant_id, actor_id, action, meta)
  values (p_tenant, auth.uid(), 'program.missed_day_rule_changed',
          jsonb_build_object('program_id', p_program, 'user_id', v_program.client_id, 'rule', p_rule));
end;
$$;


-- ---------------------------------------------------------------------
-- 4. LA APP DEL CLIENTE APUNTA LOS DÍAS QUE FALTÓ
--    Al abrirse, con la fecha del móvil (D-105 y D-125). Recibe
--    [ { program_day_id, missed_on } ]. Solo días de entreno de su rutina,
--    desde que empezó y antes de hoy. Lo ya apuntado no se duplica.
-- ---------------------------------------------------------------------
create function public.record_missed_days(p_tenant uuid, p_program uuid, p_days jsonb, p_today date)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_program public.programs;
  v_day     public.program_days;
  v_item    jsonb;
  v_date    date;
begin
  if not public.is_member(p_tenant, array['client']) then
    raise exception 'not_allowed';
  end if;
  select * into v_program from public.programs
  where id = p_program and tenant_id = p_tenant and client_id = auth.uid();
  if not found then
    raise exception 'program_not_found';
  end if;
  perform private.assert_program_start(p_today, v_program.mode, p_today);
  if v_program.mode <> 'calendar' then
    raise exception 'invalid_mode';
  end if;
  if jsonb_typeof(p_days) <> 'array' or jsonb_array_length(p_days) > 100 then
    raise exception 'invalid_days';
  end if;

  for v_item in select value from jsonb_array_elements(p_days) loop
    v_date := (v_item ->> 'missed_on')::date;
    if v_date is null or v_date < v_program.starts_on or v_date >= p_today then
      raise exception 'invalid_date';
    end if;
    select * into v_day from public.program_days
    where id = (v_item ->> 'program_day_id')::uuid and program_id = p_program and kind = 'training';
    if not found then
      raise exception 'invalid_reference';
    end if;
    insert into public.program_missed_days
      (tenant_id, program_id, block_id, program_day_id, day_number, missed_on)
    values (p_tenant, p_program, v_day.block_id, v_day.id, v_day.day_number, v_date)
    on conflict (program_id, missed_on) do nothing;
  end loop;
end;
$$;


-- ---------------------------------------------------------------------
-- 5. PERMISOS Y RLS
--    Como las demás tablas de rutinas: el coach lee las de su negocio; el
--    cliente, las de sus rutinas mientras siga de alta. Nadie escribe
--    directamente.
-- ---------------------------------------------------------------------
grant select on public.program_missed_day_rules, public.program_missed_days to authenticated;
grant execute on function public.set_missed_day_rule(uuid, uuid, text, date)  to authenticated;
grant execute on function public.record_missed_days(uuid, uuid, jsonb, date)  to authenticated;

alter table public.program_missed_day_rules enable row level security;
alter table public.program_missed_days      enable row level security;

create policy program_missed_day_rules_read on public.program_missed_day_rules
  for select to authenticated
  using (
    public.is_member(tenant_id, array['owner','staff'])
    or public.is_program_client(tenant_id, program_id)
  );

create policy program_missed_days_read on public.program_missed_days
  for select to authenticated
  using (
    public.is_member(tenant_id, array['owner','staff'])
    or public.is_program_client(tenant_id, program_id)
  );
