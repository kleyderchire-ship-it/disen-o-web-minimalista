import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const modelId = searchParams.get('modelId') || ''
  if (!/^[0-9a-f-]{36}$/i.test(modelId)) return NextResponse.json({ error: 'Modelo no válido.' }, { status: 400 })
  const context = await getFansApiContext(request, modelId)
  if ('error' in context) return context.error
  if (!('accountId' in context)) return NextResponse.json({ error: 'Cuenta no disponible.' }, { status: 409 })

  const type = ['active','expired','all'].includes(searchParams.get('type') || '') ? searchParams.get('type')! : 'all'
  const limit = Math.min(20,Math.max(1,Number(searchParams.get('limit')||20)))
  const offset = Math.max(0,Number(searchParams.get('offset')||0))
  const params = new URLSearchParams({type,limit:String(limit),offset:String(offset)})
  const query = searchParams.get('query') || ''
  if(query.trim())params.set('query',query.trim().slice(0,100))
  const online = searchParams.get('online')
  if(online==='1'||online==='0')params.set('filter[online]',online)
  for(const key of ['total_spent','tips','duration','max_total_spent']){
    const value=searchParams.get(key)
    if(value!==null&&Number.isFinite(Number(value))&&Number(value)>=0)params.set('filter['+key+']',value)
  }
  const result=await fansApiRequest(`https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/fans/all?${params.toString()}`,context.apiKey)
  if(!result.response.ok)return NextResponse.json({error:'No se pudo consultar el CRM de fans.',provider:result.payload}, {status:result.response.status})
  return NextResponse.json(result.payload)
}
