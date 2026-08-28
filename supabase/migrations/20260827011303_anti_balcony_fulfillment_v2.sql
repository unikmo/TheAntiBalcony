create table if not exists public.anti_balcony_orders (
  id uuid primary key,
  order_ref text not null unique,
  access_token_hash text not null check (char_length(access_token_hash) = 64),
  ring_id uuid not null references public.anti_balcony_rings(id) on delete restrict,
  startup_name text not null check (char_length(startup_name) between 2 and 80),
  email text not null check (char_length(email) between 5 and 254),
  tier text not null check (tier in ('snapshot', 'video', 'takeover', 'vip')),
  board text not null default 'nasdaq_tower' check (board in ('nasdaq_tower')),
  master_format text not null default '9:16' check (master_format in ('9:16')),
  timezone text not null check (char_length(timezone) between 3 and 80),
  requested_window_start timestamptz not null,
  requested_window_end timestamptz not null,
  alternative_window_start timestamptz,
  alternative_window_end timestamptz,
  allow_social boolean not null default false,
  rights_accepted_at timestamptz not null,
  qr_policy_accepted_at timestamptz not null,
  capture_consent_at timestamptz not null,
  terms_accepted_at timestamptz not null,
  privacy_acknowledged_at timestamptz not null,
  status text not null default 'creative_upload_pending' check (
    status in (
      'creative_upload_pending',
      'availability_check',
      'creative_review',
      'needs_changes',
      'payment_pending',
      'booked',
      'scheduled',
      'played',
      'capture_required',
      'capture_processing',
      'capture_ready',
      'packaging_required',
      'packaging',
      'proof_ready',
      'delivered',
      'cancelled',
      'failed'
    )
  ),
  payment_status text not null default 'not_requested' check (
    payment_status in ('not_requested', 'pending', 'manual_paid', 'waived', 'refunded')
  ),
  creative_path text,
  creative_filename text,
  creative_content_type text,
  creative_size_bytes bigint check (creative_size_bytes is null or creative_size_bytes > 0),
  creative_received_at timestamptz,
  creative_review_notes text,
  provider_name text not null default 'blindspot',
  provider_campaign_id text,
  provider_ref text,
  provider_moderation_status text,
  provider_proof_of_play_ref text,
  scheduled_window_start timestamptz,
  scheduled_window_end timestamptz,
  played_at timestamptz,
  capture_provider text,
  capture_job_id text,
  capture_path text,
  capture_started_at timestamptz,
  capture_completed_at timestamptz,
  render_provider text,
  render_job_id text,
  render_callback_token_hash text check (
    render_callback_token_hash is null or char_length(render_callback_token_hash) = 64
  ),
  render_error text,
  deliverable_video_path text,
  deliverable_image_path text,
  delivery_email_id text,
  delivered_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requested_window_end = requested_window_start + interval '1 hour'),
  check (
    (alternative_window_start is null and alternative_window_end is null)
    or (
      alternative_window_start is not null
      and alternative_window_end is not null
      and alternative_window_end = alternative_window_start + interval '1 hour'
    )
  ),
  check (
    (scheduled_window_start is null and scheduled_window_end is null)
    or (
      scheduled_window_start is not null
      and scheduled_window_end is not null
      and scheduled_window_end = scheduled_window_start + interval '1 hour'
    )
  )
);

create table if not exists public.anti_balcony_order_events (
  id uuid primary key,
  order_id uuid not null references public.anti_balcony_orders(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 2 and 80),
  status text,
  source text not null check (source in ('customer', 'system', 'operations', 'blindspot', 'capture', 'shotstack', 'email')),
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (order_id, idempotency_key)
);

create index if not exists anti_balcony_orders_ring_idx
  on public.anti_balcony_orders (ring_id, created_at desc);
create index if not exists anti_balcony_orders_status_idx
  on public.anti_balcony_orders (status, created_at asc);
create index if not exists anti_balcony_orders_email_idx
  on public.anti_balcony_orders (lower(email), created_at desc);
create index if not exists anti_balcony_order_events_order_idx
  on public.anti_balcony_order_events (order_id, created_at asc);

alter table public.anti_balcony_orders enable row level security;
alter table public.anti_balcony_order_events enable row level security;

drop policy if exists "anti_balcony_orders_deny_direct_access" on public.anti_balcony_orders;
create policy "anti_balcony_orders_deny_direct_access"
  on public.anti_balcony_orders
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "anti_balcony_order_events_deny_direct_access" on public.anti_balcony_order_events;
create policy "anti_balcony_order_events_deny_direct_access"
  on public.anti_balcony_order_events
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.anti_balcony_orders from anon, authenticated;
revoke all on table public.anti_balcony_order_events from anon, authenticated;
grant all on table public.anti_balcony_orders to service_role;
grant all on table public.anti_balcony_order_events to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'anti-balcony-creative',
    'anti-balcony-creative',
    false,
    262144000,
    array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']::text[]
  ),
  (
    'anti-balcony-capture',
    'anti-balcony-capture',
    false,
    1073741824,
    array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']::text[]
  ),
  (
    'anti-balcony-deliverables',
    'anti-balcony-deliverables',
    false,
    536870912,
    array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']::text[]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

comment on table public.anti_balcony_orders is
  'Non-Stripe Times Square order requests, provider booking state, licensed capture, packaging and delivery.';
comment on table public.anti_balcony_order_events is
  'Append-only operational audit trail for AntiBalcony orders and provider callbacks.';
comment on column public.anti_balcony_orders.access_token_hash is
  'SHA-256 hash of the customer capability token. The raw token is never stored.';
comment on column public.anti_balcony_orders.provider_proof_of_play_ref is
  'Blindspot or media-owner proof-of-play identifier; distinct from licensed visual capture.';
