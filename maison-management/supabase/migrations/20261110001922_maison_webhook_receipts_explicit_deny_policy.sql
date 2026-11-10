-- Webhook receipts are server-only idempotency records. Deny browser roles explicitly.
revoke all on table public.fan_webhook_receipts from anon, authenticated;
grant all on table public.fan_webhook_receipts to service_role;

drop policy if exists "deny client access to webhook receipts" on public.fan_webhook_receipts;
create policy "deny client access to webhook receipts"
on public.fan_webhook_receipts
for all
to anon, authenticated
using (false)
with check (false);
