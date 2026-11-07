import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const modelId = searchParams.get('modelId') || ''
  if (!/^[0-9a-f-]{36}$/i.test(modelId)) return NextResponse.json({ error: 'Modelo no válido.' }, { status: 400 })
  const context = await getFansApiContext(request, modelId)
  if ('error' in context) return context.error
  const result = await fansApiRequest(`https://app.onlyfansapi.com/api/${encodeURIComponent(context.accountId)}/user-lists?view=queue&limit=50&offset=0`, context.apiKey)
  if (!result.response.ok) return NextResponse.json({ error: 'No se pudieron cargar las listas de destinatarios.', provider: result.payload }, { status: result.response.status })
  return NextResponse.json(result.payload)
}
