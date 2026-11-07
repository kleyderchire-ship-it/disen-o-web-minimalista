create index if not exists automation_rules_created_by_idx
  on public.automation_rules (created_by);

create index if not exists content_tasks_created_by_idx
  on public.content_tasks (created_by);
