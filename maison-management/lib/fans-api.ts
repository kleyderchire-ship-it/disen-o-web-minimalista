import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function getFansApiContext(request: Request, modelId: string) {
  const authorization = request.headers.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!token) return { error: NextResponse.json({ error: 'Sesión requerida.' }, { status: 401 }) }
  if (!supabaseUrl || !supabaseAnonKey) return { error: NextResponse.json({ error: 'Supabase no está configurado.' }, { status: 503 }) }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData.user) return { error: NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 }) }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role,active')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile?.active) return { error: NextResponse.json({ error: 'Usuario inactivo o sin perfil.' }, { status: 403 }) }

  const { data: account, error: accountError } = await supabase
    .from('platform_accounts')
    .select('provider_account_id,connection_status')
    .eq('model_id', modelId)
    .eq('provider', 'onlyfans')
    .maybeSingle()

  if (accountError) return { error: NextResponse.json({ error: 'No se pudo validar el acceso a esta modelo.' }, { status: 403 }) }
  if (!account || account.connection_status !== 'connected' || !account.provider_account_id) {
    return { error: NextResponse.json({ error: 'Esta modelo todavía no tiene una cuenta de OnlyFans conectada.' }, { status: 409 }) }
  }

  const apiKey = process.env.FANS_API_KEY
  if (!apiKey) return { error: NextResponse.json({ error: 'La integración de Fans API todavía no está configurada en el servidor.' }, { status: 503 }) }

  return { supabase, user: authData.user, role: profile.role, accountId: account.provider_account_id, apiKey }
}

export async function fansApiRequest(url: string, apiKey: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers || {}),
    },
  })
  const raw = await response.text()
  let payload: unknown
  try { payload = raw ? JSON.parse(raw) : {} } catch { payload = { message: raw } }
  return { response, payload }
}
