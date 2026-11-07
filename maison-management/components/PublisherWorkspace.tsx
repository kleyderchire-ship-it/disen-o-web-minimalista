'use client'

import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model={id:string;name:string}
type VaultMedia={id:string|number;type:string;files?:{thumb?:{url?:string}|null;preview?:{url?:string}|null;full?:{url?:string}}}
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
 const [vaultItems,setVaultItems]=useState<VaultMedia[]>([])
 const [showVault,setShowVault]=useState(false)
 const [vaultLoading,setVaultLoading]=useState(false)
 const [vaultError,setVaultError]=useState('')
 async function openVault(){
  if(!modelId)return
  setShowVault(true);setVaultLoading(true);setVaultError('')
  try{
   const {data}=await supabase.auth.getSession()
   const response=await fetch('/api/vault?'+new URLSearchParams({modelId,offset:'0'}),{headers:{Authorization:'Bearer '+(data.session?.access_token||'')},cache:'no-store'})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudo abrir el vault.')
   const rows:VaultMedia[]=Array.isArray(payload?.data?.list)?payload.data.list:[]
   setVaultItems(rows.filter(item=>(item as any).isReady!==false&&!(item as any).hasError))
  }catch(e){setVaultError(e instanceof Error?e.message:'No se pudo abrir el vault.')}
  finally{setVaultLoading(false)}
 }
 function toggleMedia(id:string){
  const current=mediaIds.split(',').map(x=>x.trim()).filter(Boolean)
  setMediaIds(current.includes(id)?current.filter(x=>x!==id).join(', '):[...current,id].join(', '))
 }
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
   <div className="field" style={{gridColumn:'1/-1'}}><label>Archivos de la biblioteca</label><input value={mediaIds} onChange={e=>setMediaIds(e.target.value)} placeholder="IDs de medios separados por coma…"/><button type="button" className="btn-ghost" onClick={openVault}>Abrir vault y seleccionar archivos</button><small className="muted">Selecciona directamente los archivos de la biblioteca de la modelo.</small></div>
   {type==='post'&&<div className="field"><label>Programar fecha y hora (opcional)</label><input type="datetime-local" value={scheduled} onChange={e=>setScheduled(e.target.value)}/></div>}
   <div className="field"><label>Guardar como borrador</label><label className="campaign-toggle"><input type="checkbox" checked={saveForLater} onChange={e=>setSaveForLater(e.target.checked)}/> No publicar todavía</label></div>
  </div>
  <div className="campaign-actions"><span className="muted">Se solicita confirmación antes de cualquier publicación externa.</span><button className="btn" onClick={publish} disabled={busy}>{busy?'Procesando…':saveForLater?'Guardar borrador':scheduled?'Programar post':type==='story'?'Publicar historia':'Publicar ahora'}</button></div>
  {showVault&&<div className="modal-backdrop" onClick={()=>setShowVault(false)}><div className="modal publisher-vault-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><h3>Seleccionar del vault</h3><button type="button" className="btn-ghost" onClick={()=>setShowVault(false)}>Cerrar</button></div>{vaultLoading&&<div className="empty">Cargando biblioteca…</div>}{vaultError&&<div className="notice inbox-feedback-error">{vaultError}</div>}<div className="publisher-vault-grid">{vaultItems.map(item=>{const id=String(item.id);const src=item.files?.preview?.url||item.files?.thumb?.url||item.files?.full?.url;const selected=mediaIds.split(',').map(x=>x.trim()).includes(id);return <button type="button" key={id} className={'inbox-vault-item '+(selected?'selected':'')} onClick={()=>toggleMedia(id)}>{src?<img src={src} alt="Archivo del vault"/>:<span>{item.type}</span>}<small>#{id} · {item.type}</small></button>})}</div>{!vaultLoading&&!vaultError&&vaultItems.length===0&&<div className="empty">No hay archivos disponibles.</div>}<div className="modal-actions"><span className="muted">{mediaIds.split(',').map(x=>x.trim()).filter(Boolean).length} archivo(s) seleccionados</span><button type="button" className="btn" onClick={()=>setShowVault(false)}>Usar selección</button></div></div></div>}
  {error&&<div className="notice inbox-feedback-error">{error}</div>}{notice&&<div className="notice inbox-feedback-ok">{notice}</div>}
 </div>
}
