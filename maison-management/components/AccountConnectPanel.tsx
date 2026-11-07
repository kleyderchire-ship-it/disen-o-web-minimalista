'use client'

import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model = { id: string; name: string }
type AccountStatus = { model_id: string; connection_status: string; provider_account_id: string | null }
type Attempt = { id: string; model_id: string; provider_attempt_id: string; mobile_auth_session_deeplink: string | null; state: string; created_at: string }

export default function AccountConnectPanel({ models, supabase, role }: { models: Model[]; supabase: SupabaseClient; role: string }) {
  const [accounts, setAccounts] = useState<Record<string, AccountStatus>>({})
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({})
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState('')
  const [feedback, setFeedback] = useState('')

  async function token() {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || ''
  }

  async function refresh() {
    setLoading(true)
    const [accountResult, attemptResult] = await Promise.all([
      supabase.from('platform_accounts').select('model_id,connection_status,provider_account_id').eq('provider','onlyfans'),
      supabase.from('provider_auth_attempts').select('id,model_id,provider_attempt_id,mobile_auth_session_deeplink,state,created_at').eq('state','pending').order('created_at',{ascending:false}),
    ])
    if (accountResult.error) setFeedback(accountResult.error.message)
    const accountMap: Record<string, AccountStatus> = {}
    ;(accountResult.data || []).forEach((row: any) => { accountMap[row.model_id] = row })
    setAccounts(accountMap)
    const attemptMap: Record<string, Attempt> = {}
    ;(attemptResult.data || []).forEach((row: any) => { if (!attemptMap[row.model_id]) attemptMap[row.model_id] = row })
    setAttempts(attemptMap)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [models.length])

  async function start(model: Model) {
    setBusy(model.id)
    setFeedback('')
    try {
      const response = await fetch('/api/accounts/connect', {
        method:'POST',
        headers:{Authorization:'Bearer '+await token(),'Content-Type':'application/json'},
        body:JSON.stringify({modelId:model.id}),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo iniciar la conexión.')
      setFeedback(payload.message || 'Autorización iniciada.')
      await refresh()
      if (payload.deepLink) window.open(payload.deepLink, '_blank')
    } catch (e) { setFeedback(e instanceof Error ? e.message : 'Error de conexión.') }
    finally { setBusy('') }
  }

  async function poll(model: Model) {
    const attempt = attempts[model.id]
    if (!attempt) return
    setBusy(model.id)
    setFeedback('')
    try {
      const params = new URLSearchParams({modelId:model.id,attemptId:attempt.provider_attempt_id})
      const response = await fetch('/api/accounts/connect/status?'+params.toString(), {headers:{Authorization:'Bearer '+await token()},cache:'no-store'})
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo consultar la autorización.')
      setFeedback(payload.connected ? 'Cuenta conectada correctamente.' : 'Estado: '+(payload.progress || payload.state || 'pendiente')+'. Completa la autorización en el iPhone y vuelve a consultar.')
      await refresh()
    } catch (e) { setFeedback(e instanceof Error ? e.message : 'Error al consultar la autorización.') }
    finally { setBusy('') }
  }

  if (role !== 'admin') return <div className="notice">La conexión de cuentas OnlyFans está reservada al administrador para proteger la autorización de cada creadora.</div>
  if (!models.length) return <div className="panel empty">Añade primero los modelos para iniciar la conexión.</div>

  return <div className="panel account-connect-panel">
    <div className="account-connect-heading"><div><h3 className="panel-title">Conexiones de OnlyFans</h3><p className="muted">Cada creadora completa la autorización desde su propio iPhone mediante Fans API Auth+.</p></div><button className="btn-ghost" onClick={refresh} disabled={loading}>{loading?'Actualizando…':'↻ Actualizar'}</button></div>
    <div className="account-connect-list">
      {models.map(model => {
        const account = accounts[model.id]
        const attempt = attempts[model.id]
        const connected = account?.connection_status === 'connected' && Boolean(account.provider_account_id)
        return <div className="account-connect-row" key={model.id}>
          <div className="account-connect-model"><span className="model-avatar">{model.name.slice(0,1).toUpperCase()}</span><div><strong>{model.name}</strong><small>{connected?'Cuenta conectada':account?.connection_status==='pending'?'Autorización pendiente':'Sin conectar'}</small></div></div>
          <span className={'status '+(!connected?'pending':'')}>{connected?'Conectada':account?.connection_status==='pending'?'Pendiente':'Desconectada'}</span>
          {attempt && !connected ? <div className="account-connect-actions">{attempt.mobile_auth_session_deeplink && <a className="btn-ghost" href={attempt.mobile_auth_session_deeplink}>Abrir Auth+</a>}<button className="btn" onClick={()=>poll(model)} disabled={busy===model.id}>{busy===model.id?'Consultando…':'Verificar conexión'}</button></div> : !connected ? <button className="btn" onClick={()=>start(model)} disabled={busy===model.id}>{busy===model.id?'Iniciando…':'Conectar OnlyFans'}</button> : <span className="muted">Lista para operar</span>}
        </div>
      })}
    </div>
    {feedback && <div className="notice" style={{marginTop:14,marginBottom:0}}>{feedback}</div>}
    <p className="muted" style={{marginTop:12}}>MAISON no solicita ni almacena contraseñas, cookies o códigos 2FA. La creadora autoriza su cuenta directamente en Auth+.</p>
  </div>
}
