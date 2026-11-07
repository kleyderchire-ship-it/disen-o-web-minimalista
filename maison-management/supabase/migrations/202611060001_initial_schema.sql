-- MAISON MANAGEMENT: initial Supabase schema
-- Apply in Supabase SQL Editor after creating the project.
create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('admin','supervisor','chatter');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.publication_status as enum ('draft','scheduled','publishing','published','failed');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'chatter',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  onlyfans_username text,
  active boolean not null default true,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.model_assignments (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(model_id,user_id)
);

-- OnlyFans account identifiers are stored here. API keys and session secrets
-- must remain in server-side secret storage, never in this table or the browser.
create table if not exists public.platform_accounts (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null unique references public.models(id) on delete cascade,
  provider text not null default 'fans_api',
  provider_account_id text unique,
  creator_authorized_at timestamptz,
  connection_status text not null default 'not_connected'
    check (connection_status in ('not_connected','pending','connected','reauth_required','disconnected','error')),
  connected_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fan_events (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  source text not null default 'other',
  chatter_id uuid references public.profiles(id),
  occurred_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  sale_type text not null,
  amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null default 'USD',
  chatter_id uuid references public.profiles(id),
  occurred_at timestamptz not null default now(),
  external_reference text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  content_type text not null check (content_type in ('story','post','photo','video')),
  caption text not null default '',
  media_object_paths text[] not null default '{}',
  provider_post_id text,
  status public.publication_status not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  model_id uuid references public.models(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists model_assignments_user_idx on public.model_assignments(user_id,model_id);
create index if not exists fan_events_model_date_idx on public.fan_events(model_id,occurred_at desc);
create index if not exists sales_model_date_idx on public.sales(model_id,occurred_at desc);
create index if not exists publications_model_date_idx on public.publications(model_id,created_at desc);
create index if not exists publications_schedule_idx on public.publications(status,scheduled_at);

create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles
  where id = (select auth.uid()) and active = true
$$;

create or replace function public.can_access_model(target_model uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select
    public.current_app_role() in ('admin','supervisor')
    or exists (
      select 1 from public.model_assignments ma
      where ma.model_id = target_model and ma.user_id = (select auth.uid())
    )
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();
drop trigger if exists models_touch_updated_at on public.models;
create trigger models_touch_updated_at before update on public.models
for each row execute function public.touch_updated_at();
drop trigger if exists platform_accounts_touch_updated_at on public.platform_accounts;
create trigger platform_accounts_touch_updated_at before update on public.platform_accounts
for each row execute function public.touch_updated_at();
drop trigger if exists publications_touch_updated_at on public.publications;
create trigger publications_touch_updated_at before update on public.publications
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.models enable row level security;
alter table public.model_assignments enable row level security;
alter table public.platform_accounts enable row level security;
alter table public.fan_events enable row level security;
alter table public.sales enable row level security;
alter table public.publications enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles read own or managers" on public.profiles;
create policy "profiles read own or managers" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.current_app_role() in ('admin','supervisor'));
drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles for all to authenticated
using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

drop policy if exists "models visible by role" on public.models;
create policy "models visible by role" on public.models for select to authenticated
using (public.can_access_model(id));
drop policy if exists "managers manage models" on public.models;
create policy "managers manage models" on public.models for all to authenticated
using (public.current_app_role() in ('admin','supervisor'))
with check (public.current_app_role() in ('admin','supervisor'));

drop policy if exists "assignments visible to relevant users" on public.model_assignments;
create policy "assignments visible to relevant users" on public.model_assignments for select to authenticated
using (user_id = (select auth.uid()) or public.current_app_role() in ('admin','supervisor'));
drop policy if exists "managers manage assignments" on public.model_assignments;
create policy "managers manage assignments" on public.model_assignments for all to authenticated
using (public.current_app_role() in ('admin','supervisor'))
with check (public.current_app_role() in ('admin','supervisor'));

drop policy if exists "platform accounts managers read" on public.platform_accounts;
create policy "platform accounts managers read" on public.platform_accounts for select to authenticated
using (public.current_app_role() in ('admin','supervisor') and public.can_access_model(model_id));
drop policy if exists "admins manage platform accounts" on public.platform_accounts;
create policy "admins manage platform accounts" on public.platform_accounts for all to authenticated
using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

drop policy if exists "fans visible by assignment" on public.fan_events;
create policy "fans visible by assignment" on public.fan_events for select to authenticated
using (public.can_access_model(model_id));
drop policy if exists "assigned chatters record fans" on public.fan_events;
create policy "assigned chatters record fans" on public.fan_events for insert to authenticated
with check (public.can_access_model(model_id) and chatter_id = (select auth.uid()));
drop policy if exists "managers update fans" on public.fan_events;
create policy "managers update fans" on public.fan_events for update to authenticated
using (public.current_app_role() in ('admin','supervisor'))
with check (public.current_app_role() in ('admin','supervisor'));

drop policy if exists "sales visible by assignment" on public.sales;
create policy "sales visible by assignment" on public.sales for select to authenticated
using (public.can_access_model(model_id));
drop policy if exists "assigned chatters record sales" on public.sales;
create policy "assigned chatters record sales" on public.sales for insert to authenticated
with check (public.can_access_model(model_id) and chatter_id = (select auth.uid()));
drop policy if exists "managers update sales" on public.sales;
create policy "managers update sales" on public.sales for update to authenticated
using (public.current_app_role() in ('admin','supervisor'))
with check (public.current_app_role() in ('admin','supervisor'));

drop policy if exists "publications visible by assignment" on public.publications;
create policy "publications visible by assignment" on public.publications for select to authenticated
using (public.can_access_model(model_id));
drop policy if exists "assigned team create drafts" on public.publications;
create policy "assigned team create drafts" on public.publications for insert to authenticated
with check (public.can_access_model(model_id) and created_by = (select auth.uid()) and status = 'draft');
drop policy if exists "managers update publications" on public.publications;
create policy "managers update publications" on public.publications for update to authenticated
using (public.current_app_role() in ('admin','supervisor'))
with check (public.current_app_role() in ('admin','supervisor'));

drop policy if exists "audit logs managers read" on public.audit_logs;
create policy "audit logs managers read" on public.audit_logs for select to authenticated
using (public.current_app_role() in ('admin','supervisor'));
-- Audit log inserts are reserved for trusted server-side code using the service role.

-- Bootstrap note: after the first administrator signs up, set their role from
-- the SQL editor using their auth.users UUID:
-- update public.profiles set role = 'admin' where id = '<AUTH_USER_UUID>';


-- Create a profile automatically for each new Supabase Auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'chatter'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Private media bucket. Store files under <model-uuid>/<filename>.
insert into storage.buckets (id, name, public)
values ('maison-content', 'maison-content', false)
on conflict (id) do update set public = false;

drop policy if exists "assigned team reads model media" on storage.objects;
create policy "assigned team reads model media" on storage.objects for select to authenticated
using (
  bucket_id = 'maison-content'
  and public.can_access_model(((storage.foldername(name))[1])::uuid)
);
drop policy if exists "assigned team uploads model media" on storage.objects;
create policy "assigned team uploads model media" on storage.objects for insert to authenticated
with check (
  bucket_id = 'maison-content'
  and public.can_access_model(((storage.foldername(name))[1])::uuid)
);
drop policy if exists "managers delete model media" on storage.objects;
create policy "managers delete model media" on storage.objects for delete to authenticated
using (
  bucket_id = 'maison-content'
  and public.current_app_role() in ('admin','supervisor')
  and public.can_access_model(((storage.foldername(name))[1])::uuid)
);
