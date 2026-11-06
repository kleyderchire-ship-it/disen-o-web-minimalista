'use client'

import { useMemo, useState } from 'react'

type Model = { id:number; name:string; handle:string; status:string; revenue:number; chatter:string }
type Sale = { id:number; model:string; type:string; amount:number; chatter:string; date:string }

const initialModels:Model[]=[
 {id:1,name:'Modelo de ejemplo 01',handle:'@modelo01',status:'Activa',revenue:4280,chatter:'Equipo A'},
 {id:2,name:'Modelo de ejemplo 02',handle:'@modelo02',status:'Activa',revenue:3150,chatter:'Equipo B'},
 {id:3,name:'Modelo de ejemplo 03',handle:'@modelo03',status:'En incorporación',revenue:0,chatter:'Sin asignar'},
]
const initialSales:Sale[]=[
 {id:1,model:'Modelo de ejemplo 01',type:'Propina',amount:120,chatter:'Chatter A',date:'Hoy'},
 {id:2,model:'Modelo de ejemplo 02',type:'Mensaje PPV',amount:85,chatter:'Chatter B',date:'Hoy'},
 {id:3,model:'Modelo de ejemplo 01',type:'Contenido',amount:65,chatter:'Chatter A',date:'Ayer'},
]
const navItems=[['overview','◫','Resumen'],['models','♙','Modelos'],['team','♧','Equipo'],['sales','↗','Ventas'],['finance','＄','Finanzas'],['library','▧','Biblioteca']]
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n)

export default function Home(){
 const [section,setSection]=useState('overview')
 const [models,setModels]=useState(initialModels)
 const [sales,setSales]=useState(initialSales)
 const [showModel,setShowModel]=useState(false)
 const [showSale,setShowSale]=useState(false)
 const [search,setSearch]=useState('')
 const [modelName,setModelName]=useState('')
 const [handle,setHandle]=useState('')
 const [chatter,setChatter]=useState('')
 const [saleModel,setSaleModel]=useState(initialModels[0].name)
 const [saleType,setSaleType]=useState('Propina')
 const [saleAmount,setSaleAmount]=useState('')
 const [saleChatter,setSaleChatter]=useState('')
 const total=sales.reduce((a,s)=>a+s.amount,0)
 const filtered=useMemo(()=>models.filter(m=>(m.name+' '+m.handle).toLowerCase().includes(search.toLowerCase())),[models,search])
 const title=navItems.find(n=>n[0]===section)?.[2]||'Resumen'
 function addModel(e:React.FormEvent){e.preventDefault();if(!modelName.trim())return;setModels(v=>[...v,{id:Date.now(),name:modelName.trim(),handle:handle.trim()||'Sin usuario',status:'Activa',revenue:0,chatter:chatter||'Sin asignar'}]);setModelName('');setHandle('');setChatter('');setShowModel(false)}
 function addSale(e:React.FormEvent){e.preventDefault();const amount=Number(saleAmount);if(!amount||amount<=0)return;setSales(v=>[{id:Date.now(),model:saleModel,type:saleType,amount,chatter:saleChatter||'Sin asignar',date:'Hoy'},...v]);setSaleAmount('');setSaleChatter('');setShowSale(false)}
 return <div className="shell">
  <aside className="sidebar">
   <div className="brand"><div className="brand-mark">MAISON</div><div className="brand-sub">MANAGEMENT · AGENCY OS</div></div>
   <div className="nav-label">WORKSPACE</div>
   {navItems.map(([key,icon,label])=><button key={key} className={'nav '+(section===key?'active':'')} onClick={()=>{setSection(key);setSearch('')}}><span className="nav-icon">{icon}</span><span>{label}</span></button>)}
   <div className="nav-label">SISTEMA</div>
   <button className="nav" onClick={()=>alert('La configuración de usuarios y permisos se habilitará al conectar la autenticación.')}><span className="nav-icon">⚙</span><span>Configuración</span></button>
   <div className="sidebar-bottom"><div className="profile"><div className="avatar">MM</div><div><strong>Administrador</strong><small>MAISON MANAGEMENT</small></div></div></div>
  </aside>
  <main className="main">
   <header className="topbar"><div><div className="eyebrow">MAISON MANAGEMENT / {title}</div><h1 className="page-title">{section==='overview'?'Panel de control':title}</h1></div><div className="top-actions"><span className="date-pill">NOV 2026</span><span className="demo-pill">VISTA PREVIA</span></div></header>
   <div className="notice"><strong>Entorno de demostración.</strong> Los datos son ejemplos y los cambios solo viven en esta sesión del navegador. Antes de operar con información real conectaremos autenticación, base de datos y almacenamiento privado.</div>
   {section==='overview'&&<><div className="grid">
    <div className="stat"><div className="stat-top">Ingresos registrados <span className="stat-icon">$</span></div><div className="stat-value">{money(total)}</div><div className="stat-foot">Ventas de muestra en este panel</div></div>
    <div className="stat"><div className="stat-top">Modelos activos <span className="stat-icon">♙</span></div><div className="stat-value">{models.filter(m=>m.status==='Activa').length}</div><div className="stat-foot">Perfiles en gestión</div></div>
    <div className="stat"><div className="stat-top">Ventas registradas <span className="stat-icon">↗</span></div><div className="stat-value">{sales.length}</div><div className="stat-foot">Operaciones ingresadas manualmente</div></div>
    <div className="stat"><div className="stat-top">Equipo asignado <span className="stat-icon">♧</span></div><div className="stat-value">{new Set(models.map(m=>m.chatter).filter(x=>x!=='Sin asignar')).size}</div><div className="stat-foot">Grupos con asignaciones</div></div>
   </div>
   <div className="section-head"><h2>Rendimiento de la agencia</h2><span className="muted">Vista ilustrativa · últimos 7 meses</span></div>
   <div className="two-col"><section className="panel"><h3 className="panel-title">Ingresos mensuales</h3><div className="muted">Gráfica de ejemplo, no representa ingresos reales</div><div className="chart-wrap">{[38,52,45,67,58,82,72].map((v,i)=><div className="bar-col" key={i}><div className="bar" style={{height:v+'%'}}/><span className="bar-label">{['MAY','JUN','JUL','AGO','SEP','OCT','NOV'][i]}</span></div>)}</div><div className="legend"><span>Actividad ilustrativa</span><span className="gold">USD</span></div></section>
    <section className="panel"><h3 className="panel-title">Actividad reciente</h3><div className="muted">Últimos movimientos registrados</div><div className="activity">{sales.slice(0,4).map(s=><div className="activity-row" key={s.id}><span className="activity-dot"/><div><strong>{s.type} · {money(s.amount)}</strong><small>{s.model} · {s.chatter}</small></div><time>{s.date}</time></div>)}</div></section></div>
   <div className="section-head"><h2>Modelos destacados</h2><button className="btn-ghost" onClick={()=>setSection('models')}>Ver todos →</button></div><ModelTable models={models.slice(0,3)}/>
   </>}
   {section==='models'&&<><div className="section-head"><div><h2>Directorio de modelos</h2><p className="page-intro">Perfiles, estado operativo y responsable asignado.</p></div><button className="btn" onClick={()=>setShowModel(true)}>+ Añadir modelo</button></div><div className="toolbar" style={{marginBottom:14}}><input className="search" placeholder="Buscar modelo o usuario..." value={search} onChange={e=>setSearch(e.target.value)}/></div><ModelTable models={filtered}/></>}
   {section==='team'&&<><div className="section-head"><div><h2>Equipo operativo</h2><p className="page-intro">Estructura inicial de roles y responsabilidades.</p></div></div><div className="cards-3">{[['Administradores','Acceso completo','Gestionan la configuración, modelos, equipo y finanzas.'],['Supervisores','Control operativo','Revisan turnos, asignaciones y rendimiento.'],['Chatters','Operación de chats','Registran ventas y actividad de sus turnos.']].map(x=><div className="mini-card" key={x[0]}><span className="eyebrow">{x[1]}</span><strong>{x[0]}</strong><span>{x[2]}</span></div>)}</div><div className="section-head"><h2>Asignaciones actuales</h2></div><ModelTable models={models}/></>}
   {section==='sales'&&<><div className="section-head"><div><h2>Registro de ventas</h2><p className="page-intro">Captura manual de operaciones de OnlyFans.</p></div><button className="btn" onClick={()=>setShowSale(true)}>+ Registrar venta</button></div><div className="grid"><div className="stat"><div className="stat-top">Total registrado <span className="stat-icon">$</span></div><div className="stat-value">{money(total)}</div><div className="stat-foot">Datos de esta sesión</div></div><div className="stat"><div className="stat-top">Operaciones <span className="stat-icon">↗</span></div><div className="stat-value">{sales.length}</div><div className="stat-foot">Registros de muestra y nuevos</div></div></div><div className="section-head"><h2>Movimientos</h2></div><div className="panel table-wrap"><table className="data-table"><thead><tr><th>MODELO</th><th>TIPO</th><th>CHATTER</th><th>FECHA</th><th>IMPORTE</th></tr></thead><tbody>{sales.map(s=><tr key={s.id}><td>{s.model}</td><td>{s.type}</td><td>{s.chatter}</td><td>{s.date}</td><td className="gold">{money(s.amount)}</td></tr>)}</tbody></table></div></>}
   {section==='finance'&&<><div className="section-head"><div><h2>Centro financiero</h2><p className="page-intro">Resumen de ingresos y estructura de liquidaciones.</p></div></div><div className="grid"><div className="stat"><div className="stat-top">Ventas registradas <span className="stat-icon">$</span></div><div className="stat-value">{money(total)}</div><div className="stat-foot">Importe bruto de esta sesión</div></div><div className="stat"><div className="stat-top">Gastos <span className="stat-icon">−</span></div><div className="stat-value">$0</div><div className="stat-foot">Aún no configurados</div></div><div className="stat"><div className="stat-top">Comisiones <span className="stat-icon">％</span></div><div className="stat-value">—</div><div className="stat-foot">Pendiente de definir porcentajes</div></div><div className="stat"><div className="stat-top">Neto calculado <span className="stat-icon">＝</span></div><div className="stat-value">—</div><div className="stat-foot">Se habilitará con reglas financieras</div></div></div><div className="section-head"><h2>Próximos componentes</h2></div><div className="cards-3">{[['Comisiones','Por modelo, chatter y agencia.'],['Gastos','Costos fijos y variables.'],['Liquidaciones','Cortes por periodo y reportes.']].map(x=><div className="mini-card" key={x[0]}><span className="eyebrow">MÓDULO FINANCIERO</span><strong>{x[0]}</strong><span>{x[1]}</span></div>)}</div></>}
   {section==='library'&&<><div className="section-head"><div><h2>Biblioteca de contenido</h2><p className="page-intro">Organización privada del material por modelo.</p></div></div><div className="panel"><div className="empty"><div style={{fontSize:28,marginBottom:12}}>▧</div><strong style={{color:'#e8e5dc'}}>Biblioteca pendiente de almacenamiento seguro</strong><p>Conectaremos un bucket privado para fotografías y videos, con carpetas por modelo y permisos de acceso.</p></div></div></>}
  </main>
  {showModel&&<div className="modal-backdrop" onClick={()=>setShowModel(false)}><form className="modal" onSubmit={addModel} onClick={e=>e.stopPropagation()}><div className="modal-head"><h3>Nuevo modelo</h3><button type="button" className="btn-ghost" onClick={()=>setShowModel(false)}>Cerrar</button></div><div className="form-grid"><div className="field"><label>Nombre o código interno</label><input required value={modelName} onChange={e=>setModelName(e.target.value)} placeholder="Nombre del modelo"/></div><div className="field"><label>Usuario de OnlyFans</label><input value={handle} onChange={e=>setHandle(e.target.value)} placeholder="@usuario"/></div><div className="field" style={{gridColumn:'1/-1'}}><label>Responsable / equipo</label><input value={chatter} onChange={e=>setChatter(e.target.value)} placeholder="Equipo A, chatter..."/></div></div><div className="modal-actions"><button type="button" className="btn-ghost" onClick={()=>setShowModel(false)}>Cancelar</button><button className="btn">Guardar modelo</button></div></form></div>}
  {showSale&&<div className="modal-backdrop" onClick={()=>setShowSale(false)}><form className="modal" onSubmit={addSale} onClick={e=>e.stopPropagation()}><div className="modal-head"><h3>Registrar venta</h3><button type="button" className="btn-ghost" onClick={()=>setShowSale(false)}>Cerrar</button></div><div className="form-grid"><div className="field" style={{gridColumn:'1/-1'}}><label>Modelo</label><select value={saleModel} onChange={e=>setSaleModel(e.target.value)}>{models.map(m=><option key={m.id}>{m.name}</option>)}</select></div><div className="field"><label>Tipo de venta</label><select value={saleType} onChange={e=>setSaleType(e.target.value)}>{['Propina','Mensaje PPV','Contenido','Suscripción','Otro'].map(x=><option key={x}>{x}</option>)}</select></div><div className="field"><label>Importe en USD</label><input type="number" min="0.01" step="0.01" required value={saleAmount} onChange={e=>setSaleAmount(e.target.value)} placeholder="0.00"/></div><div className="field" style={{gridColumn:'1/-1'}}><label>Chatter responsable</label><input value={saleChatter} onChange={e=>setSaleChatter(e.target.value)} placeholder="Nombre del chatter"/></div></div><div className="modal-actions"><button type="button" className="btn-ghost" onClick={()=>setShowSale(false)}>Cancelar</button><button className="btn">Guardar venta</button></div></form></div>}
 </div>
}

function ModelTable({models}:{models:Model[]}){return <div className="panel table-wrap"><table className="data-table"><thead><tr><th>MODELO</th><th>USUARIO</th><th>ESTADO</th><th>RESPONSABLE</th><th>INGRESOS</th></tr></thead><tbody>{models.length?models.map(m=><tr key={m.id}><td><div className="model-cell"><span className="model-avatar">{m.name.slice(0,1).toUpperCase()}</span><strong>{m.name}</strong></div></td><td>{m.handle}</td><td><span className={'status '+(m.status!=='Activa'?'pending':'')}>{m.status}</span></td><td>{m.chatter}</td><td className="gold">{money(m.revenue)}</td></tr>):<tr><td colSpan={5}><div className="empty">No hay modelos que coincidan con la búsqueda.</div></td></tr>}</tbody></table></div>}
