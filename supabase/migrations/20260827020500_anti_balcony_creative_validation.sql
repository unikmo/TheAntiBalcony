alter table public.anti_balcony_orders
  add column if not exists creative_width integer,
  add column if not exists creative_height integer,
  add column if not exists creative_duration_seconds numeric(7,3);

alter table public.anti_balcony_orders
  alter column creative_width set not null,
  alter column creative_height set not null;

alter table public.anti_balcony_orders
  drop constraint if exists anti_balcony_orders_creative_dimensions_check,
  add constraint anti_balcony_orders_creative_dimensions_check check (
    creative_width > 0
    and creative_height > creative_width
    and abs((creative_width::numeric / creative_height::numeric) - (9::numeric / 16::numeric)) <= 0.015
  ),
  drop constraint if exists anti_balcony_orders_creative_duration_check,
  add constraint anti_balcony_orders_creative_duration_check check (
    (
      creative_content_type like 'video/%'
      and creative_duration_seconds between 14.5 and 15.5
    )
    or (
      creative_content_type like 'image/%'
      and creative_duration_seconds is null
    )
  );

comment on column public.anti_balcony_orders.creative_width is
  'Browser-inspected source width; operator review remains authoritative.';
comment on column public.anti_balcony_orders.creative_duration_seconds is
  'Required for video masters and constrained to the 15-second delivery specification.';
