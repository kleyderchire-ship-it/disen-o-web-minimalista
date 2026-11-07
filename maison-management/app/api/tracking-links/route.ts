import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

export async function GET(request:Request){
 const {searchParams}=new URL(request.url)
 const modelId=searchParams.get('modelId')||''
 if(!/^[0-9a-f-]{36}$/i.test(modelId))return NextResponse.json({error:'Modelo no válido.'},{status:400})
 const context=await getFansApiContext(request,modelId)
 if('error' in context)return context.error
 if(!('accountId' in context))return NextResponse.json({error:'Cuenta no disponible.'},{status:409})
 const params=new URLSearchParams({limit:'100',offset:searchParams.get('offset')||'0',pagination:'1',sort:'desc',sortby:'created_date'})
 for(const key of ['startDate','endDate']){const value=searchParams.get(key);if(value)params.set(key,value)}
 const result=await fansApiRequest(`https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/tracking-links?${params.toString()}`,context.apiKey)
 if(!result.response.ok)return NextResponse.json({error:'No se pudieron cargar los enlaces de seguimiento.',provider:result.payload},{status:result.response.status})
 return NextResponse.json(result.payload)
}

export async function POST(request:Request){
 let body:any
 try{body=await request.json()}catch{return NextResponse.json({error:'Cuerpo JSON no válido.'},{status:400})}
 const modelId=String(body?.modelId||'')
 const name=typeof body?.name==='string'?body.name.trim():''
 const tags=Array.isArray(body?.tags)?body.tags.filter((x:unknown)=>typeof x==='string').slice(0,20):[]
 if(!/^[0-9a-f-]{36}$/i.test(modelId)||name.length<2||name.length>120)return NextResponse.json({error:'Indica un modelo y un nombre de enlace de 2 a 120 caracteres.'},{status:400})
 const context=await getFansApiContext(request,modelId)
 if('error' in context)return context.error
 if(!('accountId' in context))return NextResponse.json({error:'Cuenta no disponible.'},{status:409})
 const result=await fansApiRequest(`https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/tracking-links`,context.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,tags})})
 if(!result.response.ok)return NextResponse.json({error:'No se pudo crear el enlace de seguimiento.',provider:result.payload},{status:result.response.status})
 return NextResponse.json(result.payload)
}
