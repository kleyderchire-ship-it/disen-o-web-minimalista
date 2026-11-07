import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo JSON no válido.' }, { status: 400 }) }
  const modelId = String(body?.modelId || '')
  const type = body?.type === 'story' ? 'story' : body?.type === 'post' ? 'post' : ''
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const mediaFiles = Array.isArray(body?.mediaFiles) ? body.mediaFiles.filter((x: unknown) => (typeof x === 'string' || typeof x === 'number') && String(x).length < 120) : []
  const scheduledDate = body?.scheduledDate ? String(body.scheduledDate) : ''
  const saveForLater = body?.saveForLater === true

  if (!/^[0-9a-f-]{36}$/i.test(modelId) || !type) return NextResponse.json({ error: 'Modelo o tipo de publicación no válido.' }, { status: 400 })
  if (type === 'post' && !text) return NextResponse.json({ error: 'Las publicaciones necesitan texto.' }, { status: 400 })
  if (type === 'story' && mediaFiles.length === 0) return NextResponse.json({ error: 'Las historias necesitan al menos un archivo del vault.' }, { status: 400 })
  if (scheduledDate && (type !== 'post' || Number.isNaN(Date.parse(scheduledDate)) || Date.parse(scheduledDate) <= Date.now())) {
    return NextResponse.json({ error: 'La programación requiere una fecha futura y solo está disponible para publicaciones.' }, { status: 400 })
  }

  const context = await getFansApiContext(request, modelId)
  if ('error' in context) return context.error
  if (!('accountId' in context)) return NextResponse.json({ error: 'Cuenta no disponible.' }, { status: 409 })

  const initialStatus = saveForLater ? 'draft' : 'publishing'
  const { data: record, error: insertError } = await context.supabase.from('publications').insert({
    model_id: modelId,
    created_by: context.user.id,
    content_type: type,
    caption: text,
    media_object_paths: mediaFiles.map(String),
    status: initialStatus,
    scheduled_at: scheduledDate || null,
  }).select('id').single()
  if (insertError || !record) return NextResponse.json({ error: 'No se pudo guardar el registro de publicación.', detail: insertError?.message }, { status: 500 })

  if (saveForLater) return NextResponse.json({ saved: true, publicationId: record.id, status: 'draft' })

  const payload: Record<string, unknown> = {}
  if (type === 'post') {
    payload.text = text
    if (mediaFiles.length) payload.mediaFiles = mediaFiles
    if (scheduledDate) payload.scheduledDate = new Date(scheduledDate).toISOString()
    if (body?.blockBannedWords !== false) payload.blockBannedWords = 'risky'
  } else {
    payload.mediaFiles = mediaFiles.map(String)
  }

  const url = type === 'story'
    ? `https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/stories`
    : `https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/posts`
  const provider = await fansApiRequest(url, context.apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': request.headers.get('idempotency-key') || crypto.randomUUID() },
    body: JSON.stringify(payload),
  })

  if (!provider.response.ok) {
    await context.supabase.from('publications').update({ status: 'failed', last_error: JSON.stringify(provider.payload).slice(0, 1500), updated_at: new Date().toISOString() }).eq('id', record.id)
    return NextResponse.json({ error: 'Fans API no pudo publicar el contenido.', provider: provider.payload, publicationId: record.id }, { status: provider.response.status })
  }

  const responseData: any = provider.payload
  const providerId = responseData?.data?.id ?? responseData?.id ?? null
  const status = scheduledDate ? 'scheduled' : 'published'
  const { error: updateError } = await context.supabase.from('publications').update({
    provider_post_id: providerId === null ? null : String(providerId),
    status,
    published_at: scheduledDate ? null : new Date().toISOString(),
    last_error: null,
    updated_at: new Date().toISOString(),
  }).eq('id', record.id)
  if (updateError) return NextResponse.json({ warning: 'El proveedor ejecutó la publicación, pero MAISON no pudo actualizar el registro.', publicationId: record.id, provider: provider.payload }, { status: 207 })
  return NextResponse.json({ ok: true, status, publicationId: record.id, provider: provider.payload })
}
