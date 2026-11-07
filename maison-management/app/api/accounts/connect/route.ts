import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiUserContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo JSON no válido.' }, { status: 400 }) }
  const modelId = String(body?.modelId || '')
  if (!/^[0-9a-f-]{36}$/i.test(modelId)) return NextResponse.json({ error: 'Modelo no válido.' }, { status: 400 })

  const context = await getFansApiUserContext(request)
  if ('error' in context) return context.error
  if (context.role !== 'admin') return NextResponse.json({ error: 'Solo el administrador puede iniciar la conexión de cuentas.' }, { status: 403 })
  if (!context.apiKey) return NextResponse.json({ error: 'Falta configurar FANS_API_KEY en el servidor.' }, { status: 503 })

  const { data: model, error: modelError } = await context.supabase.from('models').select('id,display_name').eq('id', modelId).single()
  if (modelError || !model) return NextResponse.json({ error: 'No se encontró el modelo o no tienes acceso.' }, { status: 404 })

  const start = await fansApiRequest('https://app.onlyfansapi.com/api/authenticate', context.apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_type: 'mobile_app', name: 'MAISON MANAGEMENT · ' + model.display_name, proxyCountry: 'us' }),
  })
  if (!start.response.ok) return NextResponse.json({ error: 'No se pudo iniciar la autorización con Fans API.', provider: start.payload }, { status: start.response.status })

  const data: any = start.payload
  if (!data?.attempt_id) return NextResponse.json({ error: 'Fans API no devolvió un identificador de autorización.' }, { status: 502 })
  const { error: attemptError } = await context.supabase.from('provider_auth_attempts').insert({
    model_id: modelId,
    provider_attempt_id: data.attempt_id,
    polling_url: data.polling_url || null,
    mobile_auth_session_deeplink: data.mobile_auth_session_deeplink || null,
    created_by: context.user.id,
  })
  if (attemptError) return NextResponse.json({ error: 'Se inició la autorización, pero no se pudo guardar su seguimiento.', detail: attemptError.message }, { status: 500 })

  const { error: accountError } = await context.supabase.from('platform_accounts').upsert({
    model_id: modelId, provider: 'onlyfans', provider_account_id: null, connection_status: 'pending',
    creator_authorized_at: null, connected_at: null, updated_at: new Date().toISOString(),
  }, { onConflict: 'model_id' })
  if (accountError) return NextResponse.json({ error: 'La autorización está iniciada, pero no se pudo registrar la cuenta pendiente.', detail: accountError.message }, { status: 500 })

  return NextResponse.json({
    attemptId: data.attempt_id,
    deepLink: data.mobile_auth_session_deeplink || null,
    message: 'Abre Auth+ en el iPhone de la creadora y completa la autorización allí.',
  })
}
