import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase'

function slugify(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}
export async function GET(req:NextRequest){
  const auth=req.headers.get('authorization'); if(process.env.CRON_SECRET&&auth!==`Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({error:'Unauthorized'},{status:401})
  const db=adminSupabase(); if(!db) return NextResponse.json({error:'Supabase nu este configurat'},{status:503})
  const query=`[out:json][timeout:120];area["ISO3166-1"="RO"][admin_level=2]->.ro;(nwr["leisure"="fishing"](area.ro);nwr["sport"="fishing"](area.ro););out center tags;`
  const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','user-agent':'FishCast-Romania/2.0'},body:new URLSearchParams({data:query})})
  if(!r.ok) return NextResponse.json({error:'Overpass indisponibil'},{status:502})
  const json=await r.json(); const rows=(json.elements||[]).map((e:any)=>{
    const lat=e.lat??e.center?.lat, longitude=e.lon??e.center?.lon, name=e.tags?.name
    if(!lat||!longitude||!name) return null
    return {external_id:`osm-${e.type}-${e.id}`,slug:`${slugify(name)}-${e.id}`,name,latitude:lat,longitude,county:e.tags?.['addr:county']||null,locality:e.tags?.['addr:city']||e.tags?.['addr:village']||null,website:e.tags?.website||e.tags?.contact_website||null,phone:e.tags?.phone||e.tags?.contact_phone||null,species:[],facilities:[],verification_status:'unverified',source_name:'OpenStreetMap',source_url:`https://www.openstreetmap.org/${e.type}/${e.id}`,last_seen_at:new Date().toISOString()}
  }).filter(Boolean)
  const {error}=await db.from('lakes').upsert(rows,{onConflict:'external_id',ignoreDuplicates:false})
  await db.from('sync_runs').insert({source:'openstreetmap',status:error?'failed':'success',items_found:rows.length,error_message:error?.message||null})
  if(error) return NextResponse.json({error:error.message},{status:500})
  return NextResponse.json({ok:true,imported:rows.length,note:'Locațiile noi sunt marcate neverificate până la confirmare.'})
}
