-- Automatic fan/subscriber intake from Fans API webhooks.
create table if not exists public.fans (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  provider_fan_id text not null,
  username text,
  display_name text,
  subscription_status text not null default 'unknown'
    check (subscription_status in ('active','expired','unknown')),
  first_seen_at timestamptz not null default now(),
  first_subscribed_at timestamptz,
  last_subscribed_at timestamptz,
  expired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(model_id, provider_fan_id)
);

create table if not exists public.fan_webhook_receipts (
  idempotency_key text primary key,
  account_id text not null,
  event_type text not null,
  received_at timestamptz not null default now()
);

alter table public.fan_events
  add column if not exists fan_id uuid references public.fans(id) on delete set null,
  add column if not exists provider_event_id text unique,
  add column if not exists event_type text;

create index if not exists fans_model_first_seen_idx on public.fans(model_id, first_seen_at desc);
create index if not exists fans_model_status_idx on public.fans(model_id, subscription_status);
create index if not exists fan_events_model_event_idx on public.fan_events(model_id, event_type, occurred_at desc);

alter table public.fans enable row level security;
alter table public.fan_webhook_receipts enable row level security;

drop policy if exists "fans visible by assignment" on public.fans;
create policy "fans visible by assignment" on public.fans
for select to authenticated using (private.can_access_model(model_id));

grant select on public.fans to authenticated;
revoke all on public.fan_webhook_receipts from public, anon, authenticated;
grant all on public.fan_webhook_receipts to service_role;
grant select on public.fan_events to authenticated;
revoke insert on public.fan_events from authenticated;

-- One atomic, idempotent entry point for the signed webhook receiver.
create or replace function public.process_fans_api_subscription_event(
  p_idempotency_key text,
  p_account_id text,
  p_event_type text,
  p_fan_id text,
  p_username text,
  p_display_name text,
  p_occurred_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_model_id uuid;
  v_fan_id uuid;
  v_inserted integer;
begin
  if p_idempotency_key is null or length(p_idempotency_key) < 8 then
    raise exception 'Missing or invalid idempotency key';
  end if;
  if p_event_type not in ('subscriptions.new','subscriptions.renewed','subscriptions.expired') then
    raise exception 'Unsupported event type';
  end if;
  if p_fan_id is null or p_fan_id = '' then
    raise exception 'Missing fan identifier';
  end if;

  select model_id into v_model_id
  from public.platform_accounts
  where provider = 'fans_api'
    and provider_account_id = p_account_id
    and connection_status = 'connected';

  if v_model_id is null then
    raise exception 'No connected MAISON model is mapped to this Fans API account';
  end if;

  insert into public.fan_webhook_receipts(idempotency_key, account_id, event_type)
  values (p_idempotency_key, p_account_id, p_event_type)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  insert into public.fans(
    model_id, provider_fan_id, username, display_name, subscription_status,
    first_seen_at, first_subscribed_at, last_subscribed_at, expired_at
  )
  values (
    v_model_id, p_fan_id, nullif(p_username,''), nullif(p_display_name,''),
    case when p_event_type = 'subscriptions.expired' then 'expired' else 'active' end,
    coalesce(p_occurred_at, now()),
    case when p_event_type = 'subscriptions.new' then coalesce(p_occurred_at,now()) else null end,
    case when p_event_type in ('subscriptions.new','subscriptions.renewed') then coalesce(p_occurred_at,now()) else null end,
    case when p_event_type = 'subscriptions.expired' then coalesce(p_occurred_at,now()) else null end
  )
  on conflict (model_id, provider_fan_id) do update set
    username = coalesce(excluded.username, public.fans.username),
    display_name = coalesce(excluded.display_name, public.fans.display_name),
    subscription_status = case when p_event_type = 'subscriptions.expired' then 'expired' else 'active' end,
    first_subscribed_at = case when p_event_type = 'subscriptions.new'
      then coalesce(public.fans.first_subscribed_at, excluded.first_subscribed_at)
      else public.fans.first_subscribed_at end,
    last_subscribed_at = case when p_event_type in ('subscriptions.new','subscriptions.renewed')
      then excluded.last_subscribed_at else public.fans.last_subscribed_at end,
    expired_at = case when p_event_type = 'subscriptions.expired' then excluded.expired_at
      when p_event_type in ('subscriptions.new','subscriptions.renewed') then null
      else public.fans.expired_at end,
    updated_at = now()
  returning id into v_fan_id;

  insert into public.fan_events(
    model_id, fan_id, quantity, source, event_type, provider_event_id, occurred_at, notes
  )
  values (
    v_model_id, v_fan_id, 1,
    case p_event_type
      when 'subscriptions.new' then 'new_subscription'
      when 'subscriptions.renewed' then 'renewal'
      else 'expired'
    end,
    p_event_type, p_idempotency_key, coalesce(p_occurred_at,now()),
    'Capturado automáticamente por Fans API'
  );

  update public.platform_accounts
  set last_checked_at = now()
  where model_id = v_model_id and provider = 'fans_api';

  return jsonb_build_object('ok', true, 'duplicate', false, 'model_id', v_model_id, 'fan_id', v_fan_id);
end;
$$;

revoke all on function public.process_fans_api_subscription_event(text,text,text,text,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.process_fans_api_subscription_event(text,text,text,text,text,text,timestamptz) to service_role;
