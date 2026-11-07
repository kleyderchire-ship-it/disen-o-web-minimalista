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

  const params = new URLSearchParams()
  const query = searchParams.get('query') || ''
  const type = searchParams.get('type') || ''
  const field = searchParams.get('field') || 'recent'
  const offset = Math.max(0, Number(searchParams.get('offset') || 0))
  if (query.trim()) params.set('query', query.trim().slice(0, 100))
  if (['photo','gif','video','audio'].includes(type)) params.set('type', type)
  if (['recent','most-liked','highest-tips'].includes(field)) params.set('field', field)
  params.set('sort', 'desc')
  params.set('limit', '48')
  params.set('offset', String(offset))
  const result = await fansApiRequest(`https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/media/vault?${params.toString()}`, context.apiKey)
  if (!result.response.ok) return NextResponse.json({ error: 'No se pudo cargar la biblioteca de OnlyFans.', provider: result.payload }, { status: result.response.status })
  return NextResponse.json(result.payload)
}
