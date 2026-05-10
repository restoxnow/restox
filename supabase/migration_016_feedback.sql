-- migration_016: feedback + error_logs tables

create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  user_email  text,
  category    text not null,
  message     text not null,
  page_url    text,
  created_at  timestamptz not null default now()
);

alter table feedback enable row level security;

-- Users can insert their own feedback; admins can read all
create policy "Users can submit feedback" on feedback
  for insert with check (true);

create policy "Users can view own feedback" on feedback
  for select using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists error_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  route         text,
  error_message text,
  stack_trace   text,
  created_at    timestamptz not null default now()
);

alter table error_logs enable row level security;

-- Only service role writes error logs; no user-facing read policy needed
create policy "Service role manages error_logs" on error_logs
  for all using (auth.role() = 'service_role');
