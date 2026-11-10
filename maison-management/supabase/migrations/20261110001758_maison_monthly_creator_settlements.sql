-- MAISON MANAGEMENT: proposed commission terms and monthly creator settlements.
create table if not exists public.model_compensation_terms (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete restrict,
  commission_rate numeric(5,2) not null default 30.00 check (commission_rate >= 0 and commission_rate <= 100),
  settlement_frequency text not null default 'monthly' check (settlement_frequency = 'monthly'),
  calculation_basis text not null default 'platform_net' check (calculation_basis in ('platform_net','other_contractual_basis')),
  status text not null default 'proposed' check (status in ('proposed','active','rejected','expired')),
  agreement_reference text,
  agreement_file_path text,
  effective_from date,
  effective_to date,
  accepted_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_from is null or effective_to >= effective_from),
  check (status <> 'active' or accepted_at is not null)
);

create unique index if not exists model_compensation_one_active_per_model
  on public.model_compensation_terms(model_id)
  where status = 'active';
create index if not exists model_compensation_terms_model_created_idx
  on public.model_compensation_terms(model_id, created_at desc);

create table if not exists public.monthly_settlements (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  currency char(3) not null default 'USD',
  platform_gross numeric(14,2) not null default 0 check (platform_gross >= 0),
  platform_fees numeric(14,2) not null default 0 check (platform_fees >= 0),
  refunds numeric(14,2) not null default 0 check (refunds >= 0),
  adjustments numeric(14,2) not null default 0,
  commission_rate numeric(5,2) not null check (commission_rate >= 0 and commission_rate <= 100),
  distributable_amount numeric(14,2) generated always as
    (round(platform_gross - platform_fees - refunds + adjustments, 2)) stored,
  agency_amount numeric(14,2) generated always as
    (round((platform_gross - platform_fees - refunds + adjustments) * commission_rate / 100, 2)) stored,
  creator_amount numeric(14,2) generated always as
    (round((platform_gross - platform_fees - refunds + adjustments) * (100 - commission_rate) / 100, 2)) stored,
  status text not null default 'draft' check (status in ('draft','under_review','approved','paid','void')),
  source_report_reference text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  paid_at timestamptz,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  check (platform_gross - platform_fees - refunds + adjustments >= 0),
  check (status not in ('approved','paid') or approved_at is not null),
  check (status <> 'paid' or paid_at is not null),
  unique (model_id, period_start, period_end)
);

create index if not exists monthly_settlements_period_idx
  on public.monthly_settlements(period_start desc, period_end desc);
create index if not exists monthly_settlements_model_period_idx
  on public.monthly_settlements(model_id, period_start desc);

alter table public.model_compensation_terms enable row level security;
alter table public.monthly_settlements enable row level security;

grant select, insert, update on public.model_compensation_terms to authenticated;
grant select, insert, update on public.monthly_settlements to authenticated;

drop policy if exists "managers manage compensation terms" on public.model_compensation_terms;
create policy "managers manage compensation terms"
on public.model_compensation_terms
for all
to authenticated
using ((select private.current_app_role()) in ('admin'::app_role, 'supervisor'::app_role))
with check ((select private.current_app_role()) in ('admin'::app_role, 'supervisor'::app_role));

drop policy if exists "managers manage monthly settlements" on public.monthly_settlements;
create policy "managers manage monthly settlements"
on public.monthly_settlements
for all
to authenticated
using ((select private.current_app_role()) in ('admin'::app_role, 'supervisor'::app_role))
with check ((select private.current_app_role()) in ('admin'::app_role, 'supervisor'::app_role));

create or replace function private.prevent_paid_settlement_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if old.status = 'paid' then
    raise exception 'Paid settlements are immutable; create a separate adjustment record.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_paid_settlement_mutation on public.monthly_settlements;
create trigger prevent_paid_settlement_mutation
before update or delete on public.monthly_settlements
for each row execute function private.prevent_paid_settlement_mutation();
