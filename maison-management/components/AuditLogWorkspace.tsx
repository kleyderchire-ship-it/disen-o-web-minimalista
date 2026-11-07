'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model={id:string;name:string}
type AuditRow={id:number;actor_id:string|null;model_id:string|null;action:string;entity_type:string;entity_id:string|null;details:Record<string,unknown>;created_at:string}
type Profile={id:string;full_name:string}
export default function AuditLogWorkspace({models,supabase}:{models:Model[];supabase:SupabaseClient}){
 const [rows,setRows]=useState<AuditRow[]>([])
 const [profiles,setProfiles]=useState<Profile[]>([])
 const [modelFilter,setModelFilter]=useState('all')
 const [actionFilter,setActionFilter]=useState('all')
 const [loading,setLoading]=useState(false)
 const [error,setError]=useState('')
 async function load(){
  setLoading(true);setError('')
  try{
   const [audit,people]=await Promise.all([
    supabase.from('audit_logs').select('id,actor_id,model_id,action,entity_type,entity_id,details,created_at').order('created_at',{ascending:false}).limit(150),
    supabase.from('profiles').select('id,full_name').order('full_name')
   ])
   if(audit.error)throw audit.error
   if(people.error)throw people.error
   setRows((audit.data||[]) as AuditRow[])
   setProfiles((people.data||[]) as Profile[])
  }catch(e){setError(e instanceof Error?e.message:'No se pudo cargar el registro de actividad.')}
  finally{setLoading(false)}
 }
 useEffect(()=>{load()},[])
 const visible=useMemo(()=>rows.filter(row=>(modelFilter==='all'||row.model_id===modelFilter)&&(actionFilter==='all'||row.action===actionFilter)),[rows,modelFilter,actionFilter])
 const person=(id:string|null)=>profiles.find(x=>x.id===id)?.full_name||'Sistema / proveedor'
 const model=(id:string|null)=>models.find(x=>x.id===id)?.name||'—'
 const fields=(row:AuditRow)=>Array.isArray(row.details?.changed_fields)?(row.details.changed_fields as string[]).slice(0,6).join(', '):'—'
 return <div className="audit-workspace">
  <div className="panel audit-filters"><div className="field"><label>Modelo</label><select value={modelFilter} onChange={e=>setModelFilter(e.target.value)}><option value="all">Todas las modelos</option>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div><div className="field"><label>Acción</label><select value={actionFilter} onChange={e=>setActionFilter(e.target.value)}><option value="all">Todas</option><option value="insert">Creación</option><option value="update">Modificación</option><option value="delete">Eliminación</option></select></div><button className="btn-ghost" onClick={load} disabled={loading}>{loading?'Actualizando…':'↻ Actualizar'}</button><span className="date-pill">{visible.length} EVENTOS</span></div>
  {error&&<div className="notice inbox-feedback-error">{error}</div>}
  <div className="panel table-wrap"><table className="data-table"><thead><tr><th>FECHA</th><th>USUARIO</th><th>ACCIÓN</th><th>RECURSO</th><th>MODELO</th><th>CAMPOS</th></tr></thead><tbody>
   {visible.map(row=><tr key={row.id}><td>{new Date(row.created_at).toLocaleString()}</td><td>{person(row.actor_id)}</td><td><span className={'status '+(row.action==='delete'?'pending':'')}>{row.action==='insert'?'Creación':row.action==='update'?'Modificación':'Eliminación'}</span></td><td>{row.entity_type} · {row.entity_id||'—'}</td><td>{model(row.model_id)}</td><td className="audit-fields">{fields(row)}</td></tr>)}
   {!loading&&visible.length===0&&<tr><td colSpan={6}><div className="empty">No hay actividad registrada para estos filtros.</div></td></tr>}
  </tbody></table></div>
  <p className="muted audit-note">El registro conserva acciones sensibles y cambios de asignación. Los mensajes individuales no se copian al historial de auditoría.</p>
 </div>
}
