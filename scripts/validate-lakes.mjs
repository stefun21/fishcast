import fs from 'node:fs/promises';

const file = new URL('../data/lakes.generated.json', import.meta.url);
const data = JSON.parse(await fs.readFile(file, 'utf8'));

if (!Array.isArray(data)) throw new Error('lakes.generated.json must contain an array');
if (data.length < 10) throw new Error(`Too few locations: ${data.length}`);

const ids = new Set();
for (const [index, lake] of data.entries()) {
  if (!lake || typeof lake !== 'object') throw new Error(`Invalid item at index ${index}`);
  if (!lake.id || ids.has(lake.id)) throw new Error(`Missing or duplicate id at index ${index}`);
  ids.add(lake.id);
  if (!lake.name || typeof lake.name !== 'string') throw new Error(`Missing name for ${lake.id}`);
  if (!Number.isFinite(lake.latitude) || lake.latitude < 43 || lake.latitude > 49) throw new Error(`Invalid latitude for ${lake.id}`);
  if (!Number.isFinite(lake.longitude) || lake.longitude < 20 || lake.longitude > 31) throw new Error(`Invalid longitude for ${lake.id}`);
  if (!Array.isArray(lake.fishingModes)) throw new Error(`Invalid fishingModes for ${lake.id}`);
}

console.log(`Validation OK: ${data.length} locations, ${ids.size} unique ids.`);
