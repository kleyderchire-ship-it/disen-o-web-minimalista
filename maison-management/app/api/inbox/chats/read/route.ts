import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo JSON no válido.' }, { status: 400 }) }
  const modelId = String(body?.modelId || '')
  const chatId = String(body?.chatId || '')
  const action = body?.action === 'unread' ? 'unread' : 'read'
  if (!/^[0-9a-f-]{36}$/i.test(modelId) || !/^\d{1,32}$/.test(chatId)) return NextResponse.json({ error: 'Modelo o conversación no válidos.' }, { status: 400 })
  const context = await getFansApiContext(request, modelId)
  if ('error' in context) return context.error
  if (!('accountId' in context)) return NextResponse.json({ error: 'Cuenta no disponible.' }, { status: 409 })
  const suffix = action === 'read' ? 'mark-as-read' : 'mark-as-unread'
  const result = await fansApiRequest(`https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/chats/${encodeURIComponent(chatId)}/${suffix}`, context.apiKey, { method: 'POST' })
  if (!result.response.ok) return NextResponse.json({ error: 'No se pudo actualizar el estado de lectura.', provider: result.payload }, { status: result.response.status })
  return NextResponse.json(result.payload)
}
