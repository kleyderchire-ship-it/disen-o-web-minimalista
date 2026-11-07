'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model={id:string;name:string}
type Script={id:string;model_id:string;title:string;body:string;category:string;created_by:string|null}
export default function ScriptsWorkspace({models,supabase,role}:{models:Model[];supabase:SupabaseClient;role:string}){
 const [modelId,setModelId]=useState('')
 const [scripts,setScripts]=useState<Script[]>([])
 const [title,setTitle]=useState('')
 const [body,setBody]=useState('')
 const [category,setCategory]=useState('general')
 const [editing,setEditing]=useState('')
 const [loading,setLoading]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 useEffect(()=>{if(!modelId&&models.length)setModelId(models[0].id)},[models,modelId])
 async function load(){
  if(!modelId)return
  setLoading(true);setError('')
  const {data,error}=await supabase.from('message_scripts').select('id,model_id,title,body,category,created_by').eq('model_id',modelId).order('category').order('title')
  if(error)setError(error.message);else setScripts((data||[]) as Script[])
  setLoading(false)
 }
 useEffect(()=>{if(modelId)load()},[modelId])
 async function save(event:React.FormEvent){
  event.preventDefault()
  if(!modelId||!title.trim()||!body.trim())return
  setError('');setNotice('')
  const {data:user}=await supabase.auth.getUser()
  const values={model_id:modelId,title:title.trim(),body:body.trim(),category,created_by:user.user?.id||null,updated_at:new Date().toISOString()}
  const result=editing
   ? await supabase.from('message_scripts').update(values).eq('id',editing)
   : await supabase.from('message_scripts').insert(values)
  if(result.error){setError(result.error.message);return}
  setNotice(editing?'Guion actualizado.':'Guion guardado.')
  setTitle('');setBody('');setCategory('general');setEditing('')
  await load()
 }
 function edit(script:Script){setEditing(script.id);setTitle(script.title);setBody(script.body);setCategory(script.category)}
 async function remove(script:Script){
  if(!window.confirm('¿Eliminar el guion “'+script.title+'”?'))return
  const {error}=await supabase.from('message_scripts').delete().eq('id',script.id)
  if(error)setError(error.message);else{setNotice('Guion eliminado.');await load()}
 }
 if(!models.length)return <div className="panel empty">Añade un modelo para crear guiones.</div>
 return <div className="scripts-workspace">
  <div className="panel scripts-form">
   <div className="section-head"><div><h2>{editing?'Editar guion':'Crear guion de respuesta'}</h2><p className="page-intro">Respuestas reutilizables para el trabajo diario de los chatters.</p></div></div>
   <form className="form-grid" onSubmit={save}>
    <div className="field"><label>Modelo</label><select value={modelId} onChange={e=>setModelId(e.target.value)}>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
    <div className="field"><label>Categoría</label><select value={category} onChange={e=>setCategory(e.target.value)}>{['general','welcome','sales','ppv','renewal','follow_up','vip','objection'].map(x=><option key={x} value={x}>{x.replace('_',' ')}</option>)}</select></div>
    <div className="field" style={{gridColumn:'1/-1'}}><label>Título</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ej. Bienvenida a nuevo suscriptor"/></div>
    <div className="field" style={{gridColumn:'1/-1'}}><label>Texto del guion</label><textarea rows={4} value={body} onChange={e=>setBody(e.target.value)} placeholder="Escribe la respuesta que se podrá insertar en el chat…"/></div>
    <div className="scripts-form-actions" style={{gridColumn:'1/-1'}}><button type="button" className="btn-ghost" onClick={()=>{setEditing('');setTitle('');setBody('');setCategory('general')}}>Limpiar</button><button className="btn" disabled={!title.trim()||!body.trim()}>{editing?'Guardar cambios':'Guardar guion'}</button></div>
   </form>
  </div>
  <div className="section-head"><h2>Biblioteca de guiones</h2><span className="date-pill">{scripts.length} GUIONES</span></div>
  <div className="scripts-grid">{scripts.map(script=><article className="panel script-card" key={script.id}><div className="script-card-head"><span className="eyebrow">{script.category.replace('_',' ')}</span>{role!=='chatter'&&<div><button className="btn-ghost" onClick={()=>edit(script)}>Editar</button> <button className="btn-ghost" onClick={()=>remove(script)}>Eliminar</button></div>}</div><strong>{script.title}</strong><p>{script.body}</p></article>)}{!loading&&scripts.length===0&&<div className="panel empty">No hay guiones para esta modelo todavía.</div>}</div>
  {error&&<div className="notice inbox-feedback-error">{error}</div>}{notice&&<div className="notice inbox-feedback-ok">{notice}</div>}
 </div>
}
