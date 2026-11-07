import { NextResponse } from 'next/server'
import { getFansApiContext } from '@/lib/fans-api'

export const runtime='nodejs'

export async function PATCH(request:Request,{params}:{params:Promise<{ruleId:string}>}){
 let body:any
 try{body=await request.json()}catch{return NextResponse.json({error:'Cuerpo JSON no válido.'},{status:400})}
 const {ruleId}=await params
 const modelId=String(body?.modelId||'')
 if(!/^[0-9a-f-]{36}$/i.test(ruleId)||!/^[0-9a-f-]{36}$/i.test(modelId))return NextResponse.json({error:'Regla o modelo no válidos.'},{status:400})
 const context=await getFansApiContext(request,modelId)
 if('error' in context)return context.error
 if(context.role==='chatter')return NextResponse.json({error:'Solo administradores y supervisores pueden modificar automatizaciones.'},{status:403})
 const patch:Record<string,unknown>={updated_at:new Date().toISOString()}
 if(typeof body?.name==='string'){const name=body.name.trim();if(name.length<2||name.length>80)return NextResponse.json({error:'El nombre debe tener entre 2 y 80 caracteres.'},{status:400});patch.name=name}
 if(typeof body?.messageText==='string'){const message=body.messageText.trim();if(!message||message.length>4000)return NextResponse.json({error:'El mensaje debe tener entre 1 y 4.000 caracteres.'},{status:400});patch.message_text=message}
 if(typeof body?.triggerEvent==='string'){if(!['subscriptions.new','subscriptions.renewed','subscriptions.expired'].includes(body.triggerEvent))return NextResponse.json({error:'Evento no válido.'},{status:400});patch.trigger_event=body.triggerEvent}
 if(typeof body?.isActive==='boolean')patch.is_active=body.isActive
 if(body?.delayMinutes!==undefined){const delay=Number(body.delayMinutes);if(!Number.isInteger(delay)||delay<0||delay>10080)return NextResponse.json({error:'El retraso debe estar entre 0 y 10.080 minutos.'},{status:400});patch.delay_minutes=delay}
 const {data,error}=await context.supabase.from('automation_rules').update(patch).eq('id',ruleId).eq('model_id',modelId)
  .select('id,model_id,name,trigger_event,message_text,is_active,delay_minutes,created_at,updated_at').single()
 if(error)return NextResponse.json({error:'No se pudo actualizar la automatización.'},{status:400})
 return NextResponse.json({data})
}

export async function DELETE(request:Request,{params}:{params:Promise<{ruleId:string}>}){
 const {ruleId}=await params
 const {searchParams}=new URL(request.url)
 const modelId=searchParams.get('modelId')||''
 if(!/^[0-9a-f-]{36}$/i.test(ruleId)||!/^[0-9a-f-]{36}$/i.test(modelId))return NextResponse.json({error:'Regla o modelo no válidos.'},{status:400})
 const context=await getFansApiContext(request,modelId)
 if('error' in context)return context.error
 if(context.role==='chatter')return NextResponse.json({error:'Solo administradores y supervisores pueden eliminar automatizaciones.'},{status:403})
 const {error}=await context.supabase.from('automation_rules').delete().eq('id',ruleId).eq('model_id',modelId)
 if(error)return NextResponse.json({error:'No se pudo eliminar la automatización.'},{status:400})
 return NextResponse.json({ok:true})
}
