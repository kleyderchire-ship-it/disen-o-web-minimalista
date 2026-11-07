import { NextResponse } from 'next/server'
import { getFansApiContext } from '@/lib/fans-api'

export const runtime='nodejs'

export async function GET(request:Request){
 const modelId=new URL(request.url).searchParams.get('modelId')||''
 if(!/^[0-9a-f-]{36}$/i.test(modelId))return NextResponse.json({error:'Modelo no válido.'},{status:400})
 const context=await getFansApiContext(request,modelId)
 if('error' in context)return context.error
 if(context.role==='chatter')return NextResponse.json({error:'Solo administradores y supervisores pueden ver automatizaciones.'},{status:403})
 const {data,error}=await context.supabase.from('automation_rules')
  .select('id,model_id,name,trigger_event,message_text,is_active,delay_minutes,created_at,updated_at')
  .eq('model_id',modelId).order('created_at',{ascending:false})
 if(error)return NextResponse.json({error:'No se pudieron cargar las automatizaciones.'},{status:500})
 return NextResponse.json({data:data||[]})
}

export async function POST(request:Request){
 let body:any
 try{body=await request.json()}catch{return NextResponse.json({error:'Cuerpo JSON no válido.'},{status:400})}
 const modelId=String(body?.modelId||'')
 const name=typeof body?.name==='string'?body.name.trim():''
 const triggerEvent=String(body?.triggerEvent||'')
 const messageText=typeof body?.messageText==='string'?body.messageText.trim():''
 const isActive=body?.isActive===true
 const delayMinutes=body?.delayMinutes===undefined?0:Number(body.delayMinutes)
 if(!/^[0-9a-f-]{36}$/i.test(modelId)||name.length<2||name.length>80||!['subscriptions.new','subscriptions.renewed','subscriptions.expired'].includes(triggerEvent)||messageText.length<1||messageText.length>4000||!Number.isInteger(delayMinutes)||delayMinutes<0||delayMinutes>10080)return NextResponse.json({error:'Revisa el nombre, el evento y el mensaje (máximo 4.000 caracteres).'}, {status:400})
 const context=await getFansApiContext(request,modelId)
 if('error' in context)return context.error
 if(context.role==='chatter')return NextResponse.json({error:'Solo administradores y supervisores pueden crear automatizaciones.'},{status:403})
 const {data,error}=await context.supabase.from('automation_rules').insert({
  model_id:modelId,name,trigger_event:triggerEvent,message_text:messageText,is_active:isActive,delay_minutes:delayMinutes,created_by:context.user.id
 }).select('id,model_id,name,trigger_event,message_text,is_active,delay_minutes,created_at,updated_at').single()
 if(error)return NextResponse.json({error:error.code==='23505'?'Ya existe una automatización con ese nombre para esta modelo.':'No se pudo guardar la automatización.'},{status:400})
 return NextResponse.json({data})
}
