# MAISON MANAGEMENT backend setup

## Supabase
1. Create a Supabase project and connect the Supabase integration in ChatGPT.
2. Apply `supabase/migrations/202611060001_initial_schema.sql` in the project's SQL Editor.
3. Copy the project URL and publishable/anon key into Vercel as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Add the service role key as `SUPABASE_SERVICE_ROLE_KEY` (server-only). Never expose it in browser code.
5. Create the first user with Supabase Auth, then promote that user's profile to admin using the SQL comment at the bottom of the migration.
6. Invite the remaining team members and assign their roles and model assignments from the admin workflow.

## Fans API
- Create an API key in the Fans API console and add it to Vercel as `FANS_API_KEY` (encrypted).
- Account connection must use the creator-authorized mobile app flow. Never request OnlyFans passwords, cookies, or 2FA codes in MAISON chat.
- Store only the provider account identifier and connection state in `platform_accounts`; keep API keys and tokens server-side.
- Publication requests must be made from server routes after checking the signed-in user's role and model assignment. Chatter publishing should require an explicit confirmation and be logged.

The app must not be used with real creator accounts until authentication, server-side authorization, database credentials, and provider credentials have all been configured and tested.

## Automatic OnlyFans fans and subscriptions

The Supabase Edge Function `fans-api-webhook` receives Fans API subscription events and stores them automatically:
- `subscriptions.new`: creates/updates the fan profile and records a new subscription.
- `subscriptions.renewed`: updates the active subscription and records the renewal.
- `subscriptions.expired`: marks the subscription expired and records the lapse.

The receiver verifies the Fans API `Signature` header with HMAC-SHA256 and deduplicates deliveries using `X-OFAPI-Idempotency-Key`. The webhook must be configured with a signing secret.

### Finish the webhook connection
1. In Supabase Dashboard, open Edge Functions → Secrets and add `FANS_API_WEBHOOK_SECRET` with a long random secret of your choice.
2. In the Fans API Console → Webhooks, create an OnlyFans webhook with endpoint:
   `https://nejcpgkpynzpnoujllrx.supabase.co/functions/v1/fans-api-webhook`
3. Paste the same signing secret into the webhook's Signing Secret field.
4. Subscribe to `subscriptions.new`, `subscriptions.renewed`, and `subscriptions.expired`.
5. Connect each creator's OnlyFans account with their own authorization. Map the provider's `acct_...` account ID to the correct model in `public.platform_accounts` and set `connection_status='connected'`. Events are rejected if the account is not mapped to a connected MAISON model.
6. Send a test event from the Fans API console and verify that a fan appears in MAISON's Fans section.

Do not put the signing secret or Fans API API key in browser code, Git, or chat. Webhooks are event-driven and near real-time, but provider delivery may be delayed or retried; the receiver is idempotent.
