-- Booking inquiries and newsletter subscribers for the BBO website.
-- Applied to Supabase project "bbo-official-website" (ref yijgkqzdnjpewtdsyach).
-- The website (anon / publishable key) may only INSERT. Reading, updating and
-- deleting is done from the Supabase dashboard by the site owner.

create table public.booking_inquiries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or char_length(phone) <= 40),
  event_type text not null check (char_length(event_type) between 1 and 60),
  event_date date,
  location text check (location is null or char_length(location) <= 160),
  details text not null check (char_length(details) between 10 and 4000),
  status text not null default 'new' check (status in ('new','contacted','confirmed','declined'))
);

create table public.newsletter_subscribers (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consent boolean not null check (consent = true),
  source text not null default 'website' check (char_length(source) <= 40)
);
create unique index newsletter_subscribers_email_key on public.newsletter_subscribers (lower(email));
create index booking_inquiries_created_at_idx on public.booking_inquiries (created_at desc);

alter table public.booking_inquiries enable row level security;
alter table public.newsletter_subscribers enable row level security;

revoke all on public.booking_inquiries from anon, authenticated;
revoke all on public.newsletter_subscribers from anon, authenticated;
grant insert (first_name, last_name, email, phone, event_type, event_date, location, details) on public.booking_inquiries to anon;
grant insert (email, consent, source) on public.newsletter_subscribers to anon;

create policy "Public can submit booking inquiries" on public.booking_inquiries
  for insert to anon with check (status = 'new');
create policy "Public can subscribe to newsletter" on public.newsletter_subscribers
  for insert to anon with check (consent = true);

-- ---------------------------------------------------------------------------
-- Newsletter: store emails in lowercase, one row per address, and subscribe
-- only through a narrow function so duplicates are ignored without giving the
-- public any read access to the subscriber list.
-- ---------------------------------------------------------------------------
drop index if exists public.newsletter_subscribers_email_key;
alter table public.newsletter_subscribers
  add constraint newsletter_subscribers_email_lowercase check (email = lower(email)),
  add constraint newsletter_subscribers_email_key unique (email);

create or replace function public.subscribe_newsletter(p_email text, p_consent boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
  on conflict (email) do nothing;
end;
$$;

revoke all on function public.subscribe_newsletter(text, boolean) from public;
grant execute on function public.subscribe_newsletter(text, boolean) to anon;

drop policy if exists "Public can subscribe to newsletter" on public.newsletter_subscribers;
revoke insert on public.newsletter_subscribers from anon;
