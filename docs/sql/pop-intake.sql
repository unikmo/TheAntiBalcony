-- STAGING DRAFT. Not applied by the app. Register as a migration using the
-- Supabase CLI after reviewing/testing against a staging database.
-- No changes to existing Ring/order tables or storage buckets.
begin;
create table public.anti_balcony_pop_requests (
  id uuid primary key,
  submission_key uuid not null unique,
  payload_hash text not null,
  offer text not null check (offer in ('free', 'keep', 'nasdaq')),
  title text not null check (length(title) between 2 and 100),
  email text not null check (length(email) between 3 and 254),
  occasion text not null,
  celebration text not null,
  moment_date date not null,
  source_url text check (source_url is null or (length(source_url) <= 2000 and source_url ~ '^https://')),
  total_cards integer not null,
  subtotal_cents integer not null,
  public_consent boolean not null default false,
  feature_consent boolean not null default false,
  consent_version text not null,
  consent_at timestamptz not null,
  public_approved boolean not null default false,
  status text not null check (status in ('submitted', 'capture_pending', 'in_production', 'ready', 'cancelled')),
  final_video_url text,
  booking_ref text,
  capture_license_ref text,
  review_log jsonb not null default '[]'::jsonb check (jsonb_typeof(review_log) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pop_offer_price check (
    (offer = 'free' and total_cards = 0 and subtotal_cents = 0 and source_url is not null and public_consent)
    or (offer in ('keep', 'nasdaq') and total_cards between 1 and 500 and not public_consent
      and subtotal_cents = (case when offer = 'keep' then 19900 else 54900 end) + (total_cards - 1) * 1200)
  ),
  constraint pop_publication_consent check (not public_approved or (offer = 'free' and public_consent and status <> 'cancelled')),
  constraint pop_paid_production check (status not in ('in_production', 'ready') or offer <> 'free'),
  constraint pop_capture_gate check (offer <> 'nasdaq' or status not in ('in_production', 'ready') or
    (nullif(trim(booking_ref), '') is not null and nullif(trim(capture_license_ref), '') is not null)),
  constraint pop_ready_memory check (status <> 'ready' or (final_video_url is not null and final_video_url ~ '^https://(www\.)?unikmo\.com/'))
);
create index pop_request_queue on public.anti_balcony_pop_requests (created_at desc);
create index pop_request_email_limit on public.anti_balcony_pop_requests (email, created_at);
create index pop_public_moments on public.anti_balcony_pop_requests (created_at desc) where public_approved and offer = 'free';

create table public.anti_balcony_pop_cards (
  token text primary key check (token ~ '^[A-Za-z0-9_-]{43}$'),
  request_id uuid not null references public.anti_balcony_pop_requests(id) on delete cascade,
  ordinal integer not null check (ordinal between 1 and 500),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique(request_id, ordinal)
);
alter table public.anti_balcony_pop_requests enable row level security;
alter table public.anti_balcony_pop_cards enable row level security;
revoke all on public.anti_balcony_pop_requests, public.anti_balcony_pop_cards from public, anon, authenticated;
grant select, insert, update, delete on public.anti_balcony_pop_requests, public.anti_balcony_pop_cards to service_role;
create policy pop_requests_server_only on public.anti_balcony_pop_requests for all to anon, authenticated using (false) with check (false);
create policy pop_cards_server_only on public.anti_balcony_pop_cards for all to anon, authenticated using (false) with check (false);

-- Atomic per-email limit across serverless instances. No in-memory quota.
create function public.anti_balcony_pop_daily_limit() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(lower(new.email), 0));
  if (select count(*) from public.anti_balcony_pop_requests where email = new.email and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'pop_daily_limit';
  end if;
  return new;
end;
$$;
revoke all on function public.anti_balcony_pop_daily_limit() from public, anon, authenticated;
create trigger pop_daily_limit before insert on public.anti_balcony_pop_requests for each row execute function public.anti_balcony_pop_daily_limit();
commit;
