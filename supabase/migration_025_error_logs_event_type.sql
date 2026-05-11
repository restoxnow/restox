-- migration_025: add event_type and metadata to error_logs

alter table error_logs
  add column if not exists event_type text,
  add column if not exists metadata   jsonb;
