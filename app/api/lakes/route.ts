import { NextRequest, NextResponse } from 'next/server'
import { getAllLakes } from '@/lib/lakes'
import { distanceKm } from '@/lib/geo'

export const revalidate = 300

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'))
  const lng = Number(req.nextUrl.searchParams.get('lng'))
  const q = (req.nextUrl.searchParams.get('q') || '').toLocaleLowerCase('ro').trim()
  const mode = req.nextUrl.searchParams.get('mode')
  let lakes = getAllLakes()
  if (q) lakes = lakes.filter(lake => [lake.name, lake.county, lake.locality, ...(lake.species || [])].filter(Boolean).join(' ').toLocaleLowerCase('ro').includes(q))
  if (mode === 'retention' || mode === 'catch-release') lakes = lakes.filter(lake => lake.fishingModes?.includes(mode))
  const located = Number.isFinite(lat) && Number.isFinite(lng)
  const result = lakes.map(lake => located ? { ...lake, distanceKm: Number(distanceKm(lat, lng, lake.latitude, lake.longitude).toFixed(1)) } : lake)
    .sort((a, b) => located ? (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) : a.name.localeCompare(b.name, 'ro'))
  return NextResponse.json({ lakes: result, source: 'OpenStreetMap + date publice verificate', updatedAt: new Date().toISOString() })
}
