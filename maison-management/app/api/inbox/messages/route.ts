import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const modelId = searchParams.get('modelId') || ''
  const chatId = searchParams.get('chatId') || ''
  if (!/^[0-9a-f-]{36}$/i.test(modelId) || !/^\d{1,32}$/.test(chatId)) {
    return NextResponse.json({ error: 'Modelo o conversación no válidos.' }, { status: 400 })
  }

  const context = await getFansApiContext(request, modelId)
  if ('error' in context) return context.error;
  if (!('accountId' in context)) return NextResponse.json({ error: 'Cuenta no disponible.' }, { status: 409 })

  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)))
  const params = new URLSearchParams({ limit: String(limit), order: 'desc', skip_users: 'none' })
  const firstId = searchParams.get('first_id')
  if (firstId && /^\d{1,32}$/.test(firstId)) params.set('first_id', firstId)

  const url = `https://app.onlyfansapi.com/api/${encodeURIComponent(context.accountId)}/chats/${encodeURIComponent(chatId)}/messages?${params.toString()}`
  const result = await fansApiRequest(url, context.apiKey)
  if (!result.response.ok) return NextResponse.json({ error: 'No se pudo cargar la conversación.', provider: result.payload }, { status: result.response.status })
  return NextResponse.json(result.payload)
}

export async function POST(request: Request) {
  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo JSON no válido.' }, { status: 400 }) }

  const modelId = String(body?.modelId || '')
  const chatId = String(body?.chatId || '')
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const mediaFiles = Array.isArray(body?.mediaFiles) ? body.mediaFiles.filter((x: unknown) => typeof x === 'string' && x.length < 300) : []
  const price = body?.price == null ? 0 : Number(body.price)
  const lockedText = body?.lockedText === true

  if (!/^[0-9a-f-]{36}$/i.test(modelId) || !/^\d{1,32}$/.test(chatId)) return NextResponse.json({ error: 'Modelo o conversación no válidos.' }, { status: 400 })
  if (!text && mediaFiles.length === 0) return NextResponse.json({ error: 'Escribe un mensaje o selecciona contenido.' }, { status: 400 })
  if (!Number.isFinite(price) || (price !== 0 && (price < 3 || price > 200))) return NextResponse.json({ error: 'El precio PPV debe ser 0 o estar entre 3 y 200 USD.' }, { status: 400 })
  if (price > 0 && mediaFiles.length === 0 && !lockedText) return NextResponse.json({ error: 'Un PPV con precio necesita contenido multimedia o texto bloqueado.' }, { status: 400 })

  const context = await getFansApiContext(request, modelId)
  if ('error' in context) return context.error

  const idempotencyKey = request.headers.get('idempotency-key') || crypto.randomUUID()
  const payload: Record<string, unknown> = {}
  if (text) payload.text = text
  if (mediaFiles.length) payload.mediaFiles = mediaFiles
  if (price > 0) payload.price = price
  if (lockedText) payload.lockedText = true

  const url = `https://app.onlyfansapi.com/api/${encodeURIComponent(context.accountId)}/chats/${encodeURIComponent(chatId)}/messages`
  const result = await fansApiRequest(url, context.apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload),
  })
  if (!result.response.ok) return NextResponse.json({ error: 'Fans API no pudo enviar el mensaje.', provider: result.payload }, { status: result.response.status })
  return NextResponse.json(result.payload)
}
