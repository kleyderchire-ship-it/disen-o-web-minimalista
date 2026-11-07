'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model={id:string;name:string}
type Profile={id:string;full_name:string}
type Task={id:string;model_id:string;assigned_to:string;title:string;description:string|null;due_at:string|null;status:string;created_at:string;completed_at:string|null}
const statusLabel:Record<string,string>={todo:'Pendiente',in_progress:'En progreso',done:'Completada',cancelled:'Cancelada'}
const localInput=(d:Date)=>{const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,16)}

export default function ContentTasksWorkspace({models,supabase,role}:{models:Model[];supabase:SupabaseClient;role:string}){
 const manager=role==='admin'||role==='supervisor'
 const [modelId,setModelId]=useState('')
 const [tasks,setTasks]=useState<Task[]>([])
 const [chatters,setChatters]=useState<Profile[]>([])
 const [assignedTo,setAssignedTo]=useState('')
 const [title,setTitle]=useState('')
 const [description,setDescription]=useState('')
 const [dueAt,setDueAt]=useState('')
 const [filter,setFilter]=useState('all')
 const [loading,setLoading]=useState(false)
 const [busy,setBusy]=useState('')
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 async function load(){
  if(!modelId)return
  setLoading(true);setError('')
  try{
   const {data,error}=await supabase.from('content_tasks').select('id,model_id,assigned_to,title,description,due_at,status,created_at,completed_at').eq('model_id',modelId).order('due_at',{ascending:true,nullsFirst:false}).limit(100)
   if(error)throw error
   setTasks((data||[]) as Task[])
   if(manager){
    const {data:assignments,error:assignmentError}=await supabase.from('model_assignments').select('user_id').eq('model_id',modelId)
    if(assignmentError)throw assignmentError
    const ids=(assignments||[]).map(x=>x.user_id)
    if(ids.length){
     const {data:people,error:peopleError}=await supabase.from('profiles').select('id,full_name').in('id',ids).eq('role','chatter').eq('active',true)
     if(peopleError)throw peopleError
     setChatters((people||[]) as Profile[])
     if(!assignedTo&&people?.length)setAssignedTo(people[0].id)
    }else setChatters([])
   }
  }catch(e){setError(e instanceof Error?e.message:'No se pudieron cargar las tareas.')}
  finally{setLoading(false)}
 }
 useEffect(()=>{if(!modelId&&models.length)setModelId(models[0].id)},[models,modelId])
 useEffect(()=>{if(modelId){setAssignedTo('');load()}},[modelId])
 async function createTask(event:React.FormEvent){
  event.preventDefault()
  if(!modelId||!assignedTo||title.trim().length<2)return
  setBusy('create');setError('');setNotice('')
  const {data:user}=await supabase.auth.getUser()
  const {error}=await supabase.from('content_tasks').insert({
   model_id:modelId,assigned_to:assignedTo,title:title.trim(),description:description.trim()||null,
   due_at:dueAt?new Date(dueAt).toISOString():null,created_by:user.user?.id
  })
  if(error)setError(error.message);else{setNotice('Tarea asignada.');setTitle('');setDescription('');setDueAt('');await load()}
  setBusy('')
 }
 async function changeStatus(task:Task,next:string){
  if(next==='done'&&!window.confirm('¿Marcar esta tarea como completada?'))return
  setBusy(task.id);setError('');setNotice('')
  const {error}=await supabase.rpc('update_content_task_status',{p_task_id:task.id,p_status:next})
  if(error)setError(error.message);else{setNotice('Estado actualizado.');await load()}
  setBusy('')
 }
 async function remove(task:Task){
  if(!window.confirm('¿Eliminar la tarea “'+task.title+'”?'))return
  setBusy(task.id);setError('');setNotice('')
  const {error}=await supabase.from('content_tasks').delete().eq('id',task.id)
  if(error)setError(error.message);else{setNotice('Tarea eliminada.');await load()}
  setBusy('')
 }
 const visible=useMemo(()=>filter==='all'?tasks:tasks.filter(t=>t.status===filter),[tasks,filter])
 const modelName=(id:string)=>models.find(m=>m.id===id)?.name||'Modelo'
 const chatterName=(id:string)=>chatters.find(p=>p.id===id)?.full_name||(id?'Chatter asignado':'—')
 return <div className="content-tasks-workspace">
  {manager&&<div className="panel content-task-form"><div className="section-head"><div><h2>Asignar tarea de contenido</h2><p className="page-intro">Entrega tareas concretas a chatters que ya tengan asignada esta modelo.</p></div></div><form className="form-grid" onSubmit={createTask}>
   <div className="field"><label>Modelo</label><select value={modelId} onChange={e=>setModelId(e.target.value)}>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
   <div className="field"><label>Chatter asignado</label><select value={assignedTo} onChange={e=>setAssignedTo(e.target.value)}><option value="">Selecciona chatter</option>{chatters.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
   <div className="field" style={{gridColumn:'1/-1'}}><label>Tarea</label><input value={title} onChange={e=>setTitle(e.target.value)} maxLength={120} placeholder="Ej. Preparar 5 fotos para la historia de mañana"/></div>
   <div className="field" style={{gridColumn:'1/-1'}}><label>Instrucciones</label><textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Detalles, referencias y entregables…"/></div>
   <div className="field"><label>Fecha límite</label><input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}/></div>
   <div className="field task-create-action"><label>Acción</label><button className="btn" disabled={busy==='create'||!assignedTo||title.trim().length<2}>{busy==='create'?'Asignando…':'Asignar tarea'}</button></div>
  </form></div>}
  <div className="section-head"><div><h2>{manager?'Tareas del equipo':'Mis tareas de contenido'}</h2><p className="page-intro">Seguimiento de entregables y fechas por modelo.</p></div><div className="task-filter"><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todas</option><option value="todo">Pendientes</option><option value="in_progress">En progreso</option><option value="done">Completadas</option></select><button className="btn-ghost" onClick={load} disabled={loading}>{loading?'Actualizando…':'↻'}</button></div></div>
  <div className="content-task-list">{visible.map(task=>{const overdue=task.due_at&&new Date(task.due_at).getTime()<Date.now()&&task.status!=='done';return <article className="panel content-task-card" key={task.id}><div className="content-task-main"><div><span className="eyebrow">{modelName(task.model_id)}{manager?' · '+chatterName(task.assigned_to):''}</span><strong>{task.title}</strong>{task.description&&<p>{task.description}</p>}{task.due_at&&<small className={overdue?'task-overdue':''}>Fecha límite: {new Date(task.due_at).toLocaleString()}</small>}</div><span className={'status '+(task.status==='done'?'':'pending')}>{statusLabel[task.status]||task.status}</span></div><div className="content-task-actions">{task.status==='todo'&&<button className="btn-ghost" onClick={()=>changeStatus(task,'in_progress')} disabled={busy===task.id}>Iniciar</button>}{task.status==='in_progress'&&<button className="btn" onClick={()=>changeStatus(task,'done')} disabled={busy===task.id}>Completar</button>}{task.status==='done'&&<button className="btn-ghost" onClick={()=>changeStatus(task,'in_progress')} disabled={busy===task.id}>Reabrir</button>}{manager&&<button className="btn-ghost" onClick={()=>remove(task)} disabled={busy===task.id}>Eliminar</button>}</div></article>})}{!loading&&visible.length===0&&<div className="panel empty">No hay tareas para este filtro.</div>}</div>
  {error&&<div className="notice inbox-feedback-error">{error}</div>}{notice&&<div className="notice inbox-feedback-ok">{notice}</div>}
 </div>
}
