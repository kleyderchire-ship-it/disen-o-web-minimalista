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
