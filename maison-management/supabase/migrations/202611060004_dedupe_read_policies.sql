-- Avoid overlapping permissive SELECT policies; managers retain access via their ALL policy.
drop policy if exists "profiles read own or managers" on public.profiles;
create policy "profiles read own or supervisors" on public.profiles for select to authenticated
using (id = (select auth.uid()) or private.current_app_role() = 'supervisor');

drop policy if exists "models visible by role" on public.models;
create policy "models visible to assigned chatters" on public.models for select to authenticated
using (private.current_app_role() = 'chatter' and private.can_access_model(id));

drop policy if exists "assignments visible to relevant users" on public.model_assignments;
create policy "chatters read own assignments" on public.model_assignments for select to authenticated
using (user_id = (select auth.uid()) and private.current_app_role() = 'chatter');

drop policy if exists "platform accounts managers read" on public.platform_accounts;
create policy "supervisors read platform accounts" on public.platform_accounts for select to authenticated
using (private.current_app_role() = 'supervisor' and private.can_access_model(model_id));
