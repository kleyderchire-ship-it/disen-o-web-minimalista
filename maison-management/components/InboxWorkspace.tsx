'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type ModelOption = { id: string; name: string }
type Chat = {
  fan?: { id?: number | string; username?: string; name?: string; displayName?: string; avatar?: string; avatarThumbs?: { c144?: string } }
  lastMessage?: { text?: string; createdAt?: string; isFromQueue?: boolean; isSentByMe?: boolean }
  unreadMessagesCount?: number
  canSendMessage?: boolean
  canNotSendReason?: string | false
  hasUnreadTips?: boolean
  isMutedNotifications?: boolean
}
type VaultAsset = { id: number | string; type: string; files?: { thumb?: { url?: string } | null; preview?: { url?: string } | null; full?: { url?: string } }; isReady?: boolean; hasError?: boolean }
type MessageMedia = { id?: number | string; type?: string; files?: { thumb?: { url?: string } | null; preview?: { url?: string } | null; full?: { url?: string } } }
type Message = {
  id?: string | number
  text?: string
  createdAt?: string
  isSentByMe?: boolean
  isFromQueue?: boolean
  price?: number
  lockedText?: boolean
  isOpened?: boolean
  seenByFan?: boolean | null
  media?: MessageMedia[]
}

const plain = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()
const time = (value?: string) => value ? new Date(value).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : ''

export default function InboxWorkspace({ models, supabase }: { models: ModelOption[]; supabase: SupabaseClient }) {
  const [modelId, setModelId] = useState('')
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [ppvPrice, setPpvPrice] = useState('')
  const [lockedText, setLockedText] = useState(false)
  const [loadingChats, setLoadingChats] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showVault, setShowVault] = useState(false)
  const [vaultItems, setVaultItems] = useState<VaultAsset[]>([])
  const [selectedMedia, setSelectedMedia] = useState<string[]>([])
  const [loadingVault, setLoadingVault] = useState(false)
  const [vaultError, setVaultError] = useState('')

  useEffect(() => {
    if (!modelId && models.length) setModelId(models[0].id)
    if (modelId && !models.some(model => model.id === modelId)) setModelId(models[0]?.id || '')
  }, [models, modelId])

  async function accessToken() {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || ''
  }

  async function loadChats() {
    if (!modelId) return
    setLoadingChats(true)
    setError('')
    try {
      const token = await accessToken()
      const params = new URLSearchParams({ modelId, limit: '50' })
      if (filter !== 'all') params.set('filter', filter)
      if (search.trim()) params.set('query', search.trim())
      const response = await fetch('/api/inbox/chats?' + params.toString(), { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo cargar la bandeja.')
      const rows: Chat[] = Array.isArray(payload?.data) ? payload.data : []
      setChats(rows)
      if (selectedChat) {
        const refreshed = rows.find(chat => String(chat.fan?.id || '') === String(selectedChat.fan?.id || ''))
        if (refreshed) setSelectedChat(refreshed)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar mensajes.')
      setChats([])
    } finally {
      setLoadingChats(false)
    }
  }

  async function loadMessages(chat: Chat) {
    const chatId = String(chat.fan?.id || '')
    if (!modelId || !/^\d{1,32}$/.test(chatId)) return
    setSelectedChat(chat)
    setLoadingMessages(true)
    setError('')
    try {
      const token = await accessToken()
      const params = new URLSearchParams({ modelId, chatId, limit: '50' })
      const response = await fetch('/api/inbox/messages?' + params.toString(), { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo abrir la conversación.')
      const rows: Message[] = Array.isArray(payload?.data) ? payload.data : []
      setMessages(rows.slice().reverse())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al abrir conversación.')
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    setSelectedChat(null)
    setMessages([])
    if (modelId) loadChats()
    // Loading is intentionally triggered by model/filter/search changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId, filter])

  useEffect(() => {
    if (!modelId) return
    const channel = supabase.channel('maison-inbox-' + modelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbox_conversations', filter: 'model_id=eq.' + modelId }, () => {
        void loadChats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbox_messages', filter: 'model_id=eq.' + modelId }, () => {
        void loadChats()
        if (selectedChat) void loadMessages(selectedChat)
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [modelId, selectedChat?.fan?.id])

  const visibleChats = useMemo(() => chats.filter(chat => {
    const fan = chat.fan || {}
    const label = [fan.username, fan.name, fan.displayName].filter(Boolean).join(' ').toLowerCase()
    return label.includes(search.toLowerCase())
  }), [chats, search])

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedChat || !modelId || (!draft.trim() && selectedMedia.length === 0)) return
    const chatId = String(selectedChat.fan?.id || '')
    const price = ppvPrice ? Number(ppvPrice) : 0
    if (price && (price < 3 || price > 200)) {
      setError('El precio PPV debe estar entre 3 y 200 USD.')
      return
    }
    setSending(true)
    setError('')
    setNotice('')
    try {
      const token = await accessToken()
      const response = await fetch('/api/inbox/messages', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ modelId, chatId, text: draft.trim(), price, lockedText, mediaFiles: selectedMedia }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo enviar el mensaje.')
      setDraft('')
      setSelectedMedia([])
      setPpvPrice('')
      setLockedText(false)
      setNotice('Mensaje enviado a través de Fans API.')
      await loadMessages(selectedChat)
      await loadChats()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el mensaje.')
    } finally {
      setSending(false)
    }
  }

  async function openVault() {
    setShowVault(true)
    if (vaultItems.length || !modelId) return
    setLoadingVault(true)
    setVaultError('')
    try {
      const token = await accessToken()
      const response = await fetch('/api/vault?'+new URLSearchParams({modelId,offset:'0'}).toString(), {headers:{Authorization:'Bearer '+token},cache:'no-store'})
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo abrir el vault.')
      const rows: VaultAsset[] = Array.isArray(payload?.data?.list) ? payload.data.list : []
      setVaultItems(rows.filter(item => item.isReady !== false && !item.hasError))
    } catch (e) {
      setVaultError(e instanceof Error ? e.message : 'Error cargando el vault.')
    } finally {
      setLoadingVault(false)
    }
  }

  if (!models.length) return <div className="panel inbox-empty">Primero debes crear un modelo y asignarlo a tu usuario para acceder a su bandeja.</div>

  return <section className="inbox-workspace">
    <div className="inbox-toolbar">
      <div className="field"><label>Cuenta de modelo</label><select value={modelId} onChange={e => setModelId(e.target.value)}>{models.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}</select></div>
      <button className="btn-ghost" onClick={loadChats} disabled={loadingChats}>{loadingChats ? 'Actualizando…' : '↻ Actualizar bandeja'}</button>
    </div>
    <div className="inbox-layout">
      <aside className="inbox-list panel">
        <div className="inbox-search"><input className="search" placeholder="Buscar fan…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') loadChats() }}/><button className="btn-ghost" onClick={loadChats}>Buscar</button></div>
        <div className="inbox-filters">{[['all','Todos'],['unread','No leídos'],['priority','Prioridad'],['with_tips','Propinas']].map(([value,label]) => <button key={value} className={'inbox-filter ' + (filter === value ? 'selected' : '')} onClick={() => setFilter(value)}>{label}</button>)}</div>
        <div className="inbox-chat-list">
          {loadingChats && <div className="empty">Cargando conversaciones…</div>}
          {!loadingChats && visibleChats.length === 0 && <div className="empty">No hay conversaciones para mostrar. Comprueba que la cuenta esté conectada.</div>}
          {visibleChats.map((chat, index) => {
            const fan = chat.fan || {}
            const id = String(fan.id || index)
            const selected = String(selectedChat?.fan?.id || '') === String(fan.id || '')
            const avatar = fan.avatarThumbs?.c144 || fan.avatar
            return <button key={id} className={'inbox-chat ' + (selected ? 'selected' : '')} onClick={() => loadMessages(chat)}>
              {avatar ? <img src={avatar} alt="" className="inbox-avatar"/> : <span className="inbox-avatar inbox-avatar-fallback">{(fan.username || fan.name || '?').slice(0,1).toUpperCase()}</span>}
              <span className="inbox-chat-copy"><strong>{fan.displayName || fan.name || fan.username || 'Fan'}</strong><small>@{fan.username || fan.id || 'usuario'}</small><span>{plain(chat.lastMessage?.text || 'Sin mensajes')}</span></span>
              <span className="inbox-chat-meta">{chat.unreadMessagesCount ? <b>{chat.unreadMessagesCount}</b> : null}<small>{time(chat.lastMessage?.createdAt)}</small></span>
            </button>
          })}
        </div>
      </aside>
      <div className="inbox-thread panel">
        {!selectedChat && <div className="empty inbox-thread-empty"><div style={{fontSize:32,marginBottom:12}}>✉</div><strong>Tu centro de mensajes</strong><p>Selecciona una conversación para ver el historial y responder desde MAISON.</p></div>}
        {selectedChat && <>
          <header className="inbox-thread-head"><div><strong>{selectedChat.fan?.displayName || selectedChat.fan?.name || selectedChat.fan?.username || 'Conversación'}</strong><small>@{selectedChat.fan?.username || selectedChat.fan?.id}</small></div><span className="date-pill">{selectedChat.unreadMessagesCount ? selectedChat.unreadMessagesCount + ' sin leer' : 'Conversación'}</span></header>
          <div className="inbox-messages">
            {loadingMessages && <div className="empty">Cargando mensajes…</div>}
            {!loadingMessages && messages.map((message, index) => <div key={String(message.id || index)} className={'inbox-message-row ' + (message.isSentByMe ? 'outgoing' : 'incoming')}><div className="inbox-message"><p>{plain(message.text || (message.media?.length ? 'Contenido multimedia' : 'Mensaje'))}</p>{message.media?.length ? <div className="inbox-message-media">{message.media.map((asset,i)=>{const src=asset.files?.preview?.url||asset.files?.thumb?.url||asset.files?.full?.url;return src?<img key={String(asset.id||i)} src={src} alt={asset.type||'Archivo multimedia'}/>:<span key={String(asset.id||i)}>{asset.type||'Multimedia'}</span>})}</div>:null}{message.price ? <strong className="inbox-ppv">PPV · {message.price} USD</strong> : null}<small>{time(message.createdAt)}{message.isSentByMe ? (message.seenByFan ? ' · Visto' : ' · Enviado') : ''}</small></div></div>)}
            {!loadingMessages && messages.length === 0 && <div className="empty">Esta conversación no contiene mensajes visibles.</div>}
          </div>
          <form className="inbox-composer" onSubmit={sendMessage}>
            <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Escribe una respuesta…" rows={3}/>
            {selectedMedia.length>0&&<div className="inbox-selected-media">{selectedMedia.map(id=><button type="button" key={id} className="inbox-media-chip" onClick={()=>setSelectedMedia(v=>v.filter(x=>x!==id))}>Archivo #{id} ×</button>)}</div>}
            <div className="inbox-compose-bottom"><button type="button" className="btn-ghost" onClick={openVault}>＋ Añadir del vault</button><label className="inbox-ppv-field">Precio PPV (USD)<input type="number" min="3" max="200" step="0.01" value={ppvPrice} onChange={e => setPpvPrice(e.target.value)} placeholder="Gratis"/></label><label className="inbox-check"><input type="checkbox" checked={lockedText} onChange={e => setLockedText(e.target.checked)}/> Bloquear texto</label><button className="btn" disabled={sending || (!draft.trim() && selectedMedia.length===0)}>{sending ? 'Enviando…' : 'Enviar mensaje'}</button></div>
          </form>
        </>}
      </div>
    </div>
    {error && <div className="notice inbox-feedback-error">{error}</div>}
    {notice && <div className="notice inbox-feedback-ok">{notice}</div>}
    {showVault&&<div className="modal-backdrop" onClick={()=>setShowVault(false)}><div className="modal inbox-vault-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><h3>Seleccionar contenido del vault</h3><button type="button" className="btn-ghost" onClick={()=>setShowVault(false)}>Cerrar</button></div>{loadingVault&&<div className="empty">Cargando archivos…</div>}{vaultError&&<div className="notice inbox-feedback-error">{vaultError}</div>}{!loadingVault&&!vaultError&&vaultItems.length===0&&<div className="empty">No hay archivos listos en el vault.</div>}<div className="inbox-vault-grid">{vaultItems.map(item=>{const id=String(item.id);const src=item.files?.preview?.url||item.files?.thumb?.url||item.files?.full?.url;const selected=selectedMedia.includes(id);return <button type="button" key={id} className={'inbox-vault-item '+(selected?'selected':'')} onClick={()=>setSelectedMedia(v=>selected?v.filter(x=>x!==id):[...v,id])}>{src?<img src={src} alt="Contenido del vault"/>:<span>{item.type}</span>}<small>#{id} · {item.type}</small></button>})}</div><div className="modal-actions"><span className="muted">{selectedMedia.length} archivo(s) seleccionados</span><button type="button" className="btn" onClick={()=>setShowVault(false)}>Usar selección</button></div></div></div>}
    <p className="muted inbox-disclaimer">La bandeja consulta conversaciones de OnlyFans mediante Fans API. El envío requiere una cuenta conectada y una clave de integración configurada de forma privada en el servidor.</p>
  </section>
}
