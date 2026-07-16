import fs from 'node:fs/promises'
import path from 'node:path'

const endpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter'
]
const query = `[out:json][timeout:180];area["ISO3166-1"="RO"][admin_level=2]->.ro;(nwr["leisure"="fishing"](area.ro);nwr["sport"="fishing"](area.ro);nwr["fishing"="yes"](area.ro);nwr["landuse"="aquaculture"]["name"](area.ro);nwr["water"="pond"]["fishing"](area.ro););out center tags meta;`

function slugify(text) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
function cleanUrl(value) { if (!value) return null; try { return new URL(value.startsWith('http') ? value : `https://${value}`).toString() } catch { return null } }
function modes(tags) {
  const text = [tags.fishing_mode, tags.catch_and_release, tags.description, tags.note].filter(Boolean).join(' ').toLowerCase()
  const result = []
  if (/catch.?and.?release|no.?kill|fara retinere|fără reținere/.test(text) || tags.catch_and_release === 'yes') result.push('catch-release')
  if (/cu retinere|cu reținere|retention|keep/.test(text) || tags.catch_and_release === 'no') result.push('retention')
  return result.length ? [...new Set(result)] : undefined
}
function confidence(tags) {
  let score = 0
  if (tags.name) score += 2
  if (tags.website || tags.contact_website) score += 2
  if (tags.phone || tags.contact_phone) score += 2
  if (tags.opening_hours) score += 1
  if (tags.operator) score += 1
  return score >= 5 ? 'community-confirmed' : 'unverified'
}
function point(element) { return element.type === 'node' ? [element.lat, element.lon] : [element.center?.lat, element.center?.lon] }
function normalize(element, now) {
  const tags = element.tags || {}
  const [latitude, longitude] = point(element)
  const name = tags.name || tags['name:ro'] || tags.operator
  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  const id = `osm-${element.type}-${element.id}`
  const website = cleanUrl(tags.website || tags.contact_website || tags.url)
  return {
    id, osmId: `${element.type}/${element.id}`, slug: `${slugify(name)}-${element.id}`, name,
    county: tags['addr:county'] || tags['is_in:county'] || undefined,
    locality: tags['addr:city'] || tags['addr:village'] || tags['addr:town'] || tags['is_in:city'] || undefined,
    latitude, longitude,
    description: tags.description || 'Locație de pescuit preluată automat din OpenStreetMap.',
    species: (tags.fish_species || tags.species || '').split(/[;,]/).map(v => v.trim()).filter(Boolean),
    fishingModes: modes(tags), openingHours: tags.opening_hours || undefined, priceInfo: tags.fee === 'no' ? 'Acces indicat ca gratuit în sursă' : undefined,
    phone: tags.phone || tags.contact_phone || null, website, facilities: [], verificationStatus: confidence(tags), verifiedAt: null,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`, sourceName: 'OpenStreetMap', lastSyncedAt: now
  }
}
function near(a, b) { const x = (a.latitude-b.latitude)*111; const y=(a.longitude-b.longitude)*79; return Math.hypot(x,y) < 0.12 }
function dedupe(items) {
  const result=[]
  for (const item of items.sort((a,b)=>a.name.localeCompare(b.name,'ro'))) {
    const duplicate=result.find(x=>x.name.toLowerCase()===item.name.toLowerCase() && near(x,item))
    if (!duplicate) result.push(item)
  }
  return result
}
async function fetchOverpass() {
  let last
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { method:'POST', headers:{'content-type':'application/x-www-form-urlencoded','user-agent':'FishCast-Romania/3.0 (GitHub Actions)'}, body:new URLSearchParams({data:query}), signal:AbortSignal.timeout(210000) })
      if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}`)
      return await response.json()
    } catch (error) { last=error; console.warn(String(error)) }
  }
  throw last || new Error('Niciun server Overpass nu a răspuns')
}
const payload = await fetchOverpass()
const now = new Date().toISOString()
const lakes = dedupe((payload.elements || []).map(el=>normalize(el,now)).filter(Boolean))
if (lakes.length < 10) throw new Error(`Import suspect: doar ${lakes.length} locații. Fișierul existent nu va fi suprascris.`)
const output = path.join(process.cwd(),'data','lakes.generated.json')
await fs.writeFile(output, JSON.stringify(lakes,null,2)+'\n')
console.log(`Sincronizare finalizată: ${lakes.length} locații.`)
