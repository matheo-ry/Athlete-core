-- =====================================================================
-- Migración 6: guardar la marca del negocio (Fase 1, PR 1.15, D-057)
--
-- La marca la ven todos los clientes del coach. Desde ahora solo se guarda
-- con update_brand, que comprueba que quien la cambia es el dueño y que el
-- nombre, los colores y el modo son válidos. El nombre del negocio y el de la
-- marca son el mismo (D-057): se guardan a la vez. El logo llega en el PR 1.16
-- y aquí se conserva tal cual.
-- =====================================================================

create function public.update_brand(
  p_tenant  uuid,
  p_name    text,
  p_primary text,
  p_accent  text,
  p_mode    text
)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_name text := trim(coalesce(p_name, ''));
begin
  if not public.is_member(p_tenant, array['owner']) then
    raise exception 'not_allowed';
  end if;
  if char_length(v_name) not between 2 and 40 then
    raise exception 'invalid_name';
  end if;
  if coalesce(p_primary, '') !~ '^#[0-9A-Fa-f]{6}$'
     or coalesce(p_accent, '') !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'invalid_color';
  end if;
  if coalesce(p_mode, '') not in ('light', 'dark') then
    raise exception 'invalid_mode';
  end if;

  update public.tenants
  set name = v_name,
      branding = jsonb_build_object(
        'appName', v_name,
        -- Si todavía no hay logo, queda en null.
        'logoPath', branding -> 'logoPath',
        'colors', jsonb_build_object('primary', upper(p_primary), 'accent', upper(p_accent)),
        'mode', p_mode
      )
  where id = p_tenant;

  insert into public.audit_log (tenant_id, actor_id, action)
  values (p_tenant, auth.uid(), 'tenant.brand_updated');
end;
$$;

grant execute on function public.update_brand(uuid, text, text, text, text) to authenticated;

-- El nombre y la marca ya no se cambian a mano: así no puede quedar una marca
-- rota ni un nombre de negocio distinto del de la marca. "settings" sigue igual.
revoke update (name, branding) on public.tenants from authenticated;
