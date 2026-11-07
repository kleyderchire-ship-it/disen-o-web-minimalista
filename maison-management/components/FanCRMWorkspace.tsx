'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model={id:string;name:string}
type FanList={id:string|number;name:string;type:string;usersCount?:number;canAddUsers?:boolean}
type Fan={
 id:number|string;name?:string;username?:string;displayName?:string;avatar?:string;avatarThumbs?:{c144?:string};
 subscribedBy?:boolean;subscribedByExpire?:boolean;subscribedByExpireDate?:string;subscribedOn?:boolean;subscribedOnExpiredNow?:boolean;subscribedOnDuration?:string;lastSeen?:string;
 subscribedOnData?:{totalSumm?:number;tipsSumm?:number;subscribesSumm?:number;messagesSumm?:number;postsSumm?:number;streamsSumm?:number};
 isVerified?:boolean;canReceiveChatMessage?:boolean;
}
const usd=(v:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(v||0)

export default function FanCRMWorkspace({models,supabase,role}:{models:Model[];supabase:SupabaseClient;role:string}){
 const [modelId,setModelId]=useState('')
 const [fans,setFans]=useState<Fan[]>([])
 const [type,setType]=useState('all')
 const [online,setOnline]=useState('')
 const [query,setQuery]=useState('')
 const [minSpend,setMinSpend]=useState('')
 const [offset,setOffset]=useState(0)
 const [hasMore,setHasMore]=useState(false)
 const [loading,setLoading]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const [lists,setLists]=useState<FanList[]>([])
 const [selectedList,setSelectedList]=useState('')
 const [newTag,setNewTag]=useState('')
 const [selectedFanIds,setSelectedFanIds]=useState<string[]>([])
 const [tagBusy,setTagBusy]=useState(false)
 useEffect(()=>{if(!modelId&&models.length)setModelId(models[0].id)},[models,modelId])
 async function loadTags(){
  if(!modelId)return
  try{
   const {data}=await supabase.auth.getSession()
   const response=await fetch('/api/fans/lists?modelId='+encodeURIComponent(modelId),{headers:{Authorization:'Bearer '+(data.session?.access_token||'')},cache:'no-store'})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudieron cargar las etiquetas.')
   const rows:FanList[]=Array.isArray(payload?.data)?payload.data:[]
   setLists(rows)
   setSelectedList(current=>current||String(rows.find(x=>x.type==='custom')?.id||''))
  }catch(e){setError(e instanceof Error?e.message:'No se pudieron cargar las etiquetas.')}
 }
 useEffect(()=>{if(modelId){setSelectedList('');setSelectedFanIds([]);loadTags()}},[modelId])
 async function createTag(){
  if(role==='chatter'||!newTag.trim())return
  setTagBusy(true);setError('')
  try{
   const {data}=await supabase.auth.getSession()
   const response=await fetch('/api/fans/lists',{method:'POST',headers:{Authorization:'Bearer '+(data.session?.access_token||''),'Content-Type':'application/json'},body:JSON.stringify({modelId,name:newTag.trim()})})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudo crear la etiqueta.')
   setNewTag('');setError('');setNotice('Etiqueta creada en OnlyFans.')
   if(payload?.data?.id!==undefined)setSelectedList(String(payload.data.id))
   await loadTags()
  }catch(e){setError(e instanceof Error?e.message:'No se pudo crear la etiqueta.');setNotice('')}
  finally{setTagBusy(false)}
 }
 async function tagSelected(){
  if(!selectedList||!selectedFanIds.length)return
  const list=lists.find(x=>String(x.id)===selectedList)
  if(!window.confirm('Vas a agregar '+selectedFanIds.length+' fan(s) a la etiqueta '+(list?.name||selectedList)+' en OnlyFans. ¿Confirmas?'))return
  setTagBusy(true);setError('')
  try{
   const {data}=await supabase.auth.getSession()
   const response=await fetch('/api/fans/lists/'+encodeURIComponent(selectedList)+'/users',{method:'POST',headers:{Authorization:'Bearer '+(data.session?.access_token||''),'Content-Type':'application/json'},body:JSON.stringify({modelId,ids:selectedFanIds})})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudieron asignar las etiquetas.')
   const addedCount=selectedFanIds.length
   setSelectedFanIds([])
   setError('');setNotice('Se agregaron '+addedCount+' fan(s) a la etiqueta.')
   await loadTags()
  }catch(e){setError(e instanceof Error?e.message:'No se pudo asignar la etiqueta.');setNotice('')}
  finally{setTagBusy(false)}
 }
 async function load(nextOffset=0){
  if(!modelId)return
  setLoading(true);setError('')
  try{
   const {data}=await supabase.auth.getSession()
   const params=new URLSearchParams({modelId,type,limit:'20',offset:String(nextOffset)})
   if(query.trim())params.set('query',query.trim())
   if(online)params.set('online',online)
   if(minSpend)params.set('total_spent',minSpend)
   const response=await fetch('/api/fans?'+params.toString(),{headers:{Authorization:'Bearer '+(data.session?.access_token||'')},cache:'no-store'})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudo cargar el CRM.')
   const dataList=payload?.data?.list||[]
   setFans(dataList)
   setOffset(nextOffset)
   setHasMore(Boolean(payload?.data?.hasMore))
  }catch(e){setError(e instanceof Error?e.message:'Error consultando fans.');setFans([])}
  finally{setLoading(false)}
 }
 useEffect(()=>{if(modelId)load(0)},[modelId,type,online])
 const totalSpend=(fan:Fan)=>Number(fan.subscribedOnData?.totalSumm||0)
 return <div className="fan-crm-workspace">
  <div className="panel fan-crm-filter">
   <div className="field"><label>Modelo</label><select value={modelId} onChange={e=>setModelId(e.target.value)}>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
   <div className="field"><label>Suscripción</label><select value={type} onChange={e=>setType(e.target.value)}><option value="all">Todos los fans</option><option value="active">Activos</option><option value="expired">Expirados</option></select></div>
   <div className="field"><label>Actividad</label><select value={online} onChange={e=>setOnline(e.target.value)}><option value="">Cualquier estado</option><option value="1">En línea</option><option value="0">Desconectados</option></select></div>
   <div className="field"><label>Gasto mínimo (USD)</label><input type="number" min="0" value={minSpend} onChange={e=>setMinSpend(e.target.value)} placeholder="0"/></div>
   <div className="field fan-crm-search"><label>Buscar fan</label><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')load(0)}} placeholder="Nombre o usuario…"/></div>
   <button className="btn" onClick={()=>load(0)} disabled={loading}>{loading?'Buscando…':'Buscar fans'}</button>
  </div>
  <div className="panel fan-tag-toolbar">{role!=='chatter'&&<><div className="field"><label>Crear etiqueta personalizada</label><input value={newTag} onChange={e=>setNewTag(e.target.value)} placeholder="Ej. VIP, Compradores frecuentes…"/></div><button className="btn-ghost" onClick={createTag} disabled={tagBusy||!newTag.trim()}>Crear etiqueta</button></>}<div className="field"><label>Etiqueta de destino</label><select value={selectedList} onChange={e=>setSelectedList(e.target.value)}><option value="">Selecciona etiqueta</option>{lists.filter(x=>x.type==='custom').map(x=><option key={String(x.id)} value={String(x.id)}>{x.name} ({x.usersCount||0})</option>)}</select></div><button className="btn" onClick={tagSelected} disabled={tagBusy||!selectedList||!selectedFanIds.length}>Agregar {selectedFanIds.length||''} seleccionados</button></div>
  {error&&<div className="notice inbox-feedback-error">{error}</div>}{notice&&<div className="notice inbox-feedback-ok">{notice}</div>}
  <div className="section-head"><div><h2>Directorio de fans en vivo</h2><p className="page-intro">Datos de suscripción, gasto acumulado y actividad desde OnlyFans.</p></div><span className="date-pill">{fans.length} EN ESTA PÁGINA</span></div>
  <div className="panel table-wrap"><table className="data-table"><thead><tr><th>SELECCIONAR</th><th>FAN</th><th>ESTADO</th><th>GASTO TOTAL</th><th>PROPINAS</th><th>MENSAJES</th><th>DURACIÓN</th><th>ÚLTIMA VEZ</th></tr></thead><tbody>
   {fans.map(fan=>{const active=Boolean(fan.subscribedOn&&!fan.subscribedOnExpiredNow);return <tr key={String(fan.id)}><td><input type="checkbox" checked={selectedFanIds.includes(String(fan.id))} onChange={e=>setSelectedFanIds(current=>e.target.checked?[...current,String(fan.id)]:current.filter(id=>id!==String(fan.id)))}/></td><td><div className="model-cell">{fan.avatarThumbs?.c144||fan.avatar?<img className="model-avatar fan-avatar-img" src={fan.avatarThumbs?.c144||fan.avatar} alt=""/>:<span className="model-avatar">{(fan.username||fan.name||'?').slice(0,1).toUpperCase()}</span>}<div><strong>{fan.displayName||fan.name||fan.username||'Fan'}</strong><small className="muted">@{fan.username||fan.id}</small></div></div></td><td><span className={'status '+(!active?'pending':'')}>{active?'Activa':'Expirada / no activa'}</span></td><td className="gold">{usd(totalSpend(fan))}</td><td>{usd(Number(fan.subscribedOnData?.tipsSumm||0))}</td><td>{usd(Number(fan.subscribedOnData?.messagesSumm||0))}</td><td>{fan.subscribedOnDuration||'—'}</td><td>{fan.lastSeen?new Date(fan.lastSeen).toLocaleDateString():'—'}</td></tr>})}
   {!loading&&fans.length===0&&<tr><td colSpan={8}><div className="empty">No hay fans para estos filtros o la cuenta todavía no está conectada.</div></td></tr>}
  </tbody></table></div>
  <div className="fan-crm-pagination"><button className="btn-ghost" onClick={()=>load(Math.max(0,offset-20))} disabled={loading||offset===0}>Anterior</button><span className="muted">Página {Math.floor(offset/20)+1}</span><button className="btn-ghost" onClick={()=>load(offset+20)} disabled={loading||!hasMore}>Siguiente</button></div>
 </div>
}
