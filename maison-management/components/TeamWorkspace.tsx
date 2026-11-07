'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model={id:string;name:string}
type Profile={id:string;full_name:string;role:'admin'|'supervisor'|'chatter';active:boolean}
type Assignment={id:string;user_id:string;model_id:string}
export default function TeamWorkspace({models,supabase,role}:{models:Model[];supabase:SupabaseClient;role:string}){
 const [profiles,setProfiles]=useState<Profile[]>([])
 const [assignments,setAssignments]=useState<Assignment[]>([])
 const [selectedUser,setSelectedUser]=useState('')
 const [selectedModel,setSelectedModel]=useState('')
 const [inviteName,setInviteName]=useState('')
 const [inviteEmail,setInviteEmail]=useState('')
 const [inviteRole,setInviteRole]=useState<'supervisor'|'chatter'>('chatter')
 const [currentUserId,setCurrentUserId]=useState('')
 const [loading,setLoading]=useState(false)
 const [busy,setBusy]=useState('')
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 async function load(){
  setLoading(true);setError('')
  try{
   const [p,a,u]=await Promise.all([
    supabase.from('profiles').select('id,full_name,role,active').order('created_at',{ascending:true}),
    supabase.from('model_assignments').select('id,user_id,model_id'),
    supabase.auth.getUser(),
   ])
   if(p.error)throw p.error
   if(a.error)throw a.error
   setProfiles((p.data||[]) as Profile[])
   setAssignments((a.data||[]) as Assignment[])
   setCurrentUserId(u.data.user?.id||'')
   if(!selectedUser&&p.data?.length)setSelectedUser(p.data[0].id)
   if(!selectedModel&&models.length)setSelectedModel(models[0].id)
  }catch(e){setError(e instanceof Error?e.message:'No se pudo cargar el equipo.')}
  finally{setLoading(false)}
 }
 useEffect(()=>{load()},[])
 useEffect(()=>{if(!selectedModel&&models.length)setSelectedModel(models[0].id)},[models,selectedModel])
 async function invite(){
  setBusy('invite');setError('');setNotice('')
  try{
   const {data,error}=await supabase.functions.invoke('invite-team-member',{body:{email:inviteEmail.trim(),fullName:inviteName.trim(),role:inviteRole}})
   if(error)throw error
   if(data?.error)throw new Error(data.error)
   setNotice(data?.warning||'Invitación enviada a '+inviteEmail+'. El usuario recibirá un correo para activar su acceso.')
   setInviteName('');setInviteEmail('');setInviteRole('chatter')
   await load()
  }catch(e){setError(e instanceof Error?e.message:'No se pudo enviar la invitación.')}
  finally{setBusy('')}
 }
 async function changeRole(profile:Profile,next:Profile['role']){
  if(profile.id===currentUserId&&next!=='admin'){setError('No puedes quitarte el rol de administrador desde tu propia sesión.');return}
  setBusy(profile.id);setError('');setNotice('')
  const {error}=await supabase.from('profiles').update({role:next,updated_at:new Date().toISOString()}).eq('id',profile.id)
  if(error)setError(error.message);else{setNotice('Rol actualizado.');await load()}
  setBusy('')
 }
 async function toggleActive(profile:Profile){
  if(profile.id===currentUserId&&!profile.active){setError('No puedes desactivar tu propia cuenta.');return}
  setBusy(profile.id);setError('');setNotice('')
  const {error}=await supabase.from('profiles').update({active:!profile.active,updated_at:new Date().toISOString()}).eq('id',profile.id)
  if(error)setError(error.message);else{setNotice(profile.active?'Usuario desactivado.':'Usuario activado.');await load()}
  setBusy('')
 }
 async function assign(){
  if(!selectedUser||!selectedModel)return
  setBusy('assignment');setError('');setNotice('')
  const {data:user}=await supabase.auth.getUser()
  const {error}=await supabase.from('model_assignments').insert({user_id:selectedUser,model_id:selectedModel,assigned_by:user.user?.id||null})
  if(error)setError(error.message);else{setNotice('Modelo asignado al miembro del equipo.');await load()}
  setBusy('')
 }
 async function removeAssignment(id:string){
  setBusy(id);setError('');setNotice('')
  const {error}=await supabase.from('model_assignments').delete().eq('id',id)
  if(error)setError(error.message);else{setNotice('Asignación retirada.');await load()}
  setBusy('')
 }
 const modelName=(id:string)=>models.find(m=>m.id===id)?.name||'Modelo'
 const personName=(id:string)=>profiles.find(p=>p.id===id)?.full_name||'Miembro'
 return <div className="team-workspace">
  {role==='admin'&&<div className="panel team-invite">
   <div className="section-head"><div><h2>Invitar miembro</h2><p className="page-intro">El acceso se activa mediante un enlace enviado al correo del integrante.</p></div><span className="date-pill">ADMINISTRADOR</span></div>
   <div className="form-grid"><div className="field"><label>Nombre completo</label><input value={inviteName} onChange={e=>setInviteName(e.target.value)} placeholder="Nombre del miembro"/></div><div className="field"><label>Correo electrónico</label><input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="correo@dominio.com"/></div><div className="field"><label>Rol inicial</label><select value={inviteRole} onChange={e=>setInviteRole(e.target.value as 'supervisor'|'chatter')}><option value="chatter">Chatter</option><option value="supervisor">Supervisor</option></select></div><div className="field team-invite-button"><label>Acción</label><button className="btn" onClick={invite} disabled={busy==='invite'||!inviteName.trim()||!inviteEmail.trim()}>{busy==='invite'?'Enviando…':'Enviar invitación'}</button></div></div>
  </div>}
  <div className="section-head"><div><h2>Miembros del equipo</h2><p className="page-intro">Roles, estado de acceso y control de permisos.</p></div><button className="btn-ghost" onClick={load} disabled={loading}>{loading?'Actualizando…':'↻ Actualizar'}</button></div>
  <div className="panel table-wrap"><table className="data-table"><thead><tr><th>MIEMBRO</th><th>ROL</th><th>ESTADO</th><th>PERMISOS</th></tr></thead><tbody>
   {profiles.map(profile=><tr key={profile.id}><td><strong>{profile.full_name}</strong>{profile.id===currentUserId?<small className="muted"> · Tú</small>:null}</td><td>{role==='admin'?<select className="team-role-select" value={profile.role} onChange={e=>changeRole(profile,e.target.value as Profile['role'])} disabled={busy===profile.id}><option value="admin">Administrador</option><option value="supervisor">Supervisor</option><option value="chatter">Chatter</option></select>:profile.role}</td><td><span className={'status '+(!profile.active?'pending':'')}>{profile.active?'Activo':'Inactivo'}</span></td><td>{role==='admin'?<button className="btn-ghost" onClick={()=>toggleActive(profile)} disabled={busy===profile.id}>{profile.active?'Desactivar':'Activar'}</button>:'—'}</td></tr>)}
   {!profiles.length&&<tr><td colSpan={4}><div className="empty">Todavía no hay miembros registrados.</div></td></tr>}
  </tbody></table></div>
  <div className="section-head"><div><h2>Asignación de modelos</h2><p className="page-intro">Los chatters solo ven las modelos que tienen asignadas.</p></div></div>
  <div className="panel team-assignment">
   <div className="team-assignment-form"><div className="field"><label>Miembro</label><select value={selectedUser} onChange={e=>setSelectedUser(e.target.value)}>{profiles.map(p=><option key={p.id} value={p.id}>{p.full_name} · {p.role}</option>)}</select></div><div className="field"><label>Modelo</label><select value={selectedModel} onChange={e=>setSelectedModel(e.target.value)}>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div><button className="btn" onClick={assign} disabled={busy==='assignment'||!selectedUser||!selectedModel||role==='chatter'}>Asignar modelo</button></div>
   <div className="team-assignment-list">{assignments.map(a=><div className="team-assignment-row" key={a.id}><span><strong>{personName(a.user_id)}</strong><small>{modelName(a.model_id)}</small></span>{role!=='chatter'&&<button className="btn-ghost" onClick={()=>removeAssignment(a.id)} disabled={busy===a.id}>Quitar</button>}</div>)}{assignments.length===0&&<div className="empty">No hay asignaciones todavía.</div>}</div>
  </div>
  {error&&<div className="notice inbox-feedback-error">{error}</div>}{notice&&<div className="notice inbox-feedback-ok">{notice}</div>}
 </div>
}
