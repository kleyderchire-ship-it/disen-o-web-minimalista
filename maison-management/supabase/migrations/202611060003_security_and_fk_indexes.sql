-- Tighten default privileges on an existing event-trigger helper.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Index foreign-key columns used by joins, RLS checks and audit queries.
create index if not exists models_created_by_idx on public.models(created_by);
create index if not exists model_assignments_assigned_by_idx on public.model_assignments(assigned_by);
create index if not exists fan_events_chatter_idx on public.fan_events(chatter_id);
create index if not exists sales_chatter_idx on public.sales(chatter_id);
create index if not exists publications_created_by_idx on public.publications(created_by);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id,created_at desc);
create index if not exists audit_logs_model_idx on public.audit_logs(model_id,created_at desc);
