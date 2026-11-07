# MAISON MANAGEMENT — configuración de backend

## Supabase y autenticación
- El proyecto Supabase de MAISON tiene aplicadas las migraciones de esquema, RLS, bandeja, CRM de fans, ventas, turnos, tareas de contenido, automatizaciones y auditoría.
- La aplicación usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel.
- El primer usuario registrado reclama el rol de administrador mediante la RPC protegida `bootstrap_first_admin()`. Los demás miembros se invitan desde Equipo.
- No añadas `SUPABASE_SERVICE_ROLE_KEY` al frontend ni a variables públicas. Las Edge Functions usan el secreto interno que Supabase proporciona en su entorno.
- RLS separa el acceso por rol, modelo asignado y chatter asignado a cada conversación. La base impide eliminar o degradar al último administrador activo.

## Fans API / OnlyFans
- Fans API es un proveedor externo e independiente, no oficial ni afiliado a OnlyFans.
- Crea una API key en `https://app.onlyfansapi.com/api-keys`.
- Añade `FANS_API_KEY` como variable cifrada en Vercel para Production y Preview. Añade la misma variable en Supabase → Edge Functions → Secrets para que el worker pueda enviar mensajes automáticos.
- Las rutas del servidor usan el origen actual `https://app.onlyfansapi.com/api/`.
- La conexión de cada creadora se realiza mediante Fans API Auth+ en su propio iPhone. No solicites contraseñas, cookies, encabezados de sesión ni códigos 2FA por MAISON.
- MAISON guarda el ID de cuenta del proveedor y el identificador estable de la creadora para mapear reconexiones futuras.

## Webhook de OnlyFans
Edge Function:

`https://nejcpgkpynzpnoujllrx.supabase.co/functions/v1/fans-api-webhook`

Eventos procesados:
- `subscriptions.new`, `subscriptions.renewed`, `subscriptions.expired`: actualiza fans e historial y encola las reglas automáticas activas.
- `messages.received`, `messages.sent`: sincroniza conversaciones y mensajes en la bandeja.
- `transactions.new`: registra transacciones e ingresos sin duplicar el evento.
- `accounts.disconnected`, `accounts.authentication_failed`, `accounts.session_expired`, `accounts.reconnected`: mantiene actualizado el estado y el mapeo de cuentas.

### Activación
1. En Supabase Dashboard → Edge Functions → Secrets, crea `FANS_API_WEBHOOK_SECRET` con un secreto aleatorio largo.
2. En `https://app.onlyfansapi.com` → Webhooks, registra la URL de arriba.
3. Usa el mismo valor de `FANS_API_WEBHOOK_SECRET` como Signing Secret.
4. Suscribe todos los eventos enumerados.
5. En MAISON → Modelos, el administrador inicia Auth+. La creadora completa la autorización desde su propio iPhone.
6. Envía eventos de prueba y verifica Mensajes, Fans, Ventas y estado de cuenta.

El receptor valida HMAC-SHA256 sobre el cuerpo original y deduplica con `X-OFAPI-Idempotency-Key`. Las entregas repetidas no duplican mensajes, suscripciones ni ventas.

## Automatizaciones programadas
Worker Edge Function:

`https://nejcpgkpynzpnoujllrx.supabase.co/functions/v1/automation-worker`

- Supabase Cron está configurado para ejecutar el worker cada minuto mediante `pg_cron` y `pg_net`.
- El secreto interno de cron se guarda en Supabase Vault y no se expone al navegador.
- Las reglas admiten eventos de suscripción y retrasos de 0 a 10.080 minutos (7 días).
- El worker reclama trabajos de forma atómica, envía con una clave idempotente y reintenta errores temporales hasta cinco veces.
- Para enviar, el worker requiere `FANS_API_KEY` en Supabase → Edge Functions → Secrets.
- No actives una regla de bienvenida si el mensaje de bienvenida nativo de OnlyFans ya está activo para el mismo evento, para evitar duplicados.

## Variables pendientes para activar la conexión real
- Vercel: `FANS_API_KEY` en Production y Preview.
- Supabase Edge Function Secrets: `FANS_API_WEBHOOK_SECRET` y `FANS_API_KEY`.
- Fans API Console: webhook creado, firmado y suscrito a los eventos.
- Cada modelo: autorización Auth+ completada y cuenta correctamente asociada.

Una cuenta solo debe considerarse conectada cuando Auth+ termina correctamente y MAISON muestra el estado conectado. Antes de publicar historias, posts o campañas reales, realiza una prueba autorizada con una cuenta de prueba.
