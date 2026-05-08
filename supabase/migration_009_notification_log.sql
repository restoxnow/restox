-- Migration 009: notification_log table

create table if not exists public.notification_log (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  schedule_id         uuid references public.purchase_schedules(id) on delete set null,
  product_name        text,
  retailer_name       text,
  notification_type   text not null default 'upcoming_order',
  channel             text not null default 'email',
  status              text not null default 'sent',
  created_at          timestamptz not null default now()
);

alter table public.notification_log enable row level security;

create policy "Users read own notification log"
  on public.notification_log for select
  using (auth.uid() = user_id);
