# MAISON MANAGEMENT — configuración de backend

## Supabase y autenticación
- El proyecto Supabase de MAISON ya tiene aplicadas las migraciones de esquema, permisos, bandeja, fans, ventas, turnos y auditoría.
- La aplicación usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel.
- El primer usuario registrado reclama el rol de administrador mediante la RPC protegida `bootstrap_first_admin()`. Después, los nuevos miembros se invitan desde Equipo; no se debe promover usuarios manualmente con SQL.
- No añadas `SUPABASE_SERVICE_ROLE_KEY` a variables públicas ni al frontend. La Edge Function usa el secreto interno `SUPABASE_SERVICE_ROLE_KEY` que Supabase proporciona en su entorno.
- RLS separa acceso por rol y modelo asignado. Las conversaciones también se aíslan por chatter asignado.

## Fans API / OnlyFans
- Fans API es un proveedor externo e independiente, no oficial ni afiliado a OnlyFans.
- Crea una API key en el panel oficial actual: `https://app.onlyfansapi.com/api-keys`.
- Añade la variable cifrada `FANS_API_KEY` en Vercel para Production y Preview. Nunca la pongas en el navegador, Git o en el chat.
- Las rutas del servidor normalizan las llamadas al origen oficial `https://app.onlyfansapi.com/api/`.
- La conexión de cada creadora se hace mediante Fans API Auth+ en su propio iPhone. No solicites contraseñas, cookies, encabezados de sesión ni códigos 2FA por MAISON.
- Al completar la autorización, MAISON guarda el ID de cuenta del proveedor y el identificador estable de la creadora de OnlyFans para poder mapear reconexiones futuras.

## Webhooks automáticos

La Edge Function desplegada es:

`https://nejcpgkpynzpnoujllrx.supabase.co/functions/v1/fans-api-webhook`

Procesa:
- `subscriptions.new`, `subscriptions.renewed`, `subscriptions.expired`: actualiza el directorio y el historial de suscripciones.
- `messages.received`, `messages.sent`: guarda mensajes y conversaciones para la bandeja y activa Supabase Realtime.
- `transactions.new`: registra ingresos y eventos de fans sin duplicar la misma transacción.
- `accounts.disconnected`, `accounts.authentication_failed`, `accounts.session_expired`, `accounts.reconnected`: actualiza el estado y el mapeo de la cuenta.

### Activar el webhook
1. En Supabase Dashboard → Edge Functions → Secrets, crea `FANS_API_WEBHOOK_SECRET` con un secreto aleatorio largo.
2. En `https://app.onlyfansapi.com` → Webhooks, crea un webhook para OnlyFans con la URL de arriba.
3. Usa exactamente el mismo valor de `FANS_API_WEBHOOK_SECRET` como Signing Secret.
4. Suscribe los eventos enumerados en la sección anterior.
5. En MAISON → Modelos, un administrador inicia la conexión Auth+. La creadora abre el enlace en su propio iPhone y completa la autorización.
6. Envía eventos de prueba desde el panel de Fans API y verifica Mensajes, Fans, Ventas y el estado de conexión.

El receptor valida la firma HMAC-SHA256 del cuerpo original y deduplica mediante `X-OFAPI-Idempotency-Key`. Los webhooks pueden reintentarse y no siempre llegan en orden. La bandeja consulta el proveedor y también se actualiza con eventos recibidos.

## Variables pendientes para activar la conexión real
- Vercel: `FANS_API_KEY` (Production y Preview).
- Supabase Edge Function Secrets: `FANS_API_WEBHOOK_SECRET`.
- Fans API Console: webhook creado, firmado y suscrito a los eventos requeridos.
- Cada modelo: autorización Auth+ completada y cuenta asociada al modelo correcto.

No se debe considerar una cuenta conectada hasta que Auth+ termine correctamente y MAISON muestre el estado conectado. No se deben publicar posts, historias ni campañas reales hasta completar una prueba autorizada con una cuenta de prueba.
