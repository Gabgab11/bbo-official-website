-- Booking form: phone, event date, country, city, venue and length of
-- ministration are now required (27 Oct 2026).
--
-- New columns are added alongside the old free-text `location`, which is kept
-- for requests received before this change. The rules apply to new requests
-- only, through the insert trigger, so older rows stay valid.

alter table public.booking_inquiries
  add column if not exists country text check (country is null or char_length(country) between 1 and 60),
  add column if not exists city text check (city is null or char_length(city) between 1 and 80),
  add column if not exists venue text check (venue is null or char_length(venue) between 1 and 160),
  add column if not exists duration text check (duration is null or duration in ('30 minutes', '1 hour', '2 hours', '4 hours', '7 hours'));

grant insert (country, city, venue, duration) on public.booking_inquiries to anon, authenticated;

-- Duplicate of booking_inquiries_created_at_idx.
drop index if exists public.booking_inquiries_created_idx;

create or replace function private.limit_booking_inquiries()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Required details (the website checks these too; this stops direct API calls).
  if coalesce(btrim(new.phone), '') !~ '^\+?[0-9 ()\-]{7,25}$' then
    raise exception 'Enter a phone number.' using errcode = '22023';
  end if;
  if new.event_date is null or new.event_date < (now() at time zone 'Africa/Lagos')::date - 1 then
    raise exception 'Choose a date for the event.' using errcode = '22023';
  end if;
  if coalesce(btrim(new.country), '') = '' or coalesce(btrim(new.city), '') = '' or coalesce(btrim(new.venue), '') = '' then
    raise exception 'Enter the country, city and venue.' using errcode = '22023';
  end if;
  if new.duration is null then
    raise exception 'Choose how long BBO is to minister.' using errcode = '22023';
  end if;
  new.location := left(concat_ws(', ', btrim(new.venue), btrim(new.city), btrim(new.country)), 160);

  -- Flood protection.
  if (select count(*) from public.booking_inquiries
      where lower(email) = lower(new.email) and created_at > now() - interval '24 hours') >= 3 then
    raise exception 'Too many booking requests from this email address. Please try again tomorrow.'
      using errcode = 'P0001', hint = 'rate_limited';
  end if;
  if (select count(*) from public.booking_inquiries
      where created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'The booking form is busy. Please try again in a few minutes.'
      using errcode = 'P0001', hint = 'rate_limited';
  end if;
  return new;
end;
$$;
revoke all on function private.limit_booking_inquiries() from public, anon, authenticated;
