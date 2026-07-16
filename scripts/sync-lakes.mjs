import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'lakes.generated.json');
const STATE_FILE = path.join(DATA_DIR, '.sync-state.json');
const TMP_FILE = path.join(DATA_DIR, '.lakes.partial.json');

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter'
];

// Romania split into smaller boxes to avoid one huge, fragile request.
const BOXES = [
  ['NW-1', 46.8, 20.2, 48.3, 22.9],
  ['NW-2', 46.8, 22.9, 48.3, 25.0],
  ['N-1', 46.8, 25.0, 48.3, 27.5],
  ['NE', 46.8, 27.5, 48.3, 30.2],
  ['W-1', 45.2, 20.2, 46.8, 22.9],
  ['CENTER-1', 45.2, 22.9, 46.8, 25.0],
  ['CENTER-2', 45.2, 25.0, 46.8, 27.5],
  ['E-1', 45.2, 27.5, 46.8, 30.2],
  ['SW', 43.55, 20.2, 45.2, 23.8],
  ['S-CENTER', 43.55, 23.8, 45.2, 26.0],
  ['SE-1', 43.55, 26.0, 45.2, 28.0],
  ['SE-2', 43.55, 28.0, 45.2, 30.2]
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildQuery([, south, west, north, east]) {
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:35];
(
  nwr["leisure"="fishing"](${bbox});
  nwr["sport"="fishing"](${bbox});
  nwr["fishing"="yes"](${bbox});
  nwr["landuse"="aquaculture"](${bbox});
  nwr["amenity"="fishing"](${bbox});
);
out center tags;`;
}

async function fetchWithTimeout(url, options, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function queryOverpass(box) {
  const query = buildQuery(box);
  let lastError;

  for (let attempt = 1; attempt <= 6; attempt++) {
    const endpoint = ENDPOINTS[(attempt - 1) % ENDPOINTS.length];
    try {
      console.log(`[${box[0]}] attempt ${attempt}/6 via ${new URL(endpoint).host}`);
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'user-agent': 'FishCast-Romania/1.0 (manual data sync)'
        },
        body: new URLSearchParams({ data: query })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      if (!Array.isArray(json.elements)) {
        throw new Error('Invalid Overpass response');
      }
      return json.elements;
    } catch (error) {
      lastError = error;
      console.warn(`[${box[0]}] failed: ${error.message}`);
      await sleep(Math.min(30000, attempt * 5000));
    }
  }

  throw new Error(`[${box[0]}] all endpoints failed: ${lastError?.message ?? 'unknown error'}`);
}

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeUrl(value) {
  const raw = text(value);
  if (!raw) return null;
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).toString();
  } catch {
    return null;
  }
}

function coordinates(element) {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { latitude: Number(lat), longitude: Number(lon) };
}

function sourceUrl(element) {
  return `https://www.openstreetmap.org/${element.type}/${element.id}`;
}

function modeFromTags(tags = {}) {
  const haystack = Object.entries(tags)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ')
    .toLowerCase();

  const modes = [];
  if (/catch.?and.?release|catch.?release|no.?kill|fara retinere|fără reținere/.test(haystack)) {
    modes.push('catch-release');
  }
  if (/retention|keep.?fish|cu retinere|cu reținere/.test(haystack)) {
    modes.push('retention');
  }
  return [...new Set(modes)];
}

function confidence(tags = {}) {
  let score = 0;
  if (text(tags.name)) score += 2;
  if (text(tags.phone) || text(tags['contact:phone'])) score += 2;
  if (text(tags.website) || text(tags['contact:website'])) score += 2;
  if (text(tags.opening_hours)) score += 1;
  if (text(tags.operator)) score += 1;
  if (text(tags.description)) score += 1;
  if (score >= 6) return 'strong';
  if (score >= 3) return 'medium';
  return 'limited';
}

function mapElement(element) {
  const coords = coordinates(element);
  if (!coords) return null;
  const tags = element.tags ?? {};
  const name = text(tags.name) ?? text(tags.operator) ?? `Loc de pescuit OSM ${element.id}`;

  return {
    id: `osm-${element.type}-${element.id}`,
    osmType: element.type,
    osmId: element.id,
    name,
    latitude: coords.latitude,
    longitude: coords.longitude,
    locality: text(tags['addr:city']) ?? text(tags['addr:place']) ?? text(tags['addr:village']),
    county: text(tags['addr:county']),
    phone: text(tags.phone) ?? text(tags['contact:phone']),
    website: normalizeUrl(tags.website ?? tags['contact:website']),
    openingHours: text(tags.opening_hours),
    operator: text(tags.operator),
    description: text(tags.description),
    fishingModes: modeFromTags(tags),
    confidence: confidence(tags),
    source: 'OpenStreetMap',
    sourceUrl: sourceUrl(element),
    lastSyncedAt: new Date().toISOString()
  };
}

function round(value, decimals = 5) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function deduplicate(items) {
  const byId = new Map();
  for (const item of items) byId.set(item.id, item);

  const seen = new Set();
  const result = [];
  for (const item of byId.values()) {
    const key = `${item.name.toLowerCase().replace(/\s+/g, ' ').trim()}|${round(item.latitude, 4)}|${round(item.longitude, 4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, 'ro'));
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const state = await readJson(STATE_FILE, { completed: [] });
  const partial = await readJson(TMP_FILE, []);
  const all = Array.isArray(partial) ? partial : [];

  console.log(`Resume state: ${state.completed.length}/${BOXES.length} boxes complete.`);

  for (const box of BOXES) {
    if (state.completed.includes(box[0])) {
      console.log(`[${box[0]}] skipped (already complete)`);
      continue;
    }

    const elements = await queryOverpass(box);
    const mapped = elements.map(mapElement).filter(Boolean);
    all.push(...mapped);

    state.completed.push(box[0]);
    await fs.writeFile(TMP_FILE, JSON.stringify(all, null, 2));
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`[${box[0]}] ${mapped.length} imported; partial total ${all.length}`);
    await sleep(3000);
  }

  const cleaned = deduplicate(all);
  if (cleaned.length < 10) {
    throw new Error(`Safety stop: only ${cleaned.length} locations were found.`);
  }

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(cleaned, null, 2) + '\n');
  await fs.rm(TMP_FILE, { force: true });
  await fs.rm(STATE_FILE, { force: true });

  console.log(`Done. ${cleaned.length} unique locations written to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  console.error('The partial state was preserved. Run the command again to resume.');
  process.exitCode = 1;
});
