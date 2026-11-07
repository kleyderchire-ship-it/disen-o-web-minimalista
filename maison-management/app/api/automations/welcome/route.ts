import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const modelId = searchParams.get('modelId') || ''
  if (!/^[0-9a-f-]{36}$/i.test(modelId)) return NextResponse.json({ error: 'Modelo no válido.' }, { status: 400 })
  const context = await getFansApiContext(request, modelId)
  if ('error' in context) return context.error
  if (!('accountId' in context)) return NextResponse.json({ error: 'Cuenta no disponible.' }, { status: 409 })
  const result = await fansApiRequest(`https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/settings/welcome-message`, context.apiKey)
  if (!result.response.ok) return NextResponse.json({ error: 'No se pudo consultar el mensaje de bienvenida.', provider: result.payload }, { status: result.response.status })
  return NextResponse.json(result.payload)
}

export async function POST(request: Request) {
  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Cuerpo JSON no válido.' }, { status: 400 }) }
  const modelId = String(body?.modelId || '')
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const mediaFiles = Array.isArray(body?.mediaFiles) ? body.mediaFiles.filter((x: unknown) => typeof x === 'string') : []
  const price = body?.price == null ? 0 : Number(body.price)
  if (!/^[0-9a-f-]{36}$/i.test(modelId) || (!text && mediaFiles.length===0)) return NextResponse.json({ error: 'Modelo y texto o contenido multimedia son obligatorios.' }, { status: 400 })
  if (!Number.isFinite(price) || (price!==0&&(price<3||price>200))) return NextResponse.json({ error: 'El precio debe ser 0 o estar entre 3 y 200 USD.' }, { status: 400 })
  if (price>0&&mediaFiles.length===0) return NextResponse.json({ error: 'Un mensaje de bienvenida PPV necesita archivos multimedia.' }, { status: 400 })
  const context = await getFansApiContext(request, modelId)
  if ('error' in context) return context.error
  if (!('accountId' in context)) return NextResponse.json({ error: 'Cuenta no disponible.' }, { status: 409 })
  const payload:Record<string,unknown>={}
  if(text)payload.text=text
  if(mediaFiles.length)payload.mediaFiles=mediaFiles
  if(price>0)payload.price=price
  if(body?.lockedText===true)payload.lockedText=true
  const url=`https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/settings/welcome-message`
  const updated=await fansApiRequest(url,context.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
  if(!updated.response.ok)return NextResponse.json({error:'No se pudo actualizar la plantilla.',provider:updated.payload},{status:updated.response.status})
  if(typeof body?.enabled==='boolean'){
    const enabled=await fansApiRequest(url,context.apiKey,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:body.enabled})})
    if(!enabled.response.ok)return NextResponse.json({warning:'La plantilla se actualizó, pero no se pudo cambiar el estado.',provider:enabled.payload},{status:207})
  }
  return NextResponse.json({ok:true,data:updated.payload})
}
