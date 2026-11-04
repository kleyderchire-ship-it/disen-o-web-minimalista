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

  const token = String(data.refresh_token).replace(/[&<>"]/g, '')
  const html = '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Maison Management</title><body style="font:16px system-ui;max-width:680px;margin:10vh auto;padding:24px"><h1>Autorización completada</h1><p>Copia este valor directamente en Vercel como GOOGLE_REFRESH_TOKEN. No lo compartas por chat ni con nadie.</p><textarea id="t" readonly style="width:100%;min-height:100px">' + token + '</textarea><button onclick="navigator.clipboard.writeText(document.getElementById(\'t\').value)">Copiar token</button><p>Después de guardarlo en Vercel, elimina esta página del historial del navegador.</p></body></html>'
  const result = new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store, max-age=0', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' } })
  result.cookies.set('google_oauth_state', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/google/callback', maxAge: 0 })
  return result
}
