'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model={id:string;name:string}
type AudienceList={id:string|number;name:string;usersCount?:number;type?:string}

export default function MassCampaignWorkspace({models,supabase}:{models:Model[];supabase:SupabaseClient}){
 const [modelId,setModelId]=useState('')
 const [lists,setLists]=useState<AudienceList[]>([])
 const [selected,setSelected]=useState<string[]>([])
 const [campaignName,setCampaignName]=useState('')
 const [message,setMessage]=useState('')
 const [mediaIds,setMediaIds]=useState('')
 const [price,setPrice]=useState('')
 const [lockedText,setLockedText]=useState(false)
 const [scheduled,setScheduled]=useState('')
 const [blockBanned,setBlockBanned]=useState(true)
 const [loading,setLoading]=useState(false)
 const [sending,setSending]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 useEffect(()=>{if(!modelId&&models.length)setModelId(models[0].id)},[models,modelId])
 async function token(){const {data}=await supabase.auth.getSession();return data.session?.access_token||''}
 async function loadLists(){
  if(!modelId)return
  setLoading(true);setError('')
  try{
   const response=await fetch('/api/inbox/mass/lists?modelId='+encodeURIComponent(modelId),{headers:{Authorization:'Bearer '+await token()},cache:'no-store'})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudieron cargar las listas.')
   const rows:AudienceList[]=Array.isArray(payload?.data)?payload.data:[]
   setLists(rows)
   setSelected(current=>current.filter(id=>rows.some(row=>String(row.id)===id)))
  }catch(e){setError(e instanceof Error?e.message:'Error cargando listas.');setLists([])}
  finally{setLoading(false)}
 }
 useEffect(()=>{setSelected([]);setLists([]);if(modelId)loadLists()},[modelId])
 const selectedCount=lists.filter(x=>selected.includes(String(x.id))).reduce((sum,x)=>sum+(x.usersCount||0),0)
 async function send(){
  if(!message.trim()||!selected.length)return
  const model=models.find(x=>x.id===modelId)
  const scheduledDate=scheduled?new Date(scheduled):null
  const mediaFiles=mediaIds.split(',').map(x=>x.trim()).filter(Boolean)
  const amount=price?Number(price):0
  if(!Number.isFinite(amount)||(amount!==0&&(!Number.isInteger(amount)||amount<3||amount>200))){setError('El precio debe ser 0 o estar entre 3 y 200 USD.');return}
  if(amount>0&&!mediaFiles.length){setError('Un PPV masivo necesita contenido multimedia del vault.');return}
  if(scheduledDate&&(!Number.isFinite(scheduledDate.getTime())||scheduledDate.getTime()<=Date.now())){setError('La programación debe ser una fecha futura.');return}
  const action=scheduledDate?'programar':'enviar ahora'
  const approved=window.confirm('Vas a '+action+' una campaña de OnlyFans.\nModelo: '+(model?.name||'')+'\nListas: '+selected.length+'\nDestinatarios aproximados: '+selectedCount+'\nPPV: '+(amount?amount+' USD':'Gratis')+'\nArchivos: '+mediaFiles.length+'\n\nEsta acción se ejecutará fuera de MAISON. ¿Confirmas?')
  if(!approved)return
  setSending(true);setError('');setNotice('')
  try{
   const response=await fetch('/api/inbox/mass',{method:'POST',headers:{Authorization:'Bearer '+await token(),'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({modelId,campaignName:campaignName.trim()||'Campaña MAISON',text:message.trim(),userLists:selected,mediaFiles,price:amount,lockedText,scheduledDate:scheduledDate?.toISOString(),blockBannedWords:blockBanned})})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudo ejecutar la campaña.')
   setNotice(scheduledDate?'Campaña programada correctamente.':'Campaña enviada a Fans API.')
   setMessage('');setCampaignName('');setScheduled('');setMediaIds('');setPrice('');setLockedText(false)
  }catch(e){setError(e instanceof Error?e.message:'No se pudo ejecutar la campaña.')}
  finally{setSending(false)}
 }
 if(!models.length)return <div className="panel empty">Añade un modelo para crear campañas.</div>
 return <div className="campaign-workspace">
  <div className="panel campaign-builder">
   <div className="section-head"><div><h2>Nueva campaña</h2><p className="page-intro">Mensajes masivos segmentados por las listas reales de OnlyFans.</p></div><span className="date-pill">MASS MESSAGING</span></div>
   <div className="form-grid">
    <div className="field"><label>Modelo</label><select value={modelId} onChange={e=>setModelId(e.target.value)}>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
    <div className="field"><label>Nombre interno de campaña</label><input value={campaignName} onChange={e=>setCampaignName(e.target.value)} placeholder="Ej. Recompra VIP de noviembre"/></div>
    <div className="field" style={{gridColumn:'1/-1'}}><label>Audiencia (puedes seleccionar varias listas)</label><div className="campaign-list-box">{loading&&<div className="empty">Cargando listas…</div>}{!loading&&lists.length===0&&<div className="empty">No hay listas disponibles o la cuenta no está conectada.</div>}{lists.map(list=><label className="campaign-list-option" key={String(list.id)}><input type="checkbox" checked={selected.includes(String(list.id))} onChange={e=>setSelected(current=>e.target.checked?[...current,String(list.id)]:current.filter(id=>id!==String(list.id)))}/><span><strong>{list.name}</strong><small>{list.usersCount??0} destinatarios · {list.type||'lista'}</small></span></label>)}</div><div className="muted">{selected.length} listas seleccionadas · {selectedCount} destinatarios aproximados</div></div>
    <div className="field" style={{gridColumn:'1/-1'}}><label>Mensaje</label><textarea rows={5} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Escribe el mensaje que recibirán los fans…"/></div>
    <div className="field"><label>IDs de medios del vault (separados por coma)</label><input value={mediaIds} onChange={e=>setMediaIds(e.target.value)} placeholder="Opcional: 123456789, 987654321"/></div>
    <div className="field"><label>Precio PPV (USD)</label><input type="number" min="3" max="200" step="1" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Gratis"/></div>
    <div className="field"><label>Texto bloqueado</label><label className="campaign-toggle"><input type="checkbox" checked={lockedText} onChange={e=>setLockedText(e.target.checked)}/> Bloquear texto hasta la compra</label></div>
    <div className="field"><label>Programar para (opcional)</label><input type="datetime-local" value={scheduled} onChange={e=>setScheduled(e.target.value)}/></div>
    <div className="field"><label>Protección de palabras restringidas</label><label className="campaign-toggle"><input type="checkbox" checked={blockBanned} onChange={e=>setBlockBanned(e.target.checked)}/> Revisar palabras de riesgo</label></div>
   </div>
   <div className="campaign-actions"><button className="btn-ghost" onClick={loadLists} disabled={loading}>Actualizar listas</button><button className="btn" onClick={send} disabled={sending||!message.trim()||!selected.length}>{sending?'Procesando…':scheduled?'Programar campaña':'Enviar campaña'}</button></div>
   {error&&<div className="notice inbox-feedback-error">{error}</div>}{notice&&<div className="notice inbox-feedback-ok">{notice}</div>}
  </div>
  <p className="muted campaign-note">Antes de enviar o programar, MAISON muestra una confirmación con el modelo y la audiencia. Las campañas se ejecutan en la cuenta OnlyFans conectada.</p>
 </div>
}
