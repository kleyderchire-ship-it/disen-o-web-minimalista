import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiUserContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const context = await getFansApiUserContext(request)
  if ('error' in context) return context.error
  if (!context.apiKey) return NextResponse.json({ error: 'Falta configurar FANS_API_KEY en el servidor.' }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''
  if (startDate && Number.isNaN(Date.parse(startDate))) return NextResponse.json({ error: 'Fecha inicial no válida.' }, { status: 400 })
  if (endDate && Number.isNaN(Date.parse(endDate))) return NextResponse.json({ error: 'Fecha final no válida.' }, { status: 400 })

  const { data: models, error: modelsError } = await context.supabase.from('models').select('id,display_name').eq('active',true)
  if (modelsError) return NextResponse.json({ error: 'No se pudieron cargar los modelos.' }, { status: 500 })
  const { data: accounts, error: accountsError } = await context.supabase.from('platform_accounts')
    .select('model_id,provider_account_id,connection_status').eq('provider','onlyfans')
  if (accountsError) return NextResponse.json({ error: 'No se pudieron consultar las cuentas conectadas.' }, { status: 500 })

  const accountMap = new Map((accounts || []).map((account: any) => [account.model_id, account]))
  const rows = await Promise.all((models || []).map(async (model: any) => {
    const account: any = accountMap.get(model.id)
    if (!account || account.connection_status !== 'connected' || !account.provider_account_id) {
      return { modelId: model.id, modelName: model.display_name, connected: false, earnings: null }
    }
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate.replace('T',' ').slice(0,19))
    if (endDate) params.set('endDate', endDate.replace('T',' ').slice(0,19))
    const result = await fansApiRequest(
      `https://api.fansapi.com/api/${encodeURIComponent(account.provider_account_id)}/payouts/earning-statistics?${params.toString()}`,
      context.apiKey,
    )
    if (!result.response.ok) return { modelId: model.id, modelName: model.display_name, connected: true, error: 'No se pudieron recuperar las estadísticas del proveedor.' }
    const payload: any = result.payload
    return { modelId: model.id, modelName: model.display_name, connected: true, earnings: payload?.data?.list?.total || payload?.data?.total || null }
  }))

  return NextResponse.json({ data: rows, period: { startDate: startDate || null, endDate: endDate || null } })
}
