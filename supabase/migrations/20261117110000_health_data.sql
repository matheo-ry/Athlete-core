-- =====================================================================
-- Migración 20: datos de salud (Fase 3, PR 3.3a)
--
-- El consentimiento de datos de salud de cada espacio, el peso corporal
-- y las medidas (DECISIONES D-126, D-127 y D-140).
--
-- Son datos de salud: solo se escriben con el consentimiento dado, y eso
-- lo comprueba la base de datos (RLS y un trigger), no la pantalla. El
-- coach los lee solo mientras su cliente mantenga el consentimiento, y
-- nunca los escribe. Retirarlo borra el peso, las medidas y el texto de
-- las notas del día de ese espacio.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EL CONSENTIMIENTO, UNO POR ESPACIO (cliente y negocio)
--    Una sola fila: darlo otra vez después de retirarlo la reutiliza.
-- ---------------------------------------------------------------------
create table public.health_consents (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  granted_at    timestamptz not null,
  -- La versión del texto que aceptó ("2026-11-draft"…), por si cambia.
  text_version  text not null check (text_version ~ '^[a-z0-9._-]{1,32}$'),
  withdrawn_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, user_id)
);

create trigger health_consents_set_updated_at
  before update on public.health_consents
  for each row execute function public.set_updated_at();

-- ¿Ese usuario tiene dado (y no retirado) el consentimiento en ese negocio?
-- SECURITY DEFINER para usarla en las políticas de las otras tablas.
create function public.has_health_consent(p_tenant uuid, p_user uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.health_consents c
    where c.tenant_id = p_tenant and c.user_id = p_user and c.withdrawn_at is null
  );
$$;


-- ---------------------------------------------------------------------
-- 2. PESO CORPORAL (D-127): uno por día, en kg
-- ---------------------------------------------------------------------
create table public.body_weights (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  measured_on  date not null,
  weight_kg    numeric(5,2) not null check (weight_kg between 20 and 400),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, user_id, measured_on)
);

create trigger body_weights_set_updated_at
  before update on public.body_weights
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 3. MEDIDAS (D-127): lista cerrada, en cm. Brazo, muslo y gemelo llevan
--    lado; las demás, no. Una por día, medida y lado.
-- ---------------------------------------------------------------------
create table public.body_measurements (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  measured_on  date not null,
  kind         text not null check (kind in
                 ('waist','hips','chest','shoulders','neck','arm','thigh','calf')),
  side         text check (side in ('left','right')),
  value_cm     numeric(5,1) not null check (value_cm > 0 and value_cm <= 300),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (tenant_id, id),
  unique nulls not distinct (tenant_id, user_id, measured_on, kind, side),
  check ((kind in ('arm','thigh','calf')) = (side is not null))
);

create trigger body_measurements_set_updated_at
  before update on public.body_measurements
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 4. LAS NOTAS DEL DÍA, SOLO CON CONSENTIMIENTO (D-126)
--    Las escribe sync_workout (SECURITY DEFINER), así que el RLS no basta:
--    un trigger rechaza escribir un texto nuevo sin el consentimiento.
--    Borrarlas (null) siempre vale: es lo que hace retirarlo.
-- ---------------------------------------------------------------------
create function private.check_day_note_consent()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.day_note is not null
     and (tg_op = 'INSERT' or new.day_note is distinct from old.day_note)
     and not public.has_health_consent(new.tenant_id,
           (select w.client_id from public.workouts w
            where w.tenant_id = new.tenant_id and w.id = new.workout_id)) then
    raise exception 'health_consent_required';
  end if;
  return new;
end;
$$;

create trigger workout_exercises_day_note_consent
  before insert or update of day_note on public.workout_exercises
  for each row execute function private.check_day_note_consent();


-- ---------------------------------------------------------------------
-- 5. DAR Y RETIRAR EL CONSENTIMIENTO
--    Solo el propio cliente, en un espacio donde siga de alta. Queda en
--    audit_log sin ningún dato de salud.
-- ---------------------------------------------------------------------
create function public.grant_health_consent(p_tenant uuid, p_text_version text)
returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_member(p_tenant, array['client']) then
    raise exception 'not_allowed';
  end if;
  if p_text_version is null or p_text_version !~ '^[a-z0-9._-]{1,32}$' then
    raise exception 'invalid_text_version';
  end if;

  insert into public.health_consents (tenant_id, user_id, granted_at, text_version)
  values (p_tenant, auth.uid(), now(), p_text_version)
  on conflict (tenant_id, user_id) do update
  set granted_at = excluded.granted_at, text_version = excluded.text_version, withdrawn_at = null;

  insert into public.audit_log (tenant_id, actor_id, action, meta)
  values (p_tenant, auth.uid(), 'health_consent.granted',
          jsonb_build_object('user_id', auth.uid(), 'text_version', p_text_version));
end;
$$;

create function public.withdraw_health_consent(p_tenant uuid)
returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_member(p_tenant, array['client']) then
    raise exception 'not_allowed';
  end if;
  update public.health_consents set withdrawn_at = now()
  where tenant_id = p_tenant and user_id = auth.uid() and withdrawn_at is null;
  if not found then
    raise exception 'consent_not_granted';
  end if;

  delete from public.body_weights      where tenant_id = p_tenant and user_id = auth.uid();
  delete from public.body_measurements where tenant_id = p_tenant and user_id = auth.uid();
  update public.workout_exercises e set day_note = null
  from public.workouts w
  where e.tenant_id = p_tenant and w.tenant_id = p_tenant and w.id = e.workout_id
    and w.client_id = auth.uid() and e.day_note is not null;

  insert into public.audit_log (tenant_id, actor_id, action, meta)
  values (p_tenant, auth.uid(), 'health_consent.withdrawn', jsonb_build_object('user_id', auth.uid()));
end;
$$;


-- ---------------------------------------------------------------------
-- 6. PERMISOS Y RLS
--    El consentimiento: el cliente ve el suyo y el coach, los de su
--    negocio; se escribe solo con las funciones. Peso y medidas: el
--    cliente lee y escribe los suyos (escribir, con consentimiento); el
--    coach los lee mientras haya consentimiento; nadie más.
-- ---------------------------------------------------------------------
grant select on public.health_consents to authenticated;
grant select, insert, update, delete on public.body_weights, public.body_measurements to authenticated;
grant execute on function public.has_health_consent(uuid, uuid)      to authenticated;
grant execute on function public.grant_health_consent(uuid, text)    to authenticated;
grant execute on function public.withdraw_health_consent(uuid)       to authenticated;

alter table public.health_consents   enable row level security;
alter table public.body_weights      enable row level security;
alter table public.body_measurements enable row level security;

create policy health_consents_read on public.health_consents
  for select to authenticated
  using (
    public.is_member(tenant_id, array['owner','staff'])
    or (user_id = auth.uid() and public.is_member(tenant_id, array['client']))
  );

create policy body_weights_read on public.body_weights
  for select to authenticated
  using (
    (user_id = auth.uid() and public.is_member(tenant_id, array['client']))
    or (public.is_member(tenant_id, array['owner','staff'])
        and public.has_health_consent(tenant_id, user_id))
  );
create policy body_weights_write on public.body_weights
  for all to authenticated
  using (user_id = auth.uid() and public.is_member(tenant_id, array['client']))
  with check (user_id = auth.uid() and public.is_member(tenant_id, array['client'])
              and public.has_health_consent(tenant_id, user_id));

create policy body_measurements_read on public.body_measurements
  for select to authenticated
  using (
    (user_id = auth.uid() and public.is_member(tenant_id, array['client']))
    or (public.is_member(tenant_id, array['owner','staff'])
        and public.has_health_consent(tenant_id, user_id))
  );
create policy body_measurements_write on public.body_measurements
  for all to authenticated
  using (user_id = auth.uid() and public.is_member(tenant_id, array['client']))
  with check (user_id = auth.uid() and public.is_member(tenant_id, array['client'])
              and public.has_health_consent(tenant_id, user_id));
