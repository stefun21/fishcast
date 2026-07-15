import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase'
import { seedLakes } from '@/lib/seed'
import { distanceKm } from '@/lib/geo'

export const revalidate = 300

export async function GET(req: NextRequest){
  const lat=Number(req.nextUrl.searchParams.get('lat')); const lng=Number(req.nextUrl.searchParams.get('lng'))
  const q=(req.nextUrl.searchParams.get('q')||'').toLowerCase().trim()
  const mode=req.nextUrl.searchParams.get('mode')
  let lakes=seedLakes
  const db=adminSupabase()
  if(db){
    const {data,error}=await db.from('lakes').select('*').neq('verification_status','possibly-closed').limit(5000)
    if(!error&&data?.length) lakes=data.map((r:any)=>({
      id:r.id,slug:r.slug,name:r.name,county:r.county,locality:r.locality,latitude:Number(r.latitude),longitude:Number(r.longitude),description:r.description,
      species:r.species||[],fishingModes:r.fishing_modes||undefined,openingHours:r.opening_hours,priceInfo:r.price_info,phone:r.phone,website:r.website,
      facilities:r.facilities||[],verificationStatus:r.verification_status,verifiedAt:r.verified_at,sourceUrl:r.source_url,sourceName:r.source_name,
      imageUrl:r.image_url,rating:r.rating?Number(r.rating):undefined,ratingCount:r.rating_count||undefined
    }))
  }
  if(q) lakes=lakes.filter(l=>[l.name,l.county,l.locality,...l.species].filter(Boolean).join(' ').toLowerCase().includes(q))
  if(mode==='retention'||mode==='catch-release') lakes=lakes.filter(l=>l.fishingModes?.includes(mode as any))
  const located=Number.isFinite(lat)&&Number.isFinite(lng)
  const result=lakes.map(l=>located?{...l,distanceKm:Number(distanceKm(lat,lng,l.latitude,l.longitude).toFixed(1))}:l)
    .sort((a,b)=>located?(a.distanceKm??99999)-(b.distanceKm??99999):a.name.localeCompare(b.name,'ro'))
  return NextResponse.json({lakes:result,source:db?'supabase':'demo'})
}
