'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model={id:string;name:string}
export default function WelcomeAutomationWorkspace({models,supabase}:{models:Model[];supabase:SupabaseClient}){
 const [modelId,setModelId]=useState('')
 const [text,setText]=useState('')
 const [mediaIds,setMediaIds]=useState('')
 const [price,setPrice]=useState('')
 const [lockedText,setLockedText]=useState(false)
 const [enabled,setEnabled]=useState(false)
 const [loading,setLoading]=useState(false)
 const [saving,setSaving]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 useEffect(()=>{if(!modelId&&models.length)setModelId(models[0].id)},[models,modelId])
 async function token(){const {data}=await supabase.auth.getSession();return data.session?.access_token||''}
 async function load(){
  if(!modelId)return
  setLoading(true);setError('')
  try{
   const response=await fetch('/api/automations/welcome?modelId='+encodeURIComponent(modelId),{headers:{Authorization:'Bearer '+await token()},cache:'no-store'})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudo cargar la automatización.')
   const data=payload?.data||{}
   setText(String(data.text||'').replace(/<[^>]*>/g,' ').trim())
   setEnabled(Boolean(data.isActive))
   setPrice(data.price?String(data.price):'')
   setLockedText(Boolean(data.lockedText))
   setMediaIds(Array.isArray(data.media)?data.media.map((x:any)=>String(x.id)).join(', '):'')
  }catch(e){setError(e instanceof Error?e.message:'Error consultando el mensaje de bienvenida.')}
  finally{setLoading(false)}
 }
 useEffect(()=>{if(modelId)load()},[modelId])
 async function save(){
  const mediaFiles=mediaIds.split(',').map(x=>x.trim()).filter(Boolean)
  const amount=price?Number(price):0
  if(!text.trim()&&!mediaFiles.length){setError('Escribe un mensaje o selecciona archivos.');return}
  if(!Number.isFinite(amount)||(amount!==0&&(amount<3||amount>200))){setError('El precio debe ser 0 o estar entre 3 y 200 USD.');return}
  if(amount>0&&!mediaFiles.length){setError('Para un mensaje PPV debes adjuntar contenido del vault.');return}
  if(!window.confirm('Vas a actualizar el mensaje automático de bienvenida de '+(models.find(m=>m.id===modelId)?.name||'esta modelo')+' en OnlyFans. Estado: '+(enabled?'activado':'desactivado')+'. ¿Confirmas?'))return
  setSaving(true);setError('');setNotice('')
  try{
   const response=await fetch('/api/automations/welcome',{method:'POST',headers:{Authorization:'Bearer '+await token(),'Content-Type':'application/json'},body:JSON.stringify({modelId,text:text.trim(),mediaFiles,price:amount,lockedText,enabled})})
   const payload=await response.json()
   if(!response.ok&&response.status!==207)throw new Error(payload.error||'No se pudo guardar.')
   setNotice(payload.warning||'Mensaje de bienvenida actualizado en OnlyFans.')
  }catch(e){setError(e instanceof Error?e.message:'No se pudo guardar la automatización.')}
  finally{setSaving(false)}
 }
 if(!models.length)return <div className="panel empty">Añade una modelo para configurar su bienvenida automática.</div>
 return <div className="panel welcome-automation">
  <div className="section-head"><div><h2>Mensaje automático de bienvenida</h2><p className="page-intro">Se envía desde OnlyFans cuando una persona se suscribe a la modelo.</p></div><span className={'status '+(enabled?'':'pending')}>{enabled?'Activado':'Desactivado'}</span></div>
  <div className="form-grid">
   <div className="field"><label>Modelo</label><select value={modelId} onChange={e=>setModelId(e.target.value)}>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
   <div className="field"><label>Estado de automatización</label><label className="campaign-toggle"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Activar mensaje automático</label></div>
   <div className="field" style={{gridColumn:'1/-1'}}><label>Texto de bienvenida</label><textarea rows={4} value={text} onChange={e=>setText(e.target.value)} placeholder="Escribe el mensaje que recibirá cada nuevo suscriptor…"/></div>
   <div className="field" style={{gridColumn:'1/-1'}}><label>IDs de medios del vault (separados por coma)</label><input value={mediaIds} onChange={e=>setMediaIds(e.target.value)} placeholder="Opcional: 123456789, 987654321"/></div>
   <div className="field"><label>Precio PPV (USD)</label><input type="number" min="3" max="200" step="1" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Gratis"/></div>
   <div className="field"><label>Contenido bloqueado</label><label className="campaign-toggle"><input type="checkbox" checked={lockedText} onChange={e=>setLockedText(e.target.checked)}/> Ocultar texto hasta la compra</label></div>
  </div>
  <div className="campaign-actions"><button className="btn-ghost" onClick={load} disabled={loading}>{loading?'Cargando…':'Recargar desde OnlyFans'}</button><button className="btn" onClick={save} disabled={saving||loading}>{saving?'Guardando…':'Guardar automatización'}</button></div>
  {error&&<div className="notice inbox-feedback-error">{error}</div>}{notice&&<div className="notice inbox-feedback-ok">{notice}</div>}
 </div>
}
