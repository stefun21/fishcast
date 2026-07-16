import fs from 'node:fs/promises'
const files=['data/verified-lakes.json','data/lakes.generated.json']
const allowedModes=new Set(['retention','catch-release'])
let count=0
for (const file of files) {
  const data=JSON.parse(await fs.readFile(file,'utf8'))
  if (!Array.isArray(data)) throw new Error(`${file} nu conține un array`)
  const ids=new Set(), slugs=new Set()
  for (const [index,lake] of data.entries()) {
    const where=`${file}[${index}]`
    if (!lake.id || !lake.slug || !lake.name) throw new Error(`${where}: id/slug/name lipsă`)
    if (ids.has(lake.id) || slugs.has(lake.slug)) throw new Error(`${where}: ID sau slug duplicat`)
    ids.add(lake.id); slugs.add(lake.slug)
    if (!Number.isFinite(lake.latitude)||lake.latitude<43.4||lake.latitude>48.4||!Number.isFinite(lake.longitude)||lake.longitude<20||lake.longitude>30) throw new Error(`${where}: coordonate invalide`)
    if (lake.fishingModes && lake.fishingModes.some(mode=>!allowedModes.has(mode))) throw new Error(`${where}: fishingModes invalid`)
    for (const key of ['website','sourceUrl']) if (lake[key]) { try { new URL(lake[key]) } catch { throw new Error(`${where}: ${key} invalid`) } }
  }
  count += data.length
}
console.log(`Validare reușită: ${count} locații în fișiere.`)
