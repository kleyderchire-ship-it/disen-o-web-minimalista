import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

export async function POST(request: Request,{params}:{params:Promise<{listId:string}>}) {
  let body:any
  try{body=await request.json()}catch{return NextResponse.json({error:'Cuerpo JSON no válido.'},{status:400})}
  const {listId}=await params
  const modelId=String(body?.modelId||'')
  const ids=Array.isArray(body?.ids)?body.ids.map((x:unknown)=>String(x)).filter((x:string)=>/^\d{1,32}$/.test(x)): []
  if(!/^[0-9a-f-]{36}$/i.test(modelId)||!listId||listId.length>80||!ids.length||ids.length>100)return NextResponse.json({error:'Modelo, etiqueta o selección de fans no válidos.'},{status:400})
  const context=await getFansApiContext(request,modelId)
  if('error' in context)return context.error
  if(!('accountId' in context))return NextResponse.json({error:'Cuenta no disponible.'},{status:409})
  const url=`https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/user-lists/${encodeURIComponent(listId)}/users`
  const result=await fansApiRequest(url,context.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids,skip_invalid:true})})
  if(!result.response.ok)return NextResponse.json({error:'No se pudieron agregar los fans a la etiqueta.',provider:result.payload},{status:result.response.status})
  return NextResponse.json(result.payload)
}
