import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiContext } from '@/lib/fans-api'

export const runtime = 'nodejs'

function isPublicHttpsUrl(value:string){
  try{
    const url=new URL(value)
    if(url.protocol!=='https:')return false
    const host=url.hostname.toLowerCase()
    if(host==='localhost'||host.endsWith('.localhost')||host==='127.0.0.1'||host==='::1')return false
    if(/^10\./.test(host)||/^192\.168\./.test(host)||/^172\.(1[6-9]|2\d|3[01])\./.test(host))return false
    return true
  }catch{return false}
}

export async function POST(request:Request){
  let form:FormData
  try{form=await request.formData()}catch{return NextResponse.json({error:'Formulario multipart no válido.'},{status:400})}
  const modelId=String(form.get('modelId')||'')
  const fileUrl=String(form.get('file_url')||'').trim()
  const file=form.get('file')
  if(!/^[0-9a-f-]{36}$/i.test(modelId))return NextResponse.json({error:'Modelo no válido.'},{status:400})
  if(!(file instanceof File)&&!fileUrl)return NextResponse.json({error:'Selecciona un archivo o proporciona una URL pública HTTPS.'},{status:400})
  if(file instanceof File&&file.size>4*1024*1024)return NextResponse.json({error:'La carga directa desde MAISON admite hasta 4 MB. Para videos más grandes usa una URL pública HTTPS.'},{status:413})
  if(fileUrl&&!isPublicHttpsUrl(fileUrl))return NextResponse.json({error:'La URL debe ser HTTPS y no puede apuntar a una dirección local o privada.'},{status:400})

  const context=await getFansApiContext(request,modelId)
  if('error' in context)return context.error
  if(!('accountId' in context))return NextResponse.json({error:'Cuenta no disponible.'},{status:409})

  const providerForm=new FormData()
  if(file instanceof File)providerForm.append('file',file,file.name)
  else providerForm.append('file_url',fileUrl)
  const result=await fansApiRequest(`https://api.fansapi.com/api/${encodeURIComponent(context.accountId)}/media/vault`,context.apiKey,{method:'POST',body:providerForm})
  if(!result.response.ok)return NextResponse.json({error:'Fans API no pudo guardar el archivo en el vault.',provider:result.payload},{status:result.response.status})
  return NextResponse.json({ok:true,data:result.payload})
}
