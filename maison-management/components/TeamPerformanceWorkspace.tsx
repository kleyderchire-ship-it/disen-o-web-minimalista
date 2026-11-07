'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model={id:string;name:string}
type Person={id:string;full_name:string}
type Sale={chatter_id:string|null;model_id:string;amount:number;currency:string;sale_type:string;occurred_at:string}
type Entry={user_id:string;model_id:string;clock_in_at:string;clock_out_at:string|null}
const usd=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n||0)
const inputDate=(d:Date)=>{const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,16)}

export default function TeamPerformanceWorkspace({models,supabase}:{models:Model[];supabase:SupabaseClient}){
 const now=new Date()
 const [start,setStart]=useState(inputDate(new Date(now.getFullYear(),now.getMonth(),1)))
 const [end,setEnd]=useState(inputDate(now))
 const [modelFilter,setModelFilter]=useState('all')
 const [people,setPeople]=useState<Person[]>([])
 const [sales,setSales]=useState<Sale[]>([])
 const [entries,setEntries]=useState<Entry[]>([])
 const [loading,setLoading]=useState(false)
 const [error,setError]=useState('')
 async function load(){
  setLoading(true);setError('')
  try{
   const from=new Date(start).toISOString(),to=new Date(end).toISOString()
   if(new Date(to)<=new Date(from))throw new Error('El rango de fechas no es válido.')
   let salesQuery=supabase.from('sales').select('chatter_id,model_id,amount,currency,sale_type,occurred_at').gte('occurred_at',from).lte('occurred_at',to).eq('currency','USD')
   let shiftsQuery=supabase.from('team_time_entries').select('user_id,model_id,clock_in_at,clock_out_at').gte('clock_in_at',from).lte('clock_in_at',to)
   if(modelFilter!=='all'){salesQuery=salesQuery.eq('model_id',modelFilter);shiftsQuery=shiftsQuery.eq('model_id',modelFilter)}
   const [s,t,p]=await Promise.all([
    salesQuery.order('occurred_at',{ascending:false}).limit(5000),
    shiftsQuery.order('clock_in_at',{ascending:false}).limit(5000),
    supabase.from('profiles').select('id,full_name').eq('role','chatter').eq('active',true).order('full_name')
   ])
   if(s.error)throw s.error;if(t.error)throw t.error;if(p.error)throw p.error
   setSales((s.data||[]) as Sale[]);setEntries((t.data||[]) as Entry[]);setPeople((p.data||[]) as Person[])
  }catch(e){setError(e instanceof Error?e.message:'No se pudo cargar el rendimiento.')}
  finally{setLoading(false)}
 }
 useEffect(()=>{load()},[])
 const rows=useMemo(()=>people.map(person=>{
  const ownSales=sales.filter(s=>s.chatter_id===person.id)
  const ownEntries=entries.filter(e=>e.user_id===person.id)
  const revenue=ownSales.reduce((sum,s)=>sum+Number(s.amount||0),0)
  const hours=ownEntries.reduce((sum,e)=>sum+Math.max(0,(new Date(e.clock_out_at||Date.now()).getTime()-new Date(e.clock_in_at).getTime())/3600000),0)
  return {id:person.id,name:person.full_name,revenue,count:ownSales.length,average:ownSales.length?revenue/ownSales.length:0,hours}
 }).sort((a,b)=>b.revenue-a.revenue),[people,sales,entries])
 const attributed=sales.filter(s=>s.chatter_id).reduce((sum,s)=>sum+Number(s.amount||0),0)
 const unattributed=sales.filter(s=>!s.chatter_id).reduce((sum,s)=>sum+Number(s.amount||0),0)
 const totalHours=entries.reduce((sum,e)=>sum+Math.max(0,(new Date(e.clock_out_at||Date.now()).getTime()-new Date(e.clock_in_at).getTime())/3600000),0)
 return <div className="team-performance-workspace">
  <div className="panel performance-filter"><div className="field"><label>Modelo</label><select value={modelFilter} onChange={e=>setModelFilter(e.target.value)}><option value="all">Todas</option>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div><div className="field"><label>Desde</label><input type="datetime-local" value={start} onChange={e=>setStart(e.target.value)}/></div><div className="field"><label>Hasta</label><input type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)}/></div><button className="btn" onClick={load} disabled={loading}>{loading?'Consultando…':'Actualizar'}</button></div>
  {error&&<div className="notice inbox-feedback-error">{error}</div>}
  <div className="grid performance-kpis"><div className="stat"><div className="stat-top">Ventas atribuidas <span className="stat-icon">$</span></div><div className="stat-value">{usd(attributed)}</div><div className="stat-foot">Registros con chatter identificado</div></div><div className="stat"><div className="stat-top">Ventas sin atribuir <span className="stat-icon">↗</span></div><div className="stat-value">{usd(unattributed)}</div><div className="stat-foot">Incluye transacciones automáticas del proveedor</div></div><div className="stat"><div className="stat-top">Horas registradas <span className="stat-icon">◷</span></div><div className="stat-value">{totalHours.toFixed(1)} h</div><div className="stat-foot">Turnos iniciados en el periodo</div></div></div>
  <div className="section-head"><div><h2>Rendimiento por chatter</h2><p className="page-intro">Ventas manuales atribuidas y tiempo de turno registrado.</p></div></div>
  <div className="panel table-wrap"><table className="data-table"><thead><tr><th>CHATTER</th><th>VENTAS USD</th><th>OPERACIONES</th><th>VENTA PROMEDIO</th><th>HORAS</th></tr></thead><tbody>{rows.map((row,i)=><tr key={row.id}><td><strong>{i+1}. {row.name}</strong></td><td className="gold">{usd(row.revenue)}</td><td>{row.count}</td><td>{usd(row.average)}</td><td>{row.hours.toFixed(1)} h</td></tr>)}{!loading&&rows.length===0&&<tr><td colSpan={5}><div className="empty">No hay chatters activos.</div></td></tr>}</tbody></table></div>
  <p className="muted performance-note">Las ventas que llegan por webhook sin identificar al chatter aparecen como “sin atribuir”. No se asignan automáticamente a la persona que tenga el fan abierto para evitar métricas incorrectas.</p>
 </div>
}
