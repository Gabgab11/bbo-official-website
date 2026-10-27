-- Password reset links: an owner creates a one-time link for a team member who
-- forgot their password (valid 2 days). Opening it lets them choose a new one.
-- Uses the same one-time code mechanism as invites, so no email service is needed.

alter table public.admin_invites add column reset_user uuid references auth.users (id) on delete cascade;

create or replace function public.admin_create_reset(p_user uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_code text;
begin
  if not private.is_owner() then raise exception 'Only an owner can create reset links' using errcode = '42501'; end if;
  if not exists (select 1 from public.admin_users where user_id = p_user) then
    raise exception 'That person is not on the team' using errcode = '22023';
  end if;
  -- Any earlier unused reset link for this person stops working.
  update public.admin_invites set expires_at = now() where reset_user = p_user and used_at is null;
  v_code := translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/=', '-_');
  insert into public.admin_invites (code_hash, role, note, created_by, expires_at, reset_user)
  values (private.hash_code(v_code), 'editor', 'Password reset', auth.uid(), now() + interval '2 days', p_user);
  return v_code;
end;
$$;

-- What a link is for, so the page can show the right form. Reveals nothing for an invalid code.
create or replace function public.admin_invite_info(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when i.reset_user is null
    then jsonb_build_object('kind', 'invite', 'role', i.role)
    else jsonb_build_object('kind', 'reset', 'email', (select u.email from public.admin_users u where u.user_id = i.reset_user))
  end
  from public.admin_invites i
  where i.code_hash = private.hash_code(coalesce(p_code, '')) and i.used_at is null and i.expires_at > now();
$$;

create or replace function public.admin_join(p_code text, p_email text, p_password text, p_name text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_invite public.admin_invites%rowtype;
  v_email text := lower(btrim(p_email));
  v_id uuid := gen_random_uuid();
begin
  select * into v_invite from public.admin_invites
   where code_hash = private.hash_code(coalesce(p_code, '')) for update;
  if not found or v_invite.used_at is not null or v_invite.expires_at < now() then
    raise exception 'This link is not valid any more. Ask an owner for a new one.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_password, '')) < 10 or char_length(p_password) > 72 then
    raise exception 'Choose a password of 10 to 72 characters.' using errcode = '22023';
  end if;

  -- Password reset for an existing team member.
  if v_invite.reset_user is not null then
    update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf', 10)), updated_at = now()
     where id = v_invite.reset_user;
    update public.admin_invites set used_at = now(), used_by = v_invite.reset_user where id = v_invite.id;
    return;
  end if;

  if v_email is null or char_length(v_email) > 254 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address.' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'An account with this email already exists. Sign in instead.' using errcode = '23505';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
    '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true), 'email', now(), now(), now());

  insert into public.admin_users (user_id, email, name, role)
  values (v_id, v_email, left(btrim(coalesce(p_name, '')), 80), v_invite.role);
  update public.admin_invites set used_at = now(), used_by = v_id where id = v_invite.id;
end;
$$;

-- Pending invites list leaves out reset links.
create or replace function public.admin_list_invites()
returns table (id uuid, role text, note text, created_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select i.id, i.role, i.note, i.created_at, i.expires_at from public.admin_invites i
   where private.is_owner() and i.used_at is null and i.expires_at > now() and i.reset_user is null
   order by i.created_at desc;
$$;

revoke all on function public.admin_create_reset(uuid) from public, anon;
grant execute on function public.admin_create_reset(uuid) to authenticated;
revoke all on function public.admin_invite_info(text) from public;
grant execute on function public.admin_invite_info(text) to anon, authenticated;
revoke all on function public.admin_join(text, text, text, text) from public;
grant execute on function public.admin_join(text, text, text, text) to anon, authenticated;
revoke all on function public.admin_list_invites() from public, anon;
grant execute on function public.admin_list_invites() to authenticated;
