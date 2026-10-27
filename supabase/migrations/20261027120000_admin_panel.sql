-- ===========================================================================
-- BBO admin panel
--
-- Team members sign in at <site>/#admin. Only people invited by an owner can
-- get an account (one-time invite links, valid 7 days). Everything an admin
-- removes goes to "Recently deleted" and is erased automatically after 30 days.
--
-- The public website reads site text, photos, releases and videos from here;
-- visitors can read only what is published and can never write anything
-- except a booking request or a newsletter sign-up.
-- ===========================================================================

create extension if not exists pg_cron;

-- Helpers live in a schema that is not exposed through the API.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Team
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null default '' check (char_length(name) <= 80),
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

create or replace function private.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'owner');
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.is_owner() from public;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_owner() to anon, authenticated;

create policy "Admins can see the team" on public.admin_users
  for select to authenticated using ((select private.is_admin()));
create policy "Admins can edit their own name" on public.admin_users
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select on public.admin_users to authenticated;
grant update (name) on public.admin_users to authenticated;

create table public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  note text not null default '' check (char_length(note) <= 80),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz,
  used_by uuid references auth.users (id) on delete set null
);
alter table public.admin_invites enable row level security;
-- No policies: invites are only handled through the functions below.

-- ---------------------------------------------------------------------------
-- Site content
-- ---------------------------------------------------------------------------
create table public.site_content (
  key text primary key check (key in ('hero', 'featured', 'about', 'booking', 'newsletter')),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.site_content enable row level security;
create policy "Anyone can read site text" on public.site_content for select to anon, authenticated using (true);
create policy "Admins can change site text" on public.site_content for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
grant select on public.site_content to anon, authenticated;
grant update (value, updated_at, updated_by) on public.site_content to authenticated;

create table public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('static', 'upload')),
  -- static: a photo built into the site code; upload: path prefix in the site-media bucket
  ref text not null check (char_length(ref) <= 200),
  width int not null check (width > 0),
  height int not null check (height > 0),
  alt text not null default '' check (char_length(alt) <= 200),
  in_gallery boolean not null default true,
  gallery_sort int not null default 0,
  on_home boolean not null default false,
  home_sort int not null default 0,
  home_mono boolean not null default false,
  pos text check (pos is null or pos ~ '^\d{1,3}% \d{1,3}%$'),
  pos_mobile text check (pos_mobile is null or pos_mobile ~ '^\d{1,3}% \d{1,3}%$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index gallery_photos_live_idx on public.gallery_photos (gallery_sort) where deleted_at is null;
alter table public.gallery_photos enable row level security;
create policy "Anyone can see published photos" on public.gallery_photos for select to anon
  using (deleted_at is null);
create policy "Admins see all photos" on public.gallery_photos for select to authenticated
  using (deleted_at is null or (select private.is_admin()));
create policy "Admins add photos" on public.gallery_photos for insert to authenticated
  with check ((select private.is_admin()) and kind = 'upload');
create policy "Admins edit photos" on public.gallery_photos for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
grant select on public.gallery_photos to anon, authenticated;
grant insert (kind, ref, width, height, alt, in_gallery, gallery_sort, on_home, home_sort, home_mono, pos, pos_mobile)
  on public.gallery_photos to authenticated;
grant update (alt, in_gallery, gallery_sort, on_home, home_sort, home_mono, pos, pos_mobile, updated_at, deleted_at)
  on public.gallery_photos to authenticated;

create table public.releases (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  credit text not null default '' check (char_length(credit) <= 160),
  kind text not null default 'Single' check (char_length(kind) <= 40),
  year text not null default '' check (year = '' or year ~ '^\d{4}$'),
  href text not null check (href ~ '^https://'),
  store text not null default 'All platforms' check (char_length(store) <= 40),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.releases enable row level security;
create policy "Anyone can see published releases" on public.releases for select to anon using (deleted_at is null);
create policy "Admins see all releases" on public.releases for select to authenticated
  using (deleted_at is null or (select private.is_admin()));
create policy "Admins add releases" on public.releases for insert to authenticated with check ((select private.is_admin()));
create policy "Admins edit releases" on public.releases for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
grant select on public.releases to anon, authenticated;
grant insert (title, credit, kind, year, href, store, sort) on public.releases to authenticated;
grant update (title, credit, kind, year, href, store, sort, updated_at, deleted_at) on public.releases to authenticated;

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text not null check (char_length(title) between 1 and 120),
  credit text not null default '' check (char_length(credit) <= 160),
  embed boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.videos enable row level security;
create policy "Anyone can see published videos" on public.videos for select to anon using (deleted_at is null);
create policy "Admins see all videos" on public.videos for select to authenticated
  using (deleted_at is null or (select private.is_admin()));
create policy "Admins add videos" on public.videos for insert to authenticated with check ((select private.is_admin()));
create policy "Admins edit videos" on public.videos for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
grant select on public.videos to anon, authenticated;
grant insert (youtube_id, title, credit, embed, sort) on public.videos to authenticated;
grant update (youtube_id, title, credit, embed, sort, updated_at, deleted_at) on public.videos to authenticated;

-- ---------------------------------------------------------------------------
-- Bookings and subscribers: admins can read them and move them to the bin
-- ---------------------------------------------------------------------------
alter table public.booking_inquiries add column deleted_at timestamptz;
alter table public.booking_inquiries add column notes text not null default '' check (char_length(notes) <= 2000);
create policy "Admins read bookings" on public.booking_inquiries for select to authenticated using ((select private.is_admin()));
create policy "Admins update bookings" on public.booking_inquiries for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
grant select on public.booking_inquiries to authenticated;
grant update (status, notes, deleted_at) on public.booking_inquiries to authenticated;
-- Signed-in admins can also submit the public form.
grant insert (first_name, last_name, email, phone, event_type, event_date, location, details) on public.booking_inquiries to authenticated;
create policy "Signed-in users can submit booking inquiries" on public.booking_inquiries
  for insert to authenticated with check (status = 'new');

alter table public.newsletter_subscribers add column deleted_at timestamptz;
create policy "Admins read subscribers" on public.newsletter_subscribers for select to authenticated using ((select private.is_admin()));
create policy "Admins update subscribers" on public.newsletter_subscribers for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
grant select on public.newsletter_subscribers to authenticated;
grant update (deleted_at) on public.newsletter_subscribers to authenticated;

-- Someone who signs up again after being removed is restored.
create or replace function public.subscribe_newsletter(p_email text, p_consent boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(btrim(p_email));
begin
  if p_consent is distinct from true then
    raise exception 'Consent is required' using errcode = '22023';
  end if;
  if v_email is null or char_length(v_email) > 254 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Invalid email address' using errcode = '22023';
  end if;
  insert into public.newsletter_subscribers (email, consent, source)
  values (v_email, true, 'website')
  on conflict (email) do update set deleted_at = null;
end;
$$;
grant execute on function public.subscribe_newsletter(text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Photo storage: public to view, only admins can upload or remove
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Admins upload site media" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and (select private.is_admin()));
create policy "Admins replace site media" on storage.objects for update to authenticated
  using (bucket_id = 'site-media' and (select private.is_admin()));
create policy "Admins remove site media" on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and (select private.is_admin()));
create policy "Admins list site media" on storage.objects for select to authenticated
  using (bucket_id = 'site-media' and (select private.is_admin()));

-- ---------------------------------------------------------------------------
-- Team functions
-- ---------------------------------------------------------------------------
create or replace function private.hash_code(p_code text) returns text
language sql immutable set search_path = '' as $$
  select encode(extensions.digest(convert_to(p_code, 'UTF8'), 'sha256'), 'hex');
$$;

-- Owner creates a one-time invite. Returns the code once; only its hash is stored.
create or replace function public.admin_create_invite(p_role text default 'editor', p_note text default '')
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_code text;
begin
  if not private.is_owner() then
    raise exception 'Only an owner can invite team members' using errcode = '42501';
  end if;
  if p_role not in ('owner', 'editor') then
    raise exception 'Unknown role' using errcode = '22023';
  end if;
  v_code := translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/=', '-_');
  insert into public.admin_invites (code_hash, role, note, created_by)
  values (private.hash_code(v_code), p_role, left(coalesce(p_note, ''), 80), auth.uid());
  return v_code;
end;
$$;

-- Anyone holding a valid invite creates their own account with it.
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
    raise exception 'This invite link is not valid. Ask an owner for a new one.' using errcode = '22023';
  end if;
  if v_email is null or char_length(v_email) > 254 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_password, '')) < 10 or char_length(p_password) > 72 then
    raise exception 'Choose a password of 10 to 72 characters.' using errcode = '22023';
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

create or replace function public.admin_list_invites()
returns table (id uuid, role text, note text, created_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select i.id, i.role, i.note, i.created_at, i.expires_at from public.admin_invites i
   where private.is_owner() and i.used_at is null and i.expires_at > now()
   order by i.created_at desc;
$$;

create or replace function public.admin_revoke_invite(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_owner() then raise exception 'Only an owner can do this' using errcode = '42501'; end if;
  update public.admin_invites set expires_at = now() where id = p_id and used_at is null;
end;
$$;

-- Owner removes a team member (their account is closed; their past edits stay).
create or replace function public.admin_remove_member(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_owner() then raise exception 'Only an owner can remove team members' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'You cannot remove yourself' using errcode = '22023'; end if;
  delete from auth.users where id = p_user and id in (select user_id from public.admin_users);
end;
$$;

-- Owner changes someone's role, keeping at least one owner.
create or replace function public.admin_set_role(p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_owner() then raise exception 'Only an owner can change roles' using errcode = '42501'; end if;
  if p_role not in ('owner', 'editor') then raise exception 'Unknown role' using errcode = '22023'; end if;
  if p_role = 'editor' and (select count(*) from public.admin_users where role = 'owner' and user_id <> p_user) = 0 then
    raise exception 'The team needs at least one owner' using errcode = '22023';
  end if;
  update public.admin_users set role = p_role where user_id = p_user;
end;
$$;

-- Returns storage paths of uploaded photos whose 30 days in the bin are over,
-- and removes their records. The admin panel then deletes the files.
create or replace function public.admin_take_expired_uploads()
returns setof text language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  return query
    with gone as (
      delete from public.gallery_photos
       where kind = 'upload' and deleted_at < now() - interval '30 days'
      returning gallery_photos.ref
    )
    select gone.ref from gone;
end;
$$;

revoke all on function public.admin_create_invite(text, text) from public, anon;
revoke all on function public.admin_list_invites() from public, anon;
revoke all on function public.admin_revoke_invite(uuid) from public, anon;
revoke all on function public.admin_remove_member(uuid) from public, anon;
revoke all on function public.admin_set_role(uuid, text) from public, anon;
revoke all on function public.admin_take_expired_uploads() from public, anon;
revoke all on function public.admin_join(text, text, text, text) from public;
grant execute on function public.admin_create_invite(text, text) to authenticated;
grant execute on function public.admin_list_invites() to authenticated;
grant execute on function public.admin_revoke_invite(uuid) to authenticated;
grant execute on function public.admin_remove_member(uuid) to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_take_expired_uploads() to authenticated;
grant execute on function public.admin_join(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 30-day bin: erase anything removed more than 30 days ago, every night
-- (uploaded photo files are erased by the admin panel, see above)
-- ---------------------------------------------------------------------------
create or replace function private.purge_recently_deleted()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.booking_inquiries where deleted_at < now() - interval '30 days';
  delete from public.newsletter_subscribers where deleted_at < now() - interval '30 days';
  delete from public.releases where deleted_at < now() - interval '30 days';
  delete from public.videos where deleted_at < now() - interval '30 days';
  delete from public.gallery_photos where kind = 'static' and deleted_at < now() - interval '30 days';
  delete from public.admin_invites where expires_at < now() - interval '30 days';
end;
$$;
select cron.schedule('bbo-purge-recently-deleted', '17 2 * * *', 'select private.purge_recently_deleted()');
