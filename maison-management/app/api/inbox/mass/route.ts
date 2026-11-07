import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo JSON no válido.' }, { status: 400 }) }
  const modelId = String(body?.modelId || '')
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const userLists = Array.isArray(body?.userLists) ? body.userLists.filter((x: unknown) => typeof x === 'string') : []
  const userIds = Array.isArray(body?.userIds) ? body.userIds.filter((x: unknown) => typeof x === 'string') : []
  const excludedLists = Array.isArray(body?.excludedLists) ? body.excludedLists.filter((x: unknown) => typeof x === 'string') : []
  const price = body?.price == null ? 0 : Number(body.price)
  const scheduledDate = body?.scheduledDate ? String(body.scheduledDate) : ''
  if (!/^[0-9a-f-]{36}$/i.test(modelId) || !text) return NextResponse.json({ error: 'Modelo y texto del mensaje son obligatorios.' }, { status: 400 })
  if (!userLists.length && !userIds.length) return NextResponse.json({ error: 'Selecciona al menos una lista o fan de destino.' }, { status: 400 })
  if (!Number.isFinite(price) || (price !== 0 && (!Number.isInteger(price) || price < 3 || price > 200))) return NextResponse.json({ error: 'El precio debe ser 0 o estar entre 3 y 200 USD.' }, { status: 400 })
  const mediaFiles = Array.isArray(body?.mediaFiles) ? body.mediaFiles.filter((x: unknown) => typeof x === 'string') : []
  if (price > 0 && mediaFiles.length === 0) return NextResponse.json({ error: 'Para enviar un PPV masivo debes adjuntar contenido multimedia.' }, { status: 400 })
  if (scheduledDate && Number.isNaN(Date.parse(scheduledDate))) return NextResponse.json({ error: 'Fecha de programación no válida.' }, { status: 400 })

  const context = await getFansApiContext(request, modelId)
  if ('error' in context) return context.error;
  if (!('accountId' in context)) return NextResponse.json({ error: 'Cuenta no disponible.' }, { status: 409 })
  const payload: Record<string, unknown> = { text }
  if (userLists.length) payload.userLists = userLists
  if (userIds.length) payload.userIds = userIds
  if (excludedLists.length) payload.excludedLists = excludedLists
  if (price > 0) payload.price = price
  if (mediaFiles.length) payload.mediaFiles = mediaFiles
  if (body?.lockedText === true) payload.lockedText = true
  if (scheduledDate) payload.scheduledDate = scheduledDate
  if (body?.saveForLater === true) payload.saveForLater = true
  if (body?.blockBannedWords === true) payload.blockBannedWords = 'risky'

  const response = await fansApiRequest(`https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/mass-messaging`, context.apiKey, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': request.headers.get('idempotency-key') || crypto.randomUUID() }, body: JSON.stringify(payload),
  })
  if (!response.response.ok) return NextResponse.json({ error: 'Fans API rechazó la campaña.', provider: response.payload }, { status: response.response.status })
  const providerData: any = response.payload
  const { error: logError } = await context.supabase.from('mass_message_campaigns').insert({
    model_id: modelId, provider_campaign_id: providerData?.data?.id ? String(providerData.data.id) : null,
    campaign_name: String(body?.campaignName || 'Campaña ' + new Date().toLocaleString()),
    message_text: text, audience: { userLists, userIds, excludedLists, price, mediaFilesCount: mediaFiles.length },
    scheduled_at: scheduledDate || null, status: body?.saveForLater ? 'draft' : scheduledDate ? 'scheduled' : 'sent',
    created_by: context.user.id, provider_response: providerData,
  })
  if (logError) return NextResponse.json({ warning: 'Fans API aceptó la campaña, pero MAISON no pudo guardar el registro local.', provider: response.payload }, { status: 207 })
  return NextResponse.json(response.payload)
}
