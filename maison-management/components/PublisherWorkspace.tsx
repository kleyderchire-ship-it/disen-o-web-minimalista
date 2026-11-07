'use client'

import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model={id:string;name:string}
export default function PublisherWorkspace({models,supabase}:{models:Model[];supabase:SupabaseClient}){
 const [modelId,setModelId]=useState(models[0]?.id||'')
 const [type,setType]=useState<'post'|'story'>('post')
 const [text,setText]=useState('')
 const [mediaIds,setMediaIds]=useState('')
 const [scheduled,setScheduled]=useState('')
 const [saveForLater,setSaveForLater]=useState(false)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 async function publish(){
  const mediaFiles=mediaIds.split(',').map(x=>x.trim()).filter(Boolean)
  if(type==='story'&&!mediaFiles.length){setError('Selecciona al menos un archivo del vault.');return}
  if(type==='post'&&!text.trim()){setError('Escribe el texto de la publicación.');return}
  const date=scheduled?new Date(scheduled):null
  if(date&&(!Number.isFinite(date.getTime())||date.getTime()<=Date.now())){setError('La fecha programada debe estar en el futuro.');return}
  const model=models.find(x=>x.id===modelId)
  const action=saveForLater?'guardar como borrador':scheduled?'programar':'publicar ahora'
  if(!window.confirm('Vas a '+action+' contenido en OnlyFans.\nModelo: '+(model?.name||'')+'\nTipo: '+(type==='story'?'Historia':'Publicación')+'\nArchivos: '+mediaFiles.length+'\n\n¿Confirmas esta acción?'))return
  setBusy(true);setError('');setNotice('')
  try{
   const {data}=await supabase.auth.getSession()
   const response=await fetch('/api/content/publish',{method:'POST',headers:{Authorization:'Bearer '+(data.session?.access_token||''),'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({modelId,type,text:text.trim(),mediaFiles,scheduledDate:date?.toISOString(),saveForLater})})
   const payload=await response.json()
   if(!response.ok&&response.status!==207)throw new Error(payload.error||'No se pudo publicar.')
   setNotice(payload.warning|| (saveForLater?'Borrador guardado en OnlyFans y MAISON.':scheduled?'Publicación programada correctamente.':type==='story'?'Historia publicada en OnlyFans.':'Publicación enviada a OnlyFans.'))
   if(!saveForLater){setText('');setMediaIds('');setScheduled('')}
  }catch(e){setError(e instanceof Error?e.message:'Error al publicar contenido.')}
  finally{setBusy(false)}
 }
 if(!models.length)return <div className="panel empty">Añade un modelo para gestionar publicaciones.</div>
 return <div className="panel publisher-workspace">
  <div className="section-head"><div><h2>Publicar desde MAISON</h2><p className="page-intro">Crea posts, programa publicaciones y publica historias en la cuenta autorizada.</p></div><span className="date-pill">PUBLICACIÓN DIRECTA</span></div>
  <div className="form-grid">
   <div className="field"><label>Modelo</label><select value={modelId} onChange={e=>setModelId(e.target.value)}>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
   <div className="field"><label>Tipo de contenido</label><select value={type} onChange={e=>{setType(e.target.value as 'post'|'story');setScheduled('')}}><option value="post">Publicación / Post</option><option value="story">Historia / Story</option></select></div>
   {type==='post'&&<div className="field" style={{gridColumn:'1/-1'}}><label>Texto de la publicación</label><textarea rows={4} value={text} onChange={e=>setText(e.target.value)} placeholder="Escribe el texto que acompañará la publicación…"/></div>}
   <div className="field" style={{gridColumn:'1/-1'}}><label>IDs de medios del vault (separados por coma)</label><input value={mediaIds} onChange={e=>setMediaIds(e.target.value)} placeholder="Ej. 123456789, 987654321, ofapi_media_…"/><small className="muted">Usa los identificadores de los archivos de la biblioteca de OnlyFans.</small></div>
   {type==='post'&&<div className="field"><label>Programar fecha y hora (opcional)</label><input type="datetime-local" value={scheduled} onChange={e=>setScheduled(e.target.value)}/></div>}
   <div className="field"><label>Guardar como borrador</label><label className="campaign-toggle"><input type="checkbox" checked={saveForLater} onChange={e=>setSaveForLater(e.target.checked)}/> No publicar todavía</label></div>
  </div>
  <div className="campaign-actions"><span className="muted">Se solicita confirmación antes de cualquier publicación externa.</span><button className="btn" onClick={publish} disabled={busy}>{busy?'Procesando…':saveForLater?'Guardar borrador':scheduled?'Programar post':type==='story'?'Publicar historia':'Publicar ahora'}</button></div>
  {error&&<div className="notice inbox-feedback-error">{error}</div>}{notice&&<div className="notice inbox-feedback-ok">{notice}</div>}
 </div>
}
