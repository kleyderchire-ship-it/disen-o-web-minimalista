create table if not exists public.inbox_conversations (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  fan_id uuid references public.fans(id) on delete set null,
  provider_chat_id text not null,
  fan_username text,
  fan_display_name text,
  fan_avatar_url text,
  last_message_preview text,
  last_message_at timestamptz,
  unread_count integer not null default 0 check (unread_count >= 0),
  priority boolean not null default false,
  is_pinned boolean not null default false,
  status text not null default 'open' check (status in ('open','archived','closed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_id, provider_chat_id)
);

create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.inbox_conversations(id) on delete cascade,
  model_id uuid not null references public.models(id) on delete cascade,
  provider_message_id text,
  direction text not null check (direction in ('incoming','outgoing')),
  message_text text,
  message_kind text not null default 'text',
  price numeric(10,2) not null default 0 check (price >= 0),
  is_locked boolean not null default false,
  media jsonb not null default '[]'::jsonb,
  provider_created_at timestamptz,
  send_status text not null default 'sent' check (send_status in ('pending','sent','failed','unknown')),
  idempotency_key text,
  sent_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (model_id, provider_message_id)
);

create table if not exists public.inbox_conversation_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.inbox_conversations(id) on delete cascade,
  model_id uuid not null references public.models(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  note text not null check (length(trim(note)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.message_scripts (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  title text not null,
  body text not null,
  category text not null default 'general',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inbox_conversations_model_recent_idx on public.inbox_conversations(model_id, last_message_at desc nulls last);
create index if not exists inbox_conversations_assignee_idx on public.inbox_conversations(assigned_to, last_message_at desc nulls last);
create index if not exists inbox_conversations_unread_idx on public.inbox_conversations(model_id, unread_count desc) where unread_count > 0;
create index if not exists inbox_messages_conversation_time_idx on public.inbox_messages(conversation_id, provider_created_at desc nulls last);
create index if not exists inbox_messages_model_time_idx on public.inbox_messages(model_id, created_at desc);
create index if not exists inbox_notes_conversation_time_idx on public.inbox_conversation_notes(conversation_id, created_at desc);
create index if not exists message_scripts_model_category_idx on public.message_scripts(model_id, category);

alter table public.inbox_conversations enable row level security;
alter table public.inbox_messages enable row level security;
alter table public.inbox_conversation_notes enable row level security;
alter table public.message_scripts enable row level security;

create policy "inbox conversations visible by model assignment" on public.inbox_conversations
for select to authenticated using (private.can_access_model(model_id));
create policy "inbox conversations update by model assignment" on public.inbox_conversations
for update to authenticated using (private.can_access_model(model_id))
with check (private.can_access_model(model_id) and (
  private.current_app_role() in ('admin'::app_role,'supervisor'::app_role)
  or assigned_to = auth.uid() or assigned_to is null
));
create policy "inbox messages visible by model assignment" on public.inbox_messages
for select to authenticated using (private.can_access_model(model_id));
create policy "inbox messages created by assigned team" on public.inbox_messages
for insert to authenticated with check (private.can_access_model(model_id) and sent_by = auth.uid());
create policy "inbox notes visible by model assignment" on public.inbox_conversation_notes
for select to authenticated using (private.can_access_model(model_id));
create policy "inbox notes created by assigned team" on public.inbox_conversation_notes
for insert to authenticated with check (private.can_access_model(model_id) and author_id = auth.uid());
create policy "message scripts visible by model assignment" on public.message_scripts
for select to authenticated using (private.can_access_model(model_id));
create policy "managers manage message scripts" on public.message_scripts
for all to authenticated using (
  private.current_app_role() in ('admin'::app_role,'supervisor'::app_role) and private.can_access_model(model_id)
) with check (
  private.current_app_role() in ('admin'::app_role,'supervisor'::app_role) and private.can_access_model(model_id)
);
create policy "chatters create message scripts" on public.message_scripts
for insert to authenticated with check (
  private.current_app_role() = 'chatter'::app_role and private.can_access_model(model_id) and created_by = auth.uid()
);

grant select, update on public.inbox_conversations to authenticated;
grant select, insert on public.inbox_messages to authenticated;
grant select, insert on public.inbox_conversation_notes to authenticated;
grant select, insert, update, delete on public.message_scripts to authenticated;
