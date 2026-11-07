'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import InboxWorkspace from '@/components/InboxWorkspace'
import AccountConnectPanel from '@/components/AccountConnectPanel'
import VaultWorkspace from '@/components/VaultWorkspace'
import MassCampaignWorkspace from '@/components/MassCampaignWorkspace'
import PublisherWorkspace from '@/components/PublisherWorkspace'
import FinanceWorkspace from '@/components/FinanceWorkspace'
import FanCRMWorkspace from '@/components/FanCRMWorkspace'
import TeamWorkspace from '@/components/TeamWorkspace'
import ScriptsWorkspace from '@/components/ScriptsWorkspace'
import ShiftWorkspace from '@/components/ShiftWorkspace'

type Model = { id:string; name:string; handle:string; status:string; revenue:number; chatter:string }
type Sale = { id:string; model:string; type:string; amount:number; chatter:string; date:string }
type FanEntry = { id:string; model:string; count:number; source:string; chatter:string; date:string }
type FanProfile = { id:string; model:string; username:string; displayName:string; status:string; date:string }
type ContentEntry = { id:string; model:string; kind:string; caption:string; status:string; chatter:string; date:string }

const initialModels:Model[]=[]
const initialSales:Sale[]=[]
const navItems=[['overview','◫','Resumen'],['inbox','✉','Mensajes'],['campaigns','◈','Campañas'],['scripts','▤','Guiones'],['shifts','◷','Turnos'],['models','♙','Modelos'],['audience','♧','Fans'],['content','▣','Publicaciones'],['team','♧','Equipo'],['sales','↗','Ventas'],['finance','＄','Finanzas'],['library','▧','Biblioteca']]
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n)

export default function Home(){
 const [supabase]=useState<SupabaseClient|null>(()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return url&&key?createClient(url,key):null})
 const [authLoading,setAuthLoading]=useState(true)
 const [authUser,setAuthUser]=useState<User|null>(null)
 const [authProfile,setAuthProfile]=useState<{full_name:string;role:'admin'|'supervisor'|'chatter';active:boolean}|null>(null)
 const [authMode,setAuthMode]=useState<'login'|'signup'>('login')
 const [authEmail,setAuthEmail]=useState('')
 const [authPassword,setAuthPassword]=useState('')
 const [authError,setAuthError]=useState('')
 const [authNotice,setAuthNotice]=useState('')
 const [authBusy,setAuthBusy]=useState(false)
 const [section,setSection]=useState('overview')
 const role=authProfile?.role||'chatter'
 const roleNames={admin:'Administrador',supervisor:'Supervisor',chatter:'Chatter'}
 const allowedSections=role==='admin'?['overview','inbox','campaigns','scripts','shifts','models','audience','content','team','sales','finance','library']:role==='supervisor'?['overview','inbox','campaigns','scripts','shifts','models','audience','content','team','sales','library']:['overview','inbox','campaigns','scripts','shifts','models','audience','content','sales']
 const visibleNavItems=navItems.filter(([key])=>allowedSections.includes(key))
 const [models,setModels]=useState(initialModels)
 const [sales,setSales]=useState(initialSales)
 const [fanEntries,setFanEntries]=useState<FanEntry[]>([])
 const [fans,setFans]=useState<FanProfile[]>([])
 const [contentEntries,setContentEntries]=useState<ContentEntry[]>([])
 const [dataLoading,setDataLoading]=useState(false)
 const [dataError,setDataError]=useState('')
 const [showModel,setShowModel]=useState(false)
 const [showSale,setShowSale]=useState(false)
 const [search,setSearch]=useState('')
 const [modelName,setModelName]=useState('')
 const [handle,setHandle]=useState('')
 const [chatter,setChatter]=useState('')
 const [saleModel,setSaleModel]=useState('')
 const [saleType,setSaleType]=useState('Propina')
 const [saleAmount,setSaleAmount]=useState('')
 const [saleChatter,setSaleChatter]=useState('')
 const [fanModel,setFanModel]=useState('')
 const [postModel,setPostModel]=useState('')
 const [postKind,setPostKind]=useState('Historia')
 const [postCaption,setPostCaption]=useState('')
 const [postStatus,setPostStatus]=useState('Publicado')
 const [postChatter,setPostChatter]=useState('')
 const total=sales.reduce((a,s)=>a+s.amount,0)
 const filtered=useMemo(()=>models.filter(m=>(m.name+' '+m.handle).toLowerCase().includes(search.toLowerCase())),[models,search])
 const title=navItems.find(n=>n[0]===section)?.[2]||'Resumen'
 useEffect(()=>{
  if(!supabase){setAuthLoading(false);return}
  supabase.auth.getSession().then(({data})=>{setAuthUser(data.session?.user||null);setAuthLoading(false)})
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setAuthUser(session?.user||null))
  return ()=>subscription.unsubscribe()
 },[supabase])
 useEffect(()=>{
  if(!supabase||!authUser){setAuthProfile(null);return}
  let alive=true
  supabase.from('profiles').select('full_name,role,active').eq('id',authUser.id).single().then(({data,error})=>{
   if(!alive)return
   if(error){setDataError('No se pudo cargar tu perfil: '+error.message);return}
   setAuthProfile(data)
  })
  return ()=>{alive=false}
 },[supabase,authUser])
 useEffect(()=>{
  if(!supabase||!authUser||!authProfile?.active)return
  let alive=true;setDataLoading(true);setDataError('')
  Promise.all([
   supabase.from('models').select('id,display_name,onlyfans_username,active').order('created_at',{ascending:false}),
   supabase.from('sales').select('id,model_id,sale_type,amount,chatter_id,occurred_at,models(display_name)').order('occurred_at',{ascending:false}),
   supabase.from('fan_events').select('id,model_id,quantity,source,event_type,chatter_id,occurred_at,models(display_name)').order('occurred_at',{ascending:false}),
   supabase.from('fans').select('id,model_id,provider_fan_id,username,display_name,subscription_status,first_seen_at,models(display_name)').order('first_seen_at',{ascending:false}),
   supabase.from('publications').select('id,model_id,content_type,caption,status,created_at,models(display_name)').order('created_at',{ascending:false})
   ]).then(([mr,sr,fr,fanr,pr])=>{
   if(!alive)return
   const err=[mr.error,sr.error,fr.error,fanr.error,pr.error].find(Boolean);if(err)setDataError(err.message)
   const ms=(mr.data||[]).map((m:any)=>({id:m.id,name:m.display_name,handle:m.onlyfans_username||'Sin usuario',status:m.active?'Activa':'Inactiva',revenue:0,chatter:'Sin asignar'}))
   setModels(ms);if(ms[0]){setSaleModel(ms[0].name);setFanModel(ms[0].name);setPostModel(ms[0].name)}
   setSales((sr.data||[]).map((x:any)=>({id:x.id,model:x.models?.display_name||'Modelo',type:x.sale_type,amount:Number(x.amount),chatter:x.chatter_id===authUser.id?(authProfile.full_name||authUser.email||'Yo'):'Equipo',date:new Date(x.occurred_at).toLocaleDateString()})))
   setFanEntries((fr.data||[]).map((x:any)=>({id:x.id,model:x.models?.display_name||'Modelo',count:x.quantity,source:x.event_type==='subscriptions.new'?'Nuevo suscriptor':x.event_type==='subscriptions.renewed'?'Renovación':'Suscripción vencida',chatter:'Fans API',date:new Date(x.occurred_at).toLocaleDateString()})))
   setFans((fanr.data||[]).map((x:any)=>({id:x.id,model:x.models?.display_name||'Modelo',username:x.username||x.provider_fan_id,displayName:x.display_name||x.username||x.provider_fan_id,status:x.subscription_status==='active'?'Activa':x.subscription_status==='expired'?'Vencida':'Desconocida',date:new Date(x.first_seen_at).toLocaleDateString()})))
   setContentEntries((pr.data||[]).map((x:any)=>({id:x.id,model:x.models?.display_name||'Modelo',kind:x.content_type==='story'?'Historia':x.content_type==='photo'?'Foto':x.content_type==='video'?'Video':'Publicación normal',caption:x.caption,status:x.status==='published'?'Publicado':x.status==='scheduled'?'Programado':'Pendiente',chatter:'Equipo',date:new Date(x.created_at).toLocaleDateString()})))
  }).finally(()=>{if(alive)setDataLoading(false)})
  return ()=>{alive=false}
 },[supabase,authUser,authProfile])
 async function handleAuth(e:React.FormEvent){
  e.preventDefault();if(!supabase)return
  setAuthBusy(true);setAuthError('');setAuthNotice('')
  const result=authMode==='signup'
   ?await supabase.auth.signUp({email:authEmail,password:authPassword,options:{emailRedirectTo:window.location.origin}})
   :await supabase.auth.signInWithPassword({email:authEmail,password:authPassword})
  setAuthBusy(false)
  if(result.error){setAuthError(result.error.message);return}
  if(authMode==='signup'&&!result.data.session)setAuthNotice('Cuenta creada. Revisa tu correo para confirmar el registro y luego inicia sesión.')
 }
 async function signOut(){await supabase?.auth.signOut();setAuthProfile(null);setModels([]);setSales([]);setFanEntries([]);setContentEntries([])}
 async function bootstrapAdmin(){if(!supabase)return;const {error}=await supabase.rpc('bootstrap_first_admin');if(error){setDataError(error.message);return}const {data}=await supabase.from('profiles').select('full_name,role,active').eq('id',authUser?.id).single();if(data)setAuthProfile(data)}

 async function addModel(e:React.FormEvent){e.preventDefault();if(!supabase||!modelName.trim())return;const {data,error}=await supabase.from('models').insert({display_name:modelName.trim(),onlyfans_username:handle.trim()||null,created_by:authUser?.id}).select().single();if(error){setDataError(error.message);return}setModels(v=>[{id:data.id,name:data.display_name,handle:data.onlyfans_username||'Sin usuario',status:'Activa',revenue:0,chatter:'Sin asignar'},...v]);setModelName('');setHandle('');setChatter('');setShowModel(false)}
 async function addSale(e:React.FormEvent){e.preventDefault();const amount=Number(saleAmount),model=models.find(m=>m.name===saleModel);if(!supabase||!model||!amount||amount<=0)return;const {data,error}=await supabase.from('sales').insert({model_id:model.id,sale_type:saleType,amount,currency:'USD',chatter_id:authUser?.id}).select('id,occurred_at').single();if(error){setDataError(error.message);return}setSales(v=>[{id:data.id,model:saleModel,type:saleType,amount,chatter:authProfile?.full_name||authUser?.email||'Yo',date:new Date(data.occurred_at).toLocaleDateString()},...v]);setSaleAmount('');setSaleChatter('');setShowSale(false)}
 async function addContent(e:React.FormEvent){e.preventDefault();const model=models.find(m=>m.name===postModel);if(!supabase||!model)return;const content_type=postKind==='Historia'?'story':postKind==='Foto'?'photo':postKind==='Video'?'video':'post';const {data,error}=await supabase.from('publications').insert({model_id:model.id,created_by:authUser?.id,content_type,caption:postCaption,status:'draft'}).select('id,created_at').single();if(error){setDataError(error.message);return}setContentEntries(v=>[{id:data.id,model:postModel,kind:postKind,caption:postCaption,status:'Pendiente',chatter:authProfile?.full_name||authUser?.email||'Yo',date:new Date(data.created_at).toLocaleDateString()},...v]);setPostCaption('');setPostChatter('')}
 if(authLoading)return <div className="shell" style={{minHeight:'100vh',display:'grid',placeItems:'center',color:'#fff'}}>Cargando MAISON MANAGEMENT…</div>
 if(!supabase)return <div className="shell" style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,color:'#fff'}}><div className="panel" style={{maxWidth:520,padding:32}}><h1>MAISON MANAGEMENT</h1><p>Faltan las variables de conexión de Supabase. Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel y vuelve a desplegar.</p></div></div>
 if(!authUser)return <div className="shell" style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,color:'#fff'}}><form onSubmit={handleAuth} className="panel" style={{width:'100%',maxWidth:430,padding:32,display:'grid',gap:16}}><div className="brand-mark">MAISON</div><div className="brand-sub">MANAGEMENT · AGENCY OS</div><h1>{authMode==='login'?'Iniciar sesión':'Crear cuenta'}</h1><p className="muted">Acceso privado al espacio de trabajo de tu agencia.</p><label>Correo electrónico<input type="email" required value={authEmail} onChange={e=>setAuthEmail(e.target.value)}/></label><label>Contraseña<input type="password" minLength={8} required value={authPassword} onChange={e=>setAuthPassword(e.target.value)}/></label>{authError&&<p style={{color:'#ff9b9b'}}>{authError}</p>}{authNotice&&<p style={{color:'#9fe3b0'}}>{authNotice}</p>}<button className="btn" disabled={authBusy}>{authBusy?'Procesando…':authMode==='login'?'Entrar':'Crear cuenta'}</button><button type="button" className="btn-ghost" onClick={()=>{setAuthMode(authMode==='login'?'signup':'login');setAuthError('');setAuthNotice('')}}>{authMode==='login'?'Crear una cuenta nueva':'Ya tengo cuenta'}</button></form></div>
 if(!authProfile)return <div className="shell" style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,color:'#fff'}}><div className="panel" style={{maxWidth:520,padding:32}}><h1>Configurar acceso</h1><p>Si esta es la primera cuenta de MAISON MANAGEMENT, puedes reclamar el rol de administrador inicial. Esta acción solo funciona una vez y se bloquea cuando ya existe un administrador.</p>{dataError&&<p style={{color:'#ff9b9b'}}>{dataError}</p>}<button className="btn" onClick={bootstrapAdmin}>Configurar primer administrador</button><button className="btn-ghost" onClick={signOut}>Cerrar sesión</button></div></div>
 if(!authProfile.active)return <div className="shell" style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,color:'#fff'}}><div className="panel" style={{maxWidth:520,padding:32}}><h1>Acceso suspendido</h1><p>Tu usuario está desactivado. Contacta al administrador.</p><button className="btn" onClick={signOut}>Cerrar sesión</button></div></div>
 return <div className="shell">
  <aside className="sidebar">
   <div className="brand"><div className="brand-mark">MAISON</div><div className="brand-sub">MANAGEMENT · AGENCY OS</div></div>
   <div className="nav-label">WORKSPACE</div>
   {visibleNavItems.map(([key,icon,label])=><button key={key} className={'nav '+(section===key?'active':'')} onClick={()=>{setSection(key);setSearch('')}}><span className="nav-icon">{icon}</span><span>{label}</span></button>)}
   {role==='admin'&&<><div className="nav-label">SISTEMA</div><button className="nav" onClick={()=>alert('La configuración real se habilitará al conectar la autenticación.')}><span className="nav-icon">⚙</span><span>Configuración</span></button></>}
   <div className="sidebar-bottom"><div className="profile"><div className="avatar">MM</div><div><strong>{roleNames[role]}</strong><small>MAISON MANAGEMENT</small></div></div></div>
  </aside>
  <main className="main">
   <header className="topbar"><div><div className="eyebrow">MAISON MANAGEMENT / {title}</div><h1 className="page-title">{section==='overview'?'Panel de control':title}</h1></div><div className="top-actions"><span className="date-pill">{roleNames[role]}</span><span className="date-pill">CUENTA CONECTADA</span><button className="btn-ghost" onClick={signOut}>Cerrar sesión</button></div></header>
   <div className="notice"><strong>Sesión segura.</strong> Tus permisos proceden de tu perfil autenticado y la base de datos aplica restricciones por modelo. {dataLoading?"Sincronizando datos…":"Datos guardados en Supabase."}</div>{dataError&&<div className="notice" style={{borderColor:"#a94442"}}>{dataError}</div>}
   {section==='overview'&&<><div className="grid">
    <div className="stat"><div className="stat-top">Ingresos registrados <span className="stat-icon">$</span></div><div className="stat-value">{money(total)}</div><div className="stat-foot">Ventas guardadas en Supabase</div></div>
    <div className="stat"><div className="stat-top">Modelos activos <span className="stat-icon">♙</span></div><div className="stat-value">{models.filter(m=>m.status==='Activa').length}</div><div className="stat-foot">Perfiles en gestión</div></div>
    <div className="stat"><div className="stat-top">Ventas registradas <span className="stat-icon">↗</span></div><div className="stat-value">{sales.length}</div><div className="stat-foot">Operaciones ingresadas manualmente</div></div>
    <div className="stat"><div className="stat-top">Equipo asignado <span className="stat-icon">♧</span></div><div className="stat-value">{new Set(models.map(m=>m.chatter).filter(x=>x!=='Sin asignar')).size}</div><div className="stat-foot">Grupos con asignaciones</div></div>
   </div>
   <div className="section-head"><h2>Rendimiento de la agencia</h2><span className="muted">Vista ilustrativa · últimos 7 meses</span></div>
   <div className="two-col"><section className="panel"><h3 className="panel-title">Ingresos mensuales</h3><div className="muted">Gráfica de ejemplo, no representa ingresos reales</div><div className="chart-wrap">{[38,52,45,67,58,82,72].map((v,i)=><div className="bar-col" key={i}><div className="bar" style={{height:v+'%'}}/><span className="bar-label">{['MAY','JUN','JUL','AGO','SEP','OCT','NOV'][i]}</span></div>)}</div><div className="legend"><span>Actividad ilustrativa</span><span className="gold">USD</span></div></section>
    <section className="panel"><h3 className="panel-title">Actividad reciente</h3><div className="muted">Últimos movimientos registrados</div><div className="activity">{sales.slice(0,4).map(s=><div className="activity-row" key={s.id}><span className="activity-dot"/><div><strong>{s.type} · {money(s.amount)}</strong><small>{s.model} · {s.chatter}</small></div><time>{s.date}</time></div>)}</div></section></div>
   <div className="section-head"><h2>Modelos destacados</h2><button className="btn-ghost" onClick={()=>setSection('models')}>Ver todos →</button></div><ModelTable models={models.slice(0,3)}/>
   </>}
   {section==='models'&&<><div className="section-head"><div><h2>Directorio de modelos</h2><p className="page-intro">Perfiles, estado operativo y responsable asignado.</p></div><button className="btn" onClick={()=>setShowModel(true)}>+ Añadir modelo</button></div><div className="toolbar" style={{marginBottom:14}}><input className="search" placeholder="Buscar modelo o usuario..." value={search} onChange={e=>setSearch(e.target.value)}/></div>{supabase&&<AccountConnectPanel models={models} supabase={supabase} role={role}/>}<div className="section-head"><h2>Modelos registrados</h2></div><ModelTable models={filtered}/></>}
   {section==='team'&&<><div className="section-head"><div><h2>Equipo y permisos</h2><p className="page-intro">Invitaciones, roles y asignación de modelos con control de acceso.</p></div></div>{supabase&&<TeamWorkspace models={models} supabase={supabase} role={role}/>}</>}
   {section==='inbox'&&<><div className="section-head"><div><h2>Centro de mensajes</h2><p className="page-intro">Bandeja de conversaciones, filtros y respuestas conectadas a OnlyFans.</p></div><span className="date-pill">INBOX MULTICUENTA</span></div>{supabase&&<InboxWorkspace models={models} supabase={supabase}/>}</>}
   {section==='campaigns'&&<><div className="section-head"><div><h2>Campañas inteligentes</h2><p className="page-intro">Segmenta, programa y envía mensajes a las listas de fans de cada modelo.</p></div></div>{supabase&&<MassCampaignWorkspace models={models} supabase={supabase}/>}</>}
   {section==='scripts'&&<><div className="section-head"><div><h2>Biblioteca de guiones</h2><p className="page-intro">Respuestas guardadas por modelo para agilizar las conversaciones.</p></div></div>{supabase&&<ScriptsWorkspace models={models} supabase={supabase} role={role}/>}</>}
   {section==='shifts'&&<><div className="section-head"><div><h2>Turnos y productividad</h2><p className="page-intro">Planificación del equipo y registro de horas de trabajo.</p></div></div>{supabase&&<ShiftWorkspace models={models} supabase={supabase} role={role}/>}</>}
   {section==='sales'&&<><div className="section-head"><div><h2>Registro de ventas</h2><p className="page-intro">Captura manual de operaciones de OnlyFans.</p></div><button className="btn" onClick={()=>setShowSale(true)}>+ Registrar venta</button></div><div className="grid"><div className="stat"><div className="stat-top">Total registrado <span className="stat-icon">$</span></div><div className="stat-value">{money(total)}</div><div className="stat-foot">Datos persistentes</div></div><div className="stat"><div className="stat-top">Operaciones <span className="stat-icon">↗</span></div><div className="stat-value">{sales.length}</div><div className="stat-foot">Registros guardados</div></div></div><div className="section-head"><h2>Movimientos</h2></div><div className="panel table-wrap"><table className="data-table"><thead><tr><th>MODELO</th><th>TIPO</th><th>CHATTER</th><th>FECHA</th><th>IMPORTE</th></tr></thead><tbody>{sales.map(s=><tr key={s.id}><td>{s.model}</td><td>{s.type}</td><td>{s.chatter}</td><td>{s.date}</td><td className="gold">{money(s.amount)}</td></tr>)}</tbody></table></div></>}
   {section==='audience'&&<><div className="section-head"><div><h2>Fans y suscriptores</h2><p className="page-intro">Directorio en vivo de fans, suscripciones, gasto y actividad de las cuentas conectadas.</p></div><span className="date-pill">CRM ONLYFANS</span></div>{supabase&&<FanCRMWorkspace models={models} supabase={supabase}/>}<div className="grid"><div className="stat"><div className="stat-top">Fans detectados <span className="stat-icon">♧</span></div><div className="stat-value">{fans.length}</div><div className="stat-foot">Perfiles únicos recibidos por webhook</div></div><div className="stat"><div className="stat-top">Suscripciones activas <span className="stat-icon">✓</span></div><div className="stat-value">{fans.filter(x=>x.status==='Activa').length}</div><div className="stat-foot">Según el último evento recibido</div></div><div className="stat"><div className="stat-top">Nuevos suscriptores <span className="stat-icon">＋</span></div><div className="stat-value">{fanEntries.filter(x=>x.source==='Nuevo suscriptor').length}</div><div className="stat-foot">Eventos de nuevas suscripciones</div></div><div className="stat"><div className="stat-top">Renovaciones <span className="stat-icon">↻</span></div><div className="stat-value">{fanEntries.filter(x=>x.source==='Renovación').length}</div><div className="stat-foot">Renovaciones recibidas</div></div></div><div className="section-head"><h2>Directorio automático de fans</h2></div><div className="panel table-wrap"><table className="data-table"><thead><tr><th>MODELO</th><th>USUARIO</th><th>NOMBRE</th><th>ESTADO DE SUSCRIPCIÓN</th><th>PRIMER REGISTRO</th></tr></thead><tbody>{fans.length?fans.map(x=><tr key={x.id}><td>{x.model}</td><td>{x.username}</td><td>{x.displayName}</td><td><span className={'status '+(x.status!=='Activa'?'pending':'')}>{x.status}</span></td><td>{x.date}</td></tr>):<tr><td colSpan={5}><div className="empty">Todavía no llegan eventos. Cuando conectemos una cuenta de modelo y activemos los webhooks, los nuevos suscriptores aparecerán aquí automáticamente.</div></td></tr>}</tbody></table></div><div className="section-head"><h2>Actividad de suscripciones</h2></div><div className="panel table-wrap"><table className="data-table"><thead><tr><th>MODELO</th><th>EVENTO</th><th>FECHA</th><th>ORIGEN</th></tr></thead><tbody>{fanEntries.length?fanEntries.map(x=><tr key={x.id}><td>{x.model}</td><td>{x.source}</td><td>{x.date}</td><td>Fans API</td></tr>):<tr><td colSpan={4}><div className="empty">Sin actividad de suscripciones recibida.</div></td></tr>}</tbody></table></div></>}
   {section==='content'&&<><div className="section-head"><div><h2>Historias y publicaciones</h2><p className="page-intro">Planifica, programa y publica contenido directamente en cada cuenta de OnlyFans.</p></div></div>{supabase&&<PublisherWorkspace models={models} supabase={supabase}/>}<div className="grid"><div className="stat"><div className="stat-top">Publicaciones registradas <span className="stat-icon">▣</span></div><div className="stat-value">{contentEntries.length}</div><div className="stat-foot">Actividad de contenido en esta sesión</div></div><div className="stat"><div className="stat-top">Publicadas <span className="stat-icon">✓</span></div><div className="stat-value">{contentEntries.filter(x=>x.status==='Publicado').length}</div><div className="stat-foot">Marcadas como publicadas</div></div><div className="stat"><div className="stat-top">Programadas / pendientes <span className="stat-icon">◷</span></div><div className="stat-value">{contentEntries.filter(x=>x.status!=='Publicado').length}</div><div className="stat-foot">Requieren acción manual</div></div><div className="stat"><div className="stat-top">Historias <span className="stat-icon">◉</span></div><div className="stat-value">{contentEntries.filter(x=>x.kind==='Historia').length}</div><div className="stat-foot">Historias registradas</div></div></div><div className="panel" style={{marginTop:16}}><h3 className="panel-title">Registrar contenido</h3><form onSubmit={addContent} className="form-grid" style={{marginTop:14}}><div className="field"><label>Modelo</label><select value={postModel} onChange={e=>setPostModel(e.target.value)}>{models.map(m=><option key={m.id}>{m.name}</option>)}</select></div><div className="field"><label>Tipo de contenido</label><select value={postKind} onChange={e=>setPostKind(e.target.value)}>{['Historia','Publicación normal','Foto','Video','Mensaje masivo','Otro'].map(x=><option key={x}>{x}</option>)}</select></div><div className="field"><label>Estado</label><select value={postStatus} onChange={e=>setPostStatus(e.target.value)}>{['Publicado','Programado','Pendiente'].map(x=><option key={x}>{x}</option>)}</select></div><div className="field"><label>Chatter responsable</label><input value={postChatter} onChange={e=>setPostChatter(e.target.value)} placeholder="Nombre del chatter"/></div><div className="field" style={{gridColumn:'1/-1'}}><label>Descripción / nota (opcional)</label><input value={postCaption} onChange={e=>setPostCaption(e.target.value)} placeholder="Ej. Historia de bienvenida, publicación del día..."/></div><div style={{gridColumn:'1/-1',display:'flex',justifyContent:'flex-end'}}><button className="btn">Guardar actividad</button></div></form><p className="muted" style={{marginTop:12}}>Este registro no publica directamente en OnlyFans. El chatter realiza la publicación en la plataforma y luego la registra aquí.</p></div><div className="section-head"><h2>Calendario de actividad (registro)</h2></div><div className="panel table-wrap"><table className="data-table"><thead><tr><th>MODELO</th><th>TIPO</th><th>DESCRIPCIÓN</th><th>RESPONSABLE</th><th>ESTADO</th><th>FECHA</th></tr></thead><tbody>{contentEntries.length?contentEntries.map(x=><tr key={x.id}><td>{x.model}</td><td>{x.kind}</td><td>{x.caption||'—'}</td><td>{x.chatter}</td><td><span className={'status '+(x.status!=='Publicado'?'pending':'')}>{x.status}</span></td><td>{x.date}</td></tr>):<tr><td colSpan={6}><div className="empty">Todavía no hay historias ni publicaciones registradas.</div></td></tr>}</tbody></table></div></>}
   {section==='finance'&&<><div className="section-head"><div><h2>Centro financiero</h2><p className="page-intro">Resumen de ingresos, ventas netas y rendimiento por modelo.</p></div></div>{supabase&&<FinanceWorkspace models={models} supabase={supabase}/>}<div className="grid"><div className="stat"><div className="stat-top">Ventas registradas <span className="stat-icon">$</span></div><div className="stat-value">{money(total)}</div><div className="stat-foot">Importe bruto de esta sesión</div></div><div className="stat"><div className="stat-top">Gastos <span className="stat-icon">−</span></div><div className="stat-value">$0</div><div className="stat-foot">Aún no configurados</div></div><div className="stat"><div className="stat-top">Comisiones <span className="stat-icon">％</span></div><div className="stat-value">—</div><div className="stat-foot">Pendiente de definir porcentajes</div></div><div className="stat"><div className="stat-top">Neto calculado <span className="stat-icon">＝</span></div><div className="stat-value">—</div><div className="stat-foot">Se habilitará con reglas financieras</div></div></div><div className="section-head"><h2>Próximos componentes</h2></div><div className="cards-3">{[['Comisiones','Por modelo, chatter y agencia.'],['Gastos','Costos fijos y variables.'],['Liquidaciones','Cortes por periodo y reportes.']].map(x=><div className="mini-card" key={x[0]}><span className="eyebrow">MÓDULO FINANCIERO</span><strong>{x[0]}</strong><span>{x[1]}</span></div>)}</div></>}
   {section==='library'&&<><div className="section-head"><div><h2>Biblioteca de contenido</h2><p className="page-intro">Vault sincronizado con la cuenta de OnlyFans de cada modelo.</p></div><span className="date-pill">ONLYFANS VAULT</span></div>{supabase&&<VaultWorkspace models={models} supabase={supabase}/>}</>}
  </main>
  {showModel&&<div className="modal-backdrop" onClick={()=>setShowModel(false)}><form className="modal" onSubmit={addModel} onClick={e=>e.stopPropagation()}><div className="modal-head"><h3>Nuevo modelo</h3><button type="button" className="btn-ghost" onClick={()=>setShowModel(false)}>Cerrar</button></div><div className="form-grid"><div className="field"><label>Nombre o código interno</label><input required value={modelName} onChange={e=>setModelName(e.target.value)} placeholder="Nombre del modelo"/></div><div className="field"><label>Usuario de OnlyFans</label><input value={handle} onChange={e=>setHandle(e.target.value)} placeholder="@usuario"/></div><div className="field" style={{gridColumn:'1/-1'}}><label>Responsable / equipo</label><input value={chatter} onChange={e=>setChatter(e.target.value)} placeholder="Equipo A, chatter..."/></div></div><div className="modal-actions"><button type="button" className="btn-ghost" onClick={()=>setShowModel(false)}>Cancelar</button><button className="btn">Guardar modelo</button></div></form></div>}
  {showSale&&<div className="modal-backdrop" onClick={()=>setShowSale(false)}><form className="modal" onSubmit={addSale} onClick={e=>e.stopPropagation()}><div className="modal-head"><h3>Registrar venta</h3><button type="button" className="btn-ghost" onClick={()=>setShowSale(false)}>Cerrar</button></div><div className="form-grid"><div className="field" style={{gridColumn:'1/-1'}}><label>Modelo</label><select value={saleModel} onChange={e=>setSaleModel(e.target.value)}>{models.map(m=><option key={m.id}>{m.name}</option>)}</select></div><div className="field"><label>Tipo de venta</label><select value={saleType} onChange={e=>setSaleType(e.target.value)}>{['Propina','Mensaje PPV','Contenido','Suscripción','Otro'].map(x=><option key={x}>{x}</option>)}</select></div><div className="field"><label>Importe en USD</label><input type="number" min="0.01" step="0.01" required value={saleAmount} onChange={e=>setSaleAmount(e.target.value)} placeholder="0.00"/></div><div className="field" style={{gridColumn:'1/-1'}}><label>Chatter responsable</label><input value={saleChatter} onChange={e=>setSaleChatter(e.target.value)} placeholder="Nombre del chatter"/></div></div><div className="modal-actions"><button type="button" className="btn-ghost" onClick={()=>setShowSale(false)}>Cancelar</button><button className="btn">Guardar venta</button></div></form></div>}
 </div>
}

function ModelTable({models}:{models:Model[]}){return <div className="panel table-wrap"><table className="data-table"><thead><tr><th>MODELO</th><th>USUARIO</th><th>ESTADO</th><th>RESPONSABLE</th><th>INGRESOS</th></tr></thead><tbody>{models.length?models.map(m=><tr key={m.id}><td><div className="model-cell"><span className="model-avatar">{m.name.slice(0,1).toUpperCase()}</span><strong>{m.name}</strong></div></td><td>{m.handle}</td><td><span className={'status '+(m.status!=='Activa'?'pending':'')}>{m.status}</span></td><td>{m.chatter}</td><td className="gold">{money(m.revenue)}</td></tr>):<tr><td colSpan={5}><div className="empty">No hay modelos que coincidan con la búsqueda.</div></td></tr>}</tbody></table></div>}
