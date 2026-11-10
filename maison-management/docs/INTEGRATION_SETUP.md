# MAISON MANAGEMENT — Configuración de Fans API

## Arquitectura
- **Next.js en Vercel:** usa `FANS_API_KEY` para llamadas salientes a Fans API.
- **Supabase Edge Function `fans-api-webhook`:** recibe eventos firmados y usa `FANS_API_WEBHOOK_SECRET` para validar HMAC-SHA256.
- **Supabase:** el webhook usa las variables de sistema `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el entorno Edge Function. No copiar claves de servicio al navegador ni a `NEXT_PUBLIC_*`.

## Vercel
En el proyecto `maison-management`, agregar `FANS_API_KEY` como variable cifrada de servidor en Production, Preview y Development. No compartir el valor por chat ni incluirlo en Git.

## Supabase Edge Function
Configurar `FANS_API_WEBHOOK_SECRET` en los secretos del proyecto Supabase, no en el bundle del navegador. El valor debe coincidir con el secreto configurado en el proveedor que envía webhooks. No guardar el secreto en tablas ni en archivos del repositorio.

## URL del webhook
`https://nejcpgkpynzpnoujllrx.supabase.co/functions/v1/fans-api-webhook`

El receptor espera:
- Método POST.
- Cabecera `Signature` con HMAC-SHA256 del cuerpo sin modificar (formato hexadecimal, opcionalmente prefijo `sha256=`).
- Cabecera `X-OFAPI-Idempotency-Key` única por evento.
- Eventos configurados para suscripciones, mensajes, transacciones y cambios de conexión de cuenta.

## Activación segura
1. Confirmar autorización de la creadora para conectar su cuenta.
2. Configurar `FANS_API_KEY` y `FANS_API_WEBHOOK_SECRET` directamente en sus paneles seguros.
3. Configurar el webhook en el proveedor.
4. Conectar la cuenta desde el panel de MAISON y comprobar el estado.
5. Probar un evento de prueba y verificar que se registra una sola vez.
6. Activar automatizaciones solo después de validar firmas, idempotencia, permisos y registros.

Hasta completar esos pasos, mantener el modo manual. La falta de credenciales no debe bloquear el registro manual de ventas, publicaciones, tareas y liquidaciones.
