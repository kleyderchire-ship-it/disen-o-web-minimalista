import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiUserContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const modelId = searchParams.get('modelId') || ''
  const attemptId = searchParams.get('attemptId') || ''
  if (!/^[0-9a-f-]{36}$/i.test(modelId) || !/^auth_[a-zA-Z0-9_-]{4,100}$/.test(attemptId)) {
    return NextResponse.json({ error: 'Modelo o intento de autorización no válido.' }, { status: 400 })
  }

  const context = await getFansApiUserContext(request)
  if ('error' in context) return context.error
  if (context.role !== 'admin') return NextResponse.json({ error: 'Solo el administrador puede consultar la autorización.' }, { status: 403 })
  if (!context.apiKey) return NextResponse.json({ error: 'Falta configurar FANS_API_KEY en el servidor.' }, { status: 503 })

  const { data: attempt, error: attemptError } = await context.supabase
    .from('provider_auth_attempts').select('id,model_id,provider_attempt_id,state')
    .eq('model_id', modelId).eq('provider_attempt_id', attemptId).eq('created_by', context.user.id).single()
  if (attemptError || !attempt) return NextResponse.json({ error: 'No se encontró este intento para el modelo seleccionado.' }, { status: 404 })

  const poll = await fansApiRequest('https://app.onlyfansapi.com/api/authenticate/' + encodeURIComponent(attemptId), context.apiKey)
  if (!poll.response.ok) return NextResponse.json({ error: 'No se pudo consultar el estado en Fans API.', provider: poll.payload }, { status: poll.response.status })
  const data: any = poll.payload
  const state = String(data?.state || 'pending')
  if (state === 'authenticated' && data?.account?.id) {
    const { error: saveError } = await context.supabase.from('platform_accounts').upsert({
      model_id: modelId, provider: 'onlyfans', provider_account_id: data.account.id,
      connection_status: 'connected', creator_authorized_at: new Date().toISOString(),
      connected_at: new Date().toISOString(), last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'model_id' })
    if (saveError) return NextResponse.json({ error: 'La cuenta se autenticó, pero no se pudo guardar la conexión.', detail: saveError.message }, { status: 500 })
    await context.supabase.from('provider_auth_attempts').update({ state: 'authenticated', completed_at: new Date().toISOString() }).eq('id', attempt.id)
  } else if (state === 'error' || state === 'failed') {
    await context.supabase.from('provider_auth_attempts').update({ state: 'failed', completed_at: new Date().toISOString() }).eq('id', attempt.id)
  }

  return NextResponse.json({
    state,
    progress: data?.progress || null,
    twoFactorPending: Boolean(data?.twoFactorPending || data?.lastAttempt?.needs_otp),
    deepLink: data?.mobile_auth_session_deeplink || null,
    connected: state === 'authenticated' && Boolean(data?.account?.id),
    account: data?.account?.onlyfans_data ? {
      username: data.account.onlyfans_data.username || null,
      displayName: data.account.onlyfans_data.name || null,
    } : null,
  })
}
