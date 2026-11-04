import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : ''
    const date = typeof body.date === 'string' ? body.date : ''
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1500) : ''
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Revisa tu nombre, correo y fecha.' }, { status: 400 })
    }
    const parsed = new Date(date + 'T12:00:00Z')
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      return NextResponse.json({ error: 'La fecha no es válida.' }, { status: 400 })
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json({ error: 'El calendario todavía no está conectado.' }, { status: 503 })
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
      cache: 'no-store',
    })
    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok || !tokenData.access_token) return NextResponse.json({ error: 'No se pudo conectar con Google Calendar.' }, { status: 502 })

    const endDate = new Date(parsed.getTime() + 86400000).toISOString().slice(0, 10)
    const event = {
      summary: '[PENDIENTE] Solicitud de llamada — ' + name,
      description: 'Solicitud desde Maison Management.\nNombre: ' + name + '\nCorreo: ' + email + '\nFecha solicitada: ' + date + '\nMensaje: ' + (message || 'Sin mensaje adicional') + '\n\nPendiente de revisión y asignación manual de hora.',
      start: { date },
      end: { date: endDate },
      status: 'tentative',
      transparency: 'transparent',
    }
    const eventResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + tokenData.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      cache: 'no-store',
    })
    if (!eventResponse.ok) return NextResponse.json({ error: 'Google Calendar no pudo guardar la solicitud.' }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se pudo procesar la solicitud.' }, { status: 500 })
  }
}
