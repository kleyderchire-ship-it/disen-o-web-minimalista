-- Allow only the first authenticated user to claim the initial administrator role.
create or replace function public.bootstrap_first_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then
    raise exception 'Authentication required';
  end if;
  if exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'An administrator is already configured';
  end if;
  update public.profiles
    set role = 'admin', active = true
    where id = caller;
  if not found then
    raise exception 'User profile not found';
  end if;
  return true;
end;
$$;

revoke all on function public.bootstrap_first_admin() from public, anon;
grant execute on function public.bootstrap_first_admin() to authenticated;
