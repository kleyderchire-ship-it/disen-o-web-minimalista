import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'

export const runtime = 'nodejs'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Falta configurar GOOGLE_CLIENT_ID en Vercel.' }, { status: 503 })
  }

  const state = randomUUID()
  const redirectUri = 'https://oficio-one.vercel.app/api/google/callback'
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.events')
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('state', state)

  const response = NextResponse.redirect(url)
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/google/callback',
    maxAge: 600,
  })
  return response
}
