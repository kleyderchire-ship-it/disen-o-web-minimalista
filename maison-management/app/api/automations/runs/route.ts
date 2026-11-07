import { NextResponse } from 'next/server'
import { getFansApiContext } from '@/lib/fans-api'

export const runtime='nodejs'

export async function GET(request:Request){
 const modelId=new URL(request.url).searchParams.get('modelId')||''
 if(!/^[0-9a-f-]{36}$/i.test(modelId))return NextResponse.json({error:'Modelo no válido.'},{status:400})
 const context=await getFansApiContext(request,modelId)
 if('error' in context)return context.error
 if(context.role==='chatter')return NextResponse.json({error:'Solo administradores y supervisores pueden ver el historial.'},{status:403})
 const {data,error}=await context.supabase.from('automation_runs')
  .select('id,rule_id,fan_provider_id,source_event_id,provider_message_id,status,error,sent_at,scheduled_at,attempts,created_at')
  .eq('model_id',modelId).order('created_at',{ascending:false}).limit(30)
 if(error)return NextResponse.json({error:'No se pudo cargar el historial de automatizaciones.'},{status:500})
 return NextResponse.json({data:data||[]})
}
