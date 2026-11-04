import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const savedState = request.cookies.get('google_oauth_state')?.value
  if (!code || !state || !savedState || state !== savedState) {
    return new NextResponse('No se pudo validar la autorización. Inicia el proceso de nuevo.', { status: 400 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return new NextResponse('Faltan las credenciales OAuth en Vercel.', { status: 503 })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: 'https://oficio-one.vercel.app/api/google/callback',
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  })
  const data = await response.json()
  if (!response.ok || !data.refresh_token) {
    return new NextResponse('Google no devolvió un refresh token. Revoca el acceso y vuelve a autorizar.', { status: 502 })
  }

  const html = '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Maison Management</title><body style="font:16px system-ui;max-width:680px;margin:10vh auto;padding:24px"><h1>Autorización completada</h1><p>Google autorizó el calendario. El siguiente paso será guardar el refresh token de forma segura en Vercel.</p><p>Por seguridad, no compartas códigos ni credenciales.</p></body></html>'
  const result = new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
  result.cookies.set('google_oauth_state', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/google/callback', maxAge: 0 })
  return result
}
