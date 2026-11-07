'use client'

import {useEffect,useState} from 'react'
import type {SupabaseClient} from '@supabase/supabase-js'
type Model={id:string;name:string}
type LinkRow={id:number|string;campaignName:string;campaignUrl:string;subscribersCount:number;clicksCount:number;createdAt:string;tags?:string[];revenue?:{total:number;revenuePerSubscriber:number;revenuePerClick:number;spendersCount:number;isLoading:boolean}}
const usd=(v:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(v||0)
export default function TrackingLinksWorkspace({models,supabase}:{models:Model[];supabase:SupabaseClient}){
 const [modelId,setModelId]=useState('')
 const [rows,setRows]=useState<LinkRow[]>([])
 const [name,setName]=useState('')
 const [tags,setTags]=useState('')
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
   const response=await fetch('/api/tracking-links?modelId='+encodeURIComponent(modelId),{headers:{Authorization:'Bearer '+await token()},cache:'no-store'})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudieron cargar los enlaces.')
   setRows(Array.isArray(payload?.data?.list)?payload.data.list:Array.isArray(payload?.data)?payload.data:[])
  }catch(e){setError(e instanceof Error?e.message:'Error consultando enlaces.');setRows([])}
  finally{setLoading(false)}
 }
 useEffect(()=>{if(modelId)load()},[modelId])
 async function create(event:React.FormEvent){
  event.preventDefault()
  if(!name.trim())return
  if(!window.confirm('Vas a crear un enlace de seguimiento en OnlyFans para '+(models.find(m=>m.id===modelId)?.name||'esta modelo')+'. ¿Confirmas?'))return
  setSaving(true);setError('');setNotice('')
  try{
   const response=await fetch('/api/tracking-links',{method:'POST',headers:{Authorization:'Bearer '+await token(),'Content-Type':'application/json'},body:JSON.stringify({modelId,name:name.trim(),tags:tags.split(',').map(x=>x.trim()).filter(Boolean)})})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudo crear el enlace.')
   setName('');setTags('');setNotice('Enlace de seguimiento creado.');await load()
  }catch(e){setError(e instanceof Error?e.message:'Error creando enlace.')}
  finally{setSaving(false)}
 }
 return <div className="tracking-workspace">
  <div className="panel tracking-create"><div className="section-head"><div><h2>Crear enlace de seguimiento</h2><p className="page-intro">Mide clics, suscripciones e ingresos por fuente de tráfico.</p></div></div>
   <form className="form-grid" onSubmit={create}><div className="field"><label>Modelo</label><select value={modelId} onChange={e=>setModelId(e.target.value)}>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div><div className="field"><label>Nombre de campaña</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Instagram bio noviembre"/></div><div className="field" style={{gridColumn:'1/-1'}}><label>Etiquetas (separadas por coma)</label><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="Instagram, Bio, Noviembre"/></div><div style={{gridColumn:'1/-1',display:'flex',justifyContent:'flex-end'}}><button className="btn" disabled={saving||!name.trim()}>{saving?'Creando…':'Crear enlace'}</button></div></form>
  </div>
  <div className="section-head"><div><h2>Rendimiento de enlaces</h2><p className="page-intro">Resultados agregados de cada campaña.</p></div><button className="btn-ghost" onClick={load} disabled={loading}>{loading?'Actualizando…':'↻ Actualizar'}</button></div>
  <div className="panel table-wrap"><table className="data-table"><thead><tr><th>CAMPAÑA</th><th>CLICS</th><th>SUSCRIPCIONES</th><th>INGRESOS</th><th>INGRESO / CLICK</th><th>ENLACE</th></tr></thead><tbody>{rows.map(row=><tr key={String(row.id)}><td><strong>{row.campaignName}</strong><small className="muted">{row.tags?.join(', ')}</small></td><td>{row.clicksCount||0}</td><td>{row.subscribersCount||0}</td><td className="gold">{row.revenue?.isLoading?'Calculando…':usd(row.revenue?.total||0)}</td><td>{usd(row.revenue?.revenuePerClick||0)}</td><td>{row.campaignUrl?<a className="tracking-link" href={row.campaignUrl} target="_blank" rel="noreferrer">Abrir enlace ↗</a>:'—'}</td></tr>)}{!loading&&rows.length===0&&<tr><td colSpan={6}><div className="empty">No hay enlaces de seguimiento creados para esta cuenta.</div></td></tr>}</tbody></table></div>
  {error&&<div className="notice inbox-feedback-error">{error}</div>}{notice&&<div className="notice inbox-feedback-ok">{notice}</div>}
 </div>
}
