import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const modelId = searchParams.get('modelId') || ''
  if (!/^[0-9a-f-]{36}$/i.test(modelId)) return NextResponse.json({ error: 'Modelo no válido.' }, { status: 400 })

  const context = await getFansApiContext(request, modelId)
  if ('error' in context) return context.error;
  if (!('accountId' in context)) return NextResponse.json({ error: 'Cuenta no disponible.' }, { status: 409 })

  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)))
  const offset = Math.max(0, Number(searchParams.get('offset') || 0))
  const order = searchParams.get('order') === 'old' ? 'old' : 'recent'
  const filter = searchParams.get('filter') || ''
  const query = searchParams.get('query') || ''
  const allowedFilters = new Set(['pinned','priority','unread','with_tips','unread_with_tips'])
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset), skip_users: 'none', order })
  if (allowedFilters.has(filter)) params.set('filter', filter)
  if (query.trim()) params.set('query', query.trim().slice(0, 120))

  const url = `https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/chats?${params.toString()}`
  const result = await fansApiRequest(url, context.apiKey)
  if (!result.response.ok) return NextResponse.json({ error: 'Fans API no pudo cargar la bandeja.', provider: result.payload }, { status: result.response.status })
  const payload: any = result.payload
  if (context.role === 'chatter' && Array.isArray(payload?.data)) {
    const { data: localRows } = await context.supabase.from('inbox_conversations').select('provider_chat_id,assigned_to').eq('model_id', modelId)
    const blocked = new Set((localRows || []).filter((row: any) => row.assigned_to && row.assigned_to !== context.user.id).map((row: any) => String(row.provider_chat_id)))
    payload.data = payload.data.filter((chat: any) => !blocked.has(String(chat?.fan?.id || '')))
  }
  return NextResponse.json(payload)
}
