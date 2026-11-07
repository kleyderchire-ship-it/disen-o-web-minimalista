drop policy if exists "assigned team read platform accounts" on public.platform_accounts;
create policy "assigned team read platform accounts"
on public.platform_accounts for select to authenticated
using (private.can_access_model(model_id));
