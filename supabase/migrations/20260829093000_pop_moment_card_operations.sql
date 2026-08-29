create table if not exists public.pop_moment_card_orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique,
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254),
  occasion text,
  message text,
  card_count integer not null default 1 check (card_count between 1 and 50),
  base_amount_cents integer not null default 19900 check (base_amount_cents = 19900),
  additional_card_amount_cents integer not null default 1200 check (additional_card_amount_cents = 1200),
  amount_total_cents integer generated always as (base_amount_cents + greatest(card_count - 1, 0) * additional_card_amount_cents) stored,
  payment_status text not null default 'not_requested' check (payment_status in ('not_requested','pending','paid','manual_paid','waived','refunded')),
  status text not null default 'intake_pending' check (status in ('intake_pending','curation_queue','curating','proof_ready','changes_requested','approved','production','delivered','cancelled','failed')),
  stripe_session_id text,
  front_path text,
  back_path text,
  curation_notes text,
  customer_feedback text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pop_moment_card_orders enable row level security;
create index if not exists pop_moment_card_orders_status_idx on public.pop_moment_card_orders(status, created_at desc);
create index if not exists pop_moment_card_orders_payment_idx on public.pop_moment_card_orders(payment_status, created_at desc);

create table if not exists public.pop_moment_card_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.pop_moment_card_orders(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 2 and 80),
  status text,
  source text not null check (source in ('customer','system','admin','stripe','unikmo')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.pop_moment_card_order_events enable row level security;
create index if not exists pop_moment_card_order_events_order_idx on public.pop_moment_card_order_events(order_id, created_at desc);
