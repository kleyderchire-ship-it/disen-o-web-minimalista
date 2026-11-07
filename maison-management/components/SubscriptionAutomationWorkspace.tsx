'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model={id:string;name:string}
type Rule={id:string;model_id:string;name:string;trigger_event:string;message_text:string;is_active:boolean;created_at:string}
type Run={id:string;rule_id:string;fan_provider_id:string;status:string;error:string|null;sent_at:string|null;created_at:string}
const triggerNames:Record<string,string>={'subscriptions.new':'Nuevo suscriptor','subscriptions.renewed':'Renovación','subscriptions.expired':'Suscripción vencida'}
const time=(v:string)=>new Date(v).toLocaleString()

export default function SubscriptionAutomationWorkspace({models,supabase,role}:{models:Model[];supabase:SupabaseClient;role:string}){
 const [modelId,setModelId]=useState('')
 const [rules,setRules]=useState<Rule[]>([])
 const [runs,setRuns]=useState<Run[]>([])
 const [name,setName]=useState('')
 const [trigger,setTrigger]=useState('subscriptions.new')
 const [message,setMessage]=useState('')
 const [editing,setEditing]=useState('')
 const [active,setActive]=useState(false)
 const [loading,setLoading]=useState(false)
 const [busy,setBusy]=useState('')
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 async function token(){const {data}=await supabase.auth.getSession();return data.session?.access_token||''}
 async function load(){
  if(!modelId)return
  setLoading(true);setError('')
  try{
   const auth=await token()
   const [ruleResponse,runResponse]=await Promise.all([
    fetch('/api/automations/rules?modelId='+encodeURIComponent(modelId),{headers:{Authorization:'Bearer '+auth},cache:'no-store'}),
    fetch('/api/automations/runs?modelId='+encodeURIComponent(modelId),{headers:{Authorization:'Bearer '+auth},cache:'no-store'})
   ])
   const [rulePayload,runPayload]=await Promise.all([ruleResponse.json(),runResponse.json()])
   if(!ruleResponse.ok)throw new Error(rulePayload.error||'No se pudieron cargar las reglas.')
   if(!runResponse.ok)throw new Error(runPayload.error||'No se pudo cargar el historial.')
   setRules(Array.isArray(rulePayload.data)?rulePayload.data:[])
   setRuns(Array.isArray(runPayload.data)?runPayload.data:[])
  }catch(e){setError(e instanceof Error?e.message:'No se pudieron cargar las automatizaciones.')}
  finally{setLoading(false)}
 }
 useEffect(()=>{if(!modelId&&models.length)setModelId(models[0].id)},[models,modelId])
 useEffect(()=>{if(modelId)load()},[modelId])
 function reset(){setEditing('');setName('');setTrigger('subscriptions.new');setMessage('');setActive(false)}
 async function save(event:React.FormEvent){
  event.preventDefault()
  if(!modelId||!name.trim()||!message.trim())return
  if(active&&!window.confirm('Vas a activar un mensaje automático. Se enviará desde la cuenta OnlyFans de la modelo cada vez que ocurra el evento seleccionado. ¿Confirmas?'))return
  setBusy('save');setError('');setNotice('')
  try{
   const auth=await token()
   const response=await fetch(editing?'/api/automations/rules/'+encodeURIComponent(editing):'/api/automations/rules',{
    method:editing?'PATCH':'POST',
    headers:{Authorization:'Bearer '+auth,'Content-Type':'application/json'},
    body:JSON.stringify({modelId,name:name.trim(),triggerEvent:trigger,messageText:message.trim(),isActive:active})
   })
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudo guardar la regla.')
   setNotice(editing?'Automatización actualizada.':'Automatización creada.')
   reset();await load()
  }catch(e){setError(e instanceof Error?e.message:'No se pudo guardar la regla.')}
  finally{setBusy('')}
 }
 function edit(rule:Rule){setEditing(rule.id);setName(rule.name);setTrigger(rule.trigger_event);setMessage(rule.message_text);setActive(rule.is_active)}
 async function toggle(rule:Rule){
  const next=!rule.is_active
  if(next&&!window.confirm('Activar “'+rule.name+'” enviará mensajes automáticamente a fans cuando ocurra: '+triggerNames[rule.trigger_event]+'. ¿Confirmas?'))return
  setBusy(rule.id);setError('');setNotice('')
  try{
   const response=await fetch('/api/automations/rules/'+encodeURIComponent(rule.id),{method:'PATCH',headers:{Authorization:'Bearer '+await token(),'Content-Type':'application/json'},body:JSON.stringify({modelId,isActive:next})})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudo cambiar el estado.')
   setNotice(next?'Automatización activada.':'Automatización pausada.')
   await load()
  }catch(e){setError(e instanceof Error?e.message:'No se pudo cambiar el estado.')}
  finally{setBusy('')}
 }
 async function remove(rule:Rule){
  if(!window.confirm('¿Eliminar la automatización “'+rule.name+'”? Su historial se conservará solo hasta que se elimine la regla.'))return
  setBusy(rule.id);setError('');setNotice('')
  try{
   const response=await fetch('/api/automations/rules/'+encodeURIComponent(rule.id)+'?modelId='+encodeURIComponent(modelId),{method:'DELETE',headers:{Authorization:'Bearer '+await token()}})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudo eliminar la regla.')
   setNotice('Automatización eliminada.')
   if(editing===rule.id)reset()
   await load()
  }catch(e){setError(e instanceof Error?e.message:'No se pudo eliminar la regla.')}
  finally{setBusy('')}
 }
 const ruleName=(id:string)=>rules.find(x=>x.id===id)?.name||'Regla eliminada'
 if(role==='chatter')return null
 if(!models.length)return <div className="panel empty">Añade y conecta una modelo para configurar automatizaciones.</div>
 return <div className="subscription-automation-workspace">
  <div className="panel automation-rule-form">
   <div className="section-head"><div><h2>{editing?'Editar automatización':'Crear mensaje automático'}</h2><p className="page-intro">Envía una respuesta cuando una suscripción nueva, renovación o vencimiento sea recibido por el webhook.</p></div><span className="date-pill">EVENTOS ONLYFANS</span></div>
   <form className="form-grid" onSubmit={save}>
    <div className="field"><label>Modelo</label><select value={modelId} onChange={e=>setModelId(e.target.value)}>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
    <div className="field"><label>Evento que activa el mensaje</label><select value={trigger} onChange={e=>setTrigger(e.target.value)}>{Object.entries(triggerNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
    <div className="field" style={{gridColumn:'1/-1'}}><label>Nombre interno</label><input value={name} onChange={e=>setName(e.target.value)} maxLength={80} placeholder="Ej. Bienvenida VIP"/></div>
    <div className="field" style={{gridColumn:'1/-1'}}><label>Mensaje automático</label><textarea rows={4} value={message} onChange={e=>setMessage(e.target.value)} maxLength={4000} placeholder="Escribe el mensaje que recibirá el fan…"/></div>
    <div className="field"><label>Estado inicial</label><label className="campaign-toggle"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/> Activar al guardar</label></div>
    <div className="automation-form-actions"><button type="button" className="btn-ghost" onClick={reset}>Limpiar</button><button className="btn" disabled={busy==='save'||!name.trim()||!message.trim()}>{busy==='save'?'Guardando…':editing?'Guardar cambios':'Crear regla'}</button></div>
   </form>
  </div>
  <div className="section-head"><div><h2>Reglas de automatización</h2><p className="page-intro">Los mensajes se envían inmediatamente cuando llega el evento. Los envíos quedan registrados para evitar duplicados.</p></div><button className="btn-ghost" onClick={load} disabled={loading}>{loading?'Actualizando…':'↻ Actualizar'}</button></div>
  <div className="automation-rule-list">{rules.map(rule=><article className="panel automation-rule-card" key={rule.id}><div className="automation-rule-main"><div><span className="eyebrow">{triggerNames[rule.trigger_event]||rule.trigger_event}</span><strong>{rule.name}</strong><p>{rule.message_text}</p></div><span className={'status '+(!rule.is_active?'pending':'')}>{rule.is_active?'Activa':'Pausada'}</span></div><div className="automation-rule-actions"><button className="btn-ghost" onClick={()=>edit(rule)}>Editar</button><button className="btn-ghost" onClick={()=>toggle(rule)} disabled={busy===rule.id}>{rule.is_active?'Pausar':'Activar'}</button><button className="btn-ghost" onClick={()=>remove(rule)} disabled={busy===rule.id}>Eliminar</button></div></article>)}{!loading&&rules.length===0&&<div className="panel empty">Todavía no hay reglas automáticas para esta modelo.</div>}</div>
  <div className="section-head"><div><h2>Historial de ejecuciones</h2><p className="page-intro">Últimos eventos procesados por el webhook.</p></div><span className="date-pill">{runs.length} REGISTROS</span></div>
  <div className="panel table-wrap"><table className="data-table"><thead><tr><th>REGLA</th><th>FAN</th><th>ESTADO</th><th>FECHA</th><th>DETALLE</th></tr></thead><tbody>{runs.map(run=><tr key={run.id}><td>{ruleName(run.rule_id)}</td><td>#{run.fan_provider_id}</td><td><span className={'status '+(run.status==='sent'?'':'pending')}>{run.status==='sent'?'Enviado':run.status==='failed'?'Fallido':run.status==='processing'?'Procesando':'Omitido'}</span></td><td>{time(run.sent_at||run.created_at)}</td><td>{run.error||'—'}</td></tr>)}{!loading&&runs.length===0&&<tr><td colSpan={5}><div className="empty">Las ejecuciones aparecerán aquí cuando se reciban eventos.</div></td></tr>}</tbody></table></div>
  <div className="notice automation-disclaimer">Para que las reglas envíen mensajes, añade la misma FANS_API_KEY en Supabase → Edge Functions → Secrets. Si también usas el mensaje de bienvenida nativo de OnlyFans, evita duplicarlo con una regla de “Nuevo suscriptor”. Esta versión ejecuta mensajes inmediatos, no secuencias con retraso.</div>
  {error&&<div className="notice inbox-feedback-error">{error}</div>}{notice&&<div className="notice inbox-feedback-ok">{notice}</div>}
 </div>
}
