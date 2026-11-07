'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model={id:string;name:string}
type Profile={id:string;full_name:string;role:string}
type Shift={id:string;model_id:string;user_id:string;starts_at:string;ends_at:string;status:string;notes:string|null}
type Entry={id:string;shift_id:string;model_id:string;user_id:string;clock_in_at:string;clock_out_at:string|null}
const localDate=(d:Date)=>{const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,16)}
const duration=(start:string,end:string|null)=>{const ms=(new Date(end||Date.now()).getTime()-new Date(start).getTime());const h=Math.floor(ms/3600000);const m=Math.floor(ms%3600000/60000);return h+'h '+m+'m'}

export default function ShiftWorkspace({models,supabase,role}:{models:Model[];supabase:SupabaseClient;role:string}){
 const [profiles,setProfiles]=useState<Profile[]>([])
 const [shifts,setShifts]=useState<Shift[]>([])
 const [entries,setEntries]=useState<Entry[]>([])
 const [modelId,setModelId]=useState('')
 const [userId,setUserId]=useState('')
 const [currentUserId,setCurrentUserId]=useState('')
 const [start,setStart]=useState(localDate(new Date(Date.now()+3600000)))
 const [end,setEnd]=useState(localDate(new Date(Date.now()+5*3600000)))
 const [notes,setNotes]=useState('')
 const [loading,setLoading]=useState(false)
 const [busy,setBusy]=useState('')
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const manager=role==='admin'||role==='supervisor'
 async function load(){
  setLoading(true);setError('')
  try{
   const [p,s,e,u]=await Promise.all([
    supabase.from('profiles').select('id,full_name,role').eq('active',true),
    supabase.from('team_shifts').select('id,model_id,user_id,starts_at,ends_at,status,notes').order('starts_at',{ascending:false}).limit(100),
    supabase.from('team_time_entries').select('id,shift_id,model_id,user_id,clock_in_at,clock_out_at').order('clock_in_at',{ascending:false}).limit(100),
    supabase.auth.getUser(),
   ])
   if(p.error)throw p.error;if(s.error)throw s.error;if(e.error)throw e.error
   setProfiles((p.data||[]) as Profile[]);setShifts((s.data||[]) as Shift[]);setEntries((e.data||[]) as Entry[])
   setCurrentUserId(u.data.user?.id||'')
   if(!modelId&&models.length)setModelId(models[0].id)
   if(!userId&&p.data?.length)setUserId(manager?((p.data.find((x:any)=>x.role==='chatter')?.id)||''):(u.data.user?.id||''))
  }catch(e){setError(e instanceof Error?e.message:'No se pudo cargar el calendario de turnos.')}
  finally{setLoading(false)}
 }
 useEffect(()=>{load()},[])
 async function createShift(event:React.FormEvent){
  event.preventDefault()
  const a=new Date(start),b=new Date(end)
  if(!modelId||!userId||!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime())||b<=a){setError('Revisa el modelo, el chatter y las horas del turno.');return}
  setBusy('create');setError('');setNotice('')
  const {data}=await supabase.auth.getUser()
  const {error}=await supabase.from('team_shifts').insert({model_id:modelId,user_id:userId,starts_at:a.toISOString(),ends_at:b.toISOString(),notes:notes.trim()||null,created_by:data.user?.id||null})
  if(error)setError(error.message);else{setNotice('Turno programado.');setNotes('');await load()}
  setBusy('')
 }
 async function clockIn(shift:Shift){
  setBusy(shift.id);setError('');setNotice('')
  const {error}=await supabase.from('team_time_entries').insert({shift_id:shift.id,model_id:shift.model_id,user_id:currentUserId})
  if(error)setError(error.message);else{setNotice('Turno iniciado.');await load()}
  setBusy('')
 }
 async function clockOut(entry:Entry){
  setBusy(entry.id);setError('');setNotice('')
  const {error}=await supabase.from('team_time_entries').update({clock_out_at:new Date().toISOString()}).eq('id',entry.id)
  if(error)setError(error.message);else{setNotice('Turno finalizado.');await load()}
  setBusy('')
 }
 const person=(id:string)=>profiles.find(p=>p.id===id)?.full_name||'Miembro'
 const model=(id:string)=>models.find(m=>m.id===id)?.name||'Modelo'
 return <div className="shift-workspace">
  {manager&&<div className="panel shift-schedule-form"><div className="section-head"><div><h2>Programar turno</h2><p className="page-intro">Asigna un chatter a una modelo y define su horario.</p></div></div><form className="form-grid" onSubmit={createShift}>
   <div className="field"><label>Modelo</label><select value={modelId} onChange={e=>setModelId(e.target.value)}>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
   <div className="field"><label>Chatter</label><select value={userId} onChange={e=>setUserId(e.target.value)}>{profiles.filter(p=>p.role==='chatter').map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
   <div className="field"><label>Inicio</label><input type="datetime-local" value={start} onChange={e=>setStart(e.target.value)}/></div>
   <div className="field"><label>Fin</label><input type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)}/></div>
   <div className="field" style={{gridColumn:'1/-1'}}><label>Notas del turno</label><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Instrucciones o modelo prioritario…"/></div>
   <div style={{gridColumn:'1/-1',display:'flex',justifyContent:'flex-end'}}><button className="btn" disabled={busy==='create'}>{busy==='create'?'Guardando…':'Programar turno'}</button></div>
  </form></div>}
  <div className="section-head"><div><h2>{manager?'Calendario del equipo':'Mis turnos'}</h2><p className="page-intro">Control de horario, entrada y salida de cada turno.</p></div><button className="btn-ghost" onClick={load} disabled={loading}>{loading?'Actualizando…':'↻ Actualizar'}</button></div>
  <div className="shift-list">{shifts.map(shift=>{const entry=entries.find(e=>e.shift_id===shift.id);const mine=shift.user_id===currentUserId;return <article className="panel shift-card" key={shift.id}><div className="shift-card-main"><div><span className="eyebrow">{model(shift.model_id)}</span><strong>{manager?person(shift.user_id):'Turno asignado'}</strong><small>{new Date(shift.starts_at).toLocaleString()} — {new Date(shift.ends_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small>{shift.notes&&<p>{shift.notes}</p>}</div><div className="shift-status"><span className={'status '+(entry?.clock_out_at?'':'pending')}>{entry?.clock_out_at?'Completado':entry?'En curso':'Programado'}</span>{entry&&<small>{duration(entry.clock_in_at,entry.clock_out_at)}</small>}</div></div>{!manager&&mine&&!entry&&<button className="btn" onClick={()=>clockIn(shift)} disabled={busy===shift.id}>Iniciar turno</button>}{!manager&&mine&&entry&&!entry.clock_out_at&&<button className="btn" onClick={()=>clockOut(entry)} disabled={busy===entry.id}>Finalizar turno</button>}</article>})}{!loading&&shifts.length===0&&<div className="panel empty">No hay turnos programados.</div>}</div>
  {error&&<div className="notice inbox-feedback-error">{error}</div>}{notice&&<div className="notice inbox-feedback-ok">{notice}</div>}
 </div>
}
