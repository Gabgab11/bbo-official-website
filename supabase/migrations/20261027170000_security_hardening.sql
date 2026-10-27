-- Security hardening (27 Oct 2026)
--
-- 1. Visitors no longer see which team member last edited the site text.
-- 2. Flood protection on the two public forms, enforced in the database so it
--    cannot be bypassed by calling the API directly:
--      bookings:   at most 3 per email address per 24 hours, and at most 20
--                  from everyone together per 10 minutes;
--      newsletter: at most 60 new sign-ups per 10 minutes.

revoke select on public.site_content from anon;
grant select (key, value, updated_at) on public.site_content to anon;

create index if not exists booking_inquiries_email_created_idx
  on public.booking_inquiries (lower(email), created_at desc);
create index if not exists booking_inquiries_created_idx
  on public.booking_inquiries (created_at desc);
create index if not exists newsletter_subscribers_created_idx
  on public.newsletter_subscribers (created_at desc);

create or replace function private.limit_booking_inquiries()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
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

drop trigger if exists limit_booking_inquiries on public.booking_inquiries;
create trigger limit_booking_inquiries
  before insert on public.booking_inquiries
  for each row execute function private.limit_booking_inquiries();

create or replace function private.limit_newsletter_signups()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.newsletter_subscribers
      where created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'Sign-ups are busy. Please try again in a few minutes.'
      using errcode = 'P0001', hint = 'rate_limited';
  end if;
  return new;
end;
$$;
revoke all on function private.limit_newsletter_signups() from public, anon, authenticated;

drop trigger if exists limit_newsletter_signups on public.newsletter_subscribers;
create trigger limit_newsletter_signups
  before insert on public.newsletter_subscribers
  for each row execute function private.limit_newsletter_signups();
