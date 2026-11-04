'use client'

import { useState } from 'react'
import { ArrowRight, Check, Mail } from 'lucide-react'

const EMAIL = 'Kleyderchire@gmail.com'

const points = [
  'Evaluación gratuita de tu cuenta',
  'Propuesta personalizada sin compromiso',
  'Confidencialidad garantizada',
]

export function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [date, setDate] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('Enviando solicitud...')
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, date, message }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No se pudo enviar la solicitud.')
      setStatus('¡Solicitud recibida! Quedará pendiente hasta que confirmemos la hora.')
      setName('')
      setEmail('')
      setDate('')
      setMessage('')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.')
    }
  }

  return (
    <section id="contacto" className="scroll-mt-16">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col items-center justify-center px-6 py-28 text-center">
        <div id="a-finale" aria-hidden="true" className="h-[42vh] w-full max-w-md" />
        <p className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-accent">Contacto</p>
        <h2 className="mt-3 max-w-2xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          Hablemos del futuro de tu marca.
        </h2>
        <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
          Solicita una llamada. Tú eliges el día y nuestro equipo confirmará la hora.
        </p>
        <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3">
          {points.map((point) => (
            <li key={point} className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-accent" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
        <form onSubmit={submitRequest} className="mt-10 grid w-full max-w-xl gap-4 text-left">
          <label className="grid gap-2 text-sm">
            Nombre completo
            <input required maxLength={120} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="rounded-lg border border-border bg-background/70 px-4 py-3" placeholder="Tu nombre" />
          </label>
          <label className="grid gap-2 text-sm">
            Correo electrónico
            <input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-lg border border-border bg-background/70 px-4 py-3" placeholder="tu@email.com" />
          </label>
          <label className="grid gap-2 text-sm">
            Día que prefieres
            <input required type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} className="rounded-lg border border-border bg-background/70 px-4 py-3" />
          </label>
          <label className="grid gap-2 text-sm">
            Mensaje (opcional)
            <textarea maxLength={1500} value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-24 rounded-lg border border-border bg-background/70 px-4 py-3" placeholder="Cuéntanos brevemente qué necesitas." />
          </label>
          <button type="submit" className="group inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
            Solicitar llamada
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
          {status && <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{status}</p>}
        </form>
        <a href={`mailto:${EMAIL}`} className="mt-8 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">
          <Mail className="size-4" aria-hidden="true" />
          {EMAIL}
        </a>
      </div>
    </section>
  )
}
