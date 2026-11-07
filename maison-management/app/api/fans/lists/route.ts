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
  const result = await fansApiRequest(`https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/user-lists?limit=50&offset=0`, context.apiKey)
  if (!result.response.ok) return NextResponse.json({ error: 'No se pudieron cargar las etiquetas y listas.', provider: result.payload }, { status: result.response.status })
  return NextResponse.json(result.payload)
}

export async function POST(request: Request) {
  let body:any
  try{body=await request.json()}catch{return NextResponse.json({error:'Cuerpo JSON no válido.'},{status:400})}
  const modelId=String(body?.modelId||'')
  const name=typeof body?.name==='string'?body.name.trim():''
  if(!/^[0-9a-f-]{36}$/i.test(modelId)||name.length<2||name.length>64)return NextResponse.json({error:'Indica un modelo y un nombre de etiqueta de 2 a 64 caracteres.'},{status:400})
  const context=await getFansApiContext(request,modelId)
  if('error' in context)return context.error
  if(context.role==='chatter')return NextResponse.json({error:'Solo administradores y supervisores pueden crear etiquetas.'},{status:403})
  if(!('accountId' in context))return NextResponse.json({error:'Cuenta no disponible.'},{status:409})
  const result=await fansApiRequest(`https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/user-lists`,context.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})})
  if(!result.response.ok)return NextResponse.json({error:'No se pudo crear la etiqueta.',provider:result.payload},{status:result.response.status})
  return NextResponse.json(result.payload)
}
