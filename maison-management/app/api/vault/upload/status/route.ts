import { NextResponse } from 'next/server'
import { fansApiRequest, getFansApiContext } from '@/lib/fans-api'

export const runtime='nodejs'

export async function GET(request:Request){
 const {searchParams}=new URL(request.url)
 const modelId=searchParams.get('modelId')||''
 const pollingUrl=searchParams.get('pollingUrl')||''
 if(!/^[0-9a-f-]{36}$/i.test(modelId)||!pollingUrl)return NextResponse.json({error:'Modelo o URL de seguimiento no válidos.'},{status:400})
 const context=await getFansApiContext(request,modelId)
 if('error' in context)return context.error
 if(!('accountId' in context))return NextResponse.json({error:'Cuenta no disponible.'},{status:409})
 let url:URL
 try{url=new URL(pollingUrl,'https://api.fansapi.com')}catch{return NextResponse.json({error:'URL de seguimiento no válida.'},{status:400})}
 const expectedPrefix='/api/'+encodeURIComponent(context.accountId)+'/media/upload/'
 if(!['api.fansapi.com','app.onlyfansapi.com'].includes(url.hostname)||url.protocol!=='https:'||!url.pathname.startsWith(expectedPrefix)||!url.pathname.endsWith('/status')){
  return NextResponse.json({error:'La URL de seguimiento no corresponde a esta cuenta.'},{status:400})
 }
 url.hostname='api.fansapi.com'
 const result=await fansApiRequest(url.toString(),context.apiKey)
 if(!result.response.ok)return NextResponse.json({error:'No se pudo consultar el estado de la carga.',provider:result.payload},{status:result.response.status})
 return NextResponse.json(result.payload)
}
