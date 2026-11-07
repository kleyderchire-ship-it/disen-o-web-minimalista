'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model={id:string;name:string}
type Earnings=Record<string,{total_net?:number;total_gross?:number}|undefined>
type Row={modelId:string;modelName:string;connected:boolean;earnings:Earnings|null;error?:string}
const money=(value:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(value||0)
const dateValue=(d:Date)=>{const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,16)}

export default function FinanceWorkspace({models,supabase}:{models:Model[];supabase:SupabaseClient}){
 const now=new Date()
 const first=new Date(now.getFullYear(),now.getMonth(),1)
 const [start,setStart]=useState(dateValue(first))
 const [end,setEnd]=useState(dateValue(now))
 const [selected,setSelected]=useState('all')
 const [rows,setRows]=useState<Row[]>([])
 const [loading,setLoading]=useState(false)
 const [error,setError]=useState('')
 async function load(){
  setLoading(true);setError('')
  try{
   const {data}=await supabase.auth.getSession()
   const params=new URLSearchParams({startDate:start,endDate:end})
   const response=await fetch('/api/analytics?'+params.toString(),{headers:{Authorization:'Bearer '+(data.session?.access_token||'')},cache:'no-store'})
   const payload=await response.json()
   if(!response.ok)throw new Error(payload.error||'No se pudieron cargar las estadísticas.')
   setRows(Array.isArray(payload?.data)?payload.data:[])
  }catch(e){setError(e instanceof Error?e.message:'Error consultando analíticas.');setRows([])}
  finally{setLoading(false)}
 }
 useEffect(()=>{load()},[])
 const visible=useMemo(()=>selected==='all'?rows:rows.filter(x=>x.modelId===selected),[rows,selected])
 const total=(key:string)=>visible.reduce((sum,row)=>sum+Number(row.earnings?.[key]?.total_net||0),0)
 const gross=(key:string)=>visible.reduce((sum,row)=>sum+Number(row.earnings?.[key]?.total_gross||0),0)
 const categories=[['Ingresos netos','all'],['Suscripciones','subscribes'],['Mensajes PPV','chat_messages'],['Propinas','tips'],['Publicaciones','post']]
 return <div className="finance-workspace">
  <div className="panel finance-filter">
   <div className="field"><label>Modelo</label><select value={selected} onChange={e=>setSelected(e.target.value)}><option value="all">Todas las modelos</option>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
   <div className="field"><label>Desde</label><input type="datetime-local" value={start} onChange={e=>setStart(e.target.value)}/></div>
   <div className="field"><label>Hasta</label><input type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)}/></div>
   <button className="btn" onClick={load} disabled={loading}>{loading?'Consultando…':'Actualizar estadísticas'}</button>
  </div>
  {error&&<div className="notice inbox-feedback-error">{error}</div>}
  <div className="grid finance-kpis">{categories.map(([label,key])=><div className="stat" key={key}><div className="stat-top">{label}<span className="stat-icon">$</span></div><div className="stat-value">{money(total(key))}</div><div className="stat-foot">Bruto: {money(gross(key))}</div></div>)}</div>
  <div className="section-head"><div><h2>Rendimiento por modelo</h2><p className="page-intro">Importes netos y brutos devueltos por OnlyFans mediante Fans API.</p></div></div>
  <div className="panel table-wrap"><table className="data-table"><thead><tr><th>MODELO</th><th>ESTADO</th><th>NETO TOTAL</th><th>SUSCRIPCIONES</th><th>MENSAJES</th><th>PROPINAS</th><th>POSTS</th></tr></thead><tbody>
   {visible.map(row=><tr key={row.modelId}><td>{row.modelName}</td><td><span className={'status '+(!row.connected?'pending':'')}>{row.connected?'Conectada':'Sin conectar'}</span></td><td className="gold">{money(Number(row.earnings?.all?.total_net||0))}</td><td>{money(Number(row.earnings?.subscribes?.total_net||0))}</td><td>{money(Number(row.earnings?.chat_messages?.total_net||0))}</td><td>{money(Number(row.earnings?.tips?.total_net||0))}</td><td>{money(Number(row.earnings?.post?.total_net||0))}</td></tr>)}
   {!loading&&visible.length===0&&<tr><td colSpan={7}><div className="empty">No hay datos disponibles para este periodo.</div></td></tr>}
  </tbody></table></div>
  <p className="muted finance-note">Las estadísticas se consultan directamente desde las cuentas conectadas. Los datos de ventas recibidos por webhook se conservan por separado como historial operativo.</p>
 </div>
}
