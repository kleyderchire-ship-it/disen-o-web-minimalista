'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model = {id:string;name:string}
type VaultMedia = {id:number|string;type:string;createdAt?:string;duration?:number;files?:{full?:{url?:string};thumb?:{url?:string}|null;preview?:{url?:string}|null};counters?:{likesCount?:number;tipsSumm?:number};isReady?:boolean;hasError?:boolean}

export default function VaultWorkspace({models,supabase}:{models:Model[];supabase:SupabaseClient}) {
 const [modelId,setModelId]=useState('')
 const [items,setItems]=useState<VaultMedia[]>([])
 const [type,setType]=useState('')
 const [query,setQuery]=useState('')
 const [loading,setLoading]=useState(false)
 const [error,setError]=useState('')
 useEffect(()=>{if(!modelId&&models.length)setModelId(models[0].id)},[models,modelId])
 async function load(){
  if(!modelId)return
  setLoading(true);setError('')
  try{
   const {data}=await supabase.auth.getSession()
   const params=new URLSearchParams({modelId,offset:'0'})
   if(type)params.set('type',type)
   if(query.trim())params.set('query',query.trim())
   const response=await fetch('/api/vault?'+params.toString(),{headers:{Authorization:'Bearer '+(data.session?.access_token||'')},cache:'no-store'})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudo cargar el vault.')
   const list=Array.isArray(payload?.data?.list)?payload.data.list:Array.isArray(payload?.data)?payload.data:[]
   setItems(list)
  }catch(e){setError(e instanceof Error?e.message:'Error cargando la biblioteca.');setItems([])}
  finally{setLoading(false)}
 }
 useEffect(()=>{if(modelId)load()},[modelId,type])
 return <div className="vault-workspace">
  <div className="vault-toolbar">
   <div className="field"><label>Modelo</label><select value={modelId} onChange={e=>setModelId(e.target.value)}>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
   <div className="field"><label>Tipo de archivo</label><select value={type} onChange={e=>setType(e.target.value)}><option value="">Todos</option><option value="photo">Fotos</option><option value="video">Videos</option><option value="gif">GIF</option><option value="audio">Audio</option></select></div>
   <div className="field vault-search"><label>Buscar</label><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')load()}} placeholder="Buscar contenido…"/></div>
   <button className="btn-ghost" onClick={load} disabled={loading}>{loading?'Cargando…':'Buscar / actualizar'}</button>
  </div>
  {error&&<div className="notice">{error}</div>}
  {loading&&<div className="empty">Sincronizando el vault de OnlyFans…</div>}
  {!loading&&items.length===0&&!error&&<div className="empty">No se encontraron archivos en el vault de esta cuenta.</div>}
  <div className="vault-grid">
   {items.map(item=>{
    const src=item.files?.preview?.url||item.files?.thumb?.url||item.files?.full?.url
    return <article className="vault-item" key={item.id}>
     {src?<img src={src} alt="Contenido del vault" loading="lazy"/>:<div className="vault-placeholder">{item.type.toUpperCase()}</div>}
     <div className="vault-item-info"><div><strong>{item.type.toUpperCase()}</strong><small>#{item.id} · {item.createdAt?new Date(item.createdAt).toLocaleDateString():'Fecha no disponible'}</small></div><span>{item.counters?.likesCount||0} ♥</span></div>
     {!item.isReady&&<small className="vault-not-ready">Archivo en procesamiento</small>}
    </article>
   })}
  </div>
  <p className="muted">Vista de consulta del contenido guardado en OnlyFans. La carga y el envío de archivos desde MAISON se habilitarán con el flujo de medios autorizado.</p>
 </div>
}
