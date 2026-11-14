-- =====================================================================
-- Migración 4: topes de intentos para redes compartidas (DECISIONES D-065)
--
-- Cuando no hay sesión, los intentos se cuentan por conexión (dirección IP).
-- Todos los móviles del wifi de un gimnasio salen por la misma: con los topes
-- de D-052, un coach que da de alta a 15 clientes en una clase los bloquearía
-- entre ellos. Se suben solo los topes por conexión:
--   * comprobar si un email tiene cuenta: de 20 a 60 cada 10 minutos;
--   * códigos de invitación sin sesión: de 10 a 30 equivocados cada 10 minutos.
-- Con sesión, los códigos siguen contando por usuario: 10 (D-052).
-- =====================================================================

create or replace function public.email_status(p_email text)
returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_key       text := private.request_ip();
  v_email     text := lower(trim(coalesce(p_email, '')));
  v_confirmed timestamptz;
begin
  if private.rate_limited('email_status', v_key, 60, interval '10 minutes') then
    raise exception 'rate_limited';
  end if;
  perform private.record_hit('email_status', v_key);

  if v_email = '' or char_length(v_email) > 320 then
    return 'none';
  end if;

  select u.email_confirmed_at into v_confirmed
  from auth.users u
  where lower(u.email) = v_email
    and u.deleted_at is null
    and not u.is_anonymous
  limit 1;

  if not found then
    return 'none';
  end if;

  return case when v_confirmed is null then 'unconfirmed' else 'confirmed' end;
end;
$$;

-- Por usuario ('user:…'), 10 equivocados; por conexión ('ip:…'), 30.
create or replace function private.invite_code_locked(p_key text)
returns boolean
language sql stable set search_path = '' as $$
  select private.is_locked_out(
    'invite_code',
    p_key,
    case when p_key like 'ip:%' then 30 else 10 end,
    interval '10 minutes',
    interval '15 minutes'
  );
$$;
