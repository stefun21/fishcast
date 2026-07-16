import generated from '@/data/lakes.generated.json'
import verified from '@/data/verified-lakes.json'
import overrides from '@/data/overrides.json'
import type { Lake } from './types'

function normalizeLake(input: any): Lake {
  const patch = (overrides as Record<string, Partial<Lake>>)[input.id] || {}
  return { ...input, ...patch, species: patch.species ?? input.species ?? [], facilities: patch.facilities ?? input.facilities ?? [] } as Lake
}

function closeEnough(a: Lake, b: Lake) {
  const dLat = Math.abs(a.latitude - b.latitude)
  const dLng = Math.abs(a.longitude - b.longitude)
  return dLat < 0.002 && dLng < 0.002
}

export function getAllLakes(): Lake[] {
  const primary = (verified as unknown as Lake[]).map(normalizeLake)
  const auto = (generated as unknown as Lake[]).map(normalizeLake)
  const merged = [...primary]
  for (const item of auto) {
    const duplicate = merged.some(existing => existing.name.toLocaleLowerCase('ro') === item.name.toLocaleLowerCase('ro') && closeEnough(existing, item))
    if (!duplicate) merged.push(item)
  }
  return merged
}

export function getLakeBySlug(slug: string) {
  return getAllLakes().find(lake => lake.slug === slug)
}
