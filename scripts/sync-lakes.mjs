import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_FILE = path.join(process.cwd(), 'data', 'lakes.generated.json');
const MIN_RESULTS = 5;

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
];

// Bounding box aproximativ pentru Romania: sud, vest, nord, est.
const ROMANIA_BBOX = '43.55,20.20,48.30,29.80';

const OVERPASS_QUERY = `
[out:json][timeout:150];
(
  nwr["leisure"="fishing"](${ROMANIA_BBOX});
  nwr["sport"="fishing"](${ROMANIA_BBOX});
  nwr["fishing"="yes"](${ROMANIA_BBOX});
  nwr["landuse"="aquaculture"]["name"](${ROMANIA_BBOX});
  nwr["amenity"="fishing"](${ROMANIA_BBOX});
);
out center tags meta;
`;

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeUrl(value) {
  const candidate = text(value);
  if (!candidate) return undefined;

  try {
    return new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`).toString();
  } catch {
    return undefined;
  }
}

function coordinates(element) {
  if (element.type === 'node') {
    return { latitude: element.lat, longitude: element.lon };
  }

  return {
    latitude: element.center?.lat,
    longitude: element.center?.lon,
  };
}

function detectFishingModes(tags) {
  const searchable = [
    tags.fishing_mode,
    tags.catch_and_release,
    tags.description,
    tags.note,
    tags.rules,
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('ro');

  const modes = new Set();

  if (
    tags.catch_and_release === 'yes' ||
    /catch\s*(?:and|&)\s*release|no[ -]?kill|fara retinere|fără reținere/.test(searchable)
  ) {
    modes.add('catch-release');
  }

  if (
    tags.catch_and_release === 'no' ||
    /cu retinere|cu reținere|retention|fish may be kept/.test(searchable)
  ) {
    modes.add('retention');
  }

  return modes.size ? [...modes] : undefined;
}

function verificationStatus(tags) {
  let score = 0;
  if (text(tags.name) || text(tags['name:ro'])) score += 2;
  if (text(tags.website) || text(tags['contact:website'])) score += 2;
  if (text(tags.phone) || text(tags['contact:phone'])) score += 2;
  if (text(tags.opening_hours)) score += 1;
  if (text(tags.operator)) score += 1;

  return score >= 5 ? 'community-confirmed' : 'unverified';
}

function normalizeElement(element, syncedAt) {
  const tags = element.tags ?? {};
  const { latitude, longitude } = coordinates(element);
  const name = text(tags.name) ?? text(tags['name:ro']) ?? text(tags.operator);

  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const osmId = `${element.type}/${element.id}`;
  const sourceUrl = `https://www.openstreetmap.org/${osmId}`;
  const species = (text(tags.fish_species) ?? text(tags.species) ?? '')
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    id: `osm-${element.type}-${element.id}`,
    osmId,
    slug: `${slugify(name)}-${element.id}`,
    name,
    county: text(tags['addr:county']) ?? text(tags['is_in:county']),
    locality:
      text(tags['addr:city']) ??
      text(tags['addr:town']) ??
      text(tags['addr:village']) ??
      text(tags['is_in:city']),
    latitude,
    longitude,
    description:
      text(tags.description) ??
      'Locatie de pescuit importata automat din datele publice OpenStreetMap.',
    species,
    fishingModes: detectFishingModes(tags),
    openingHours: text(tags.opening_hours),
    priceInfo: tags.fee === 'no' ? 'Acces indicat ca gratuit in sursa' : undefined,
    phone: text(tags.phone) ?? text(tags['contact:phone']),
    website: normalizeUrl(tags.website ?? tags['contact:website'] ?? tags.url),
    facilities: [],
    verificationStatus: verificationStatus(tags),
    verifiedAt: null,
    sourceName: 'OpenStreetMap',
    sourceUrl,
    osmTimestamp: text(element.timestamp),
    lastSyncedAt: syncedAt,
  };
}

function distanceMeters(a, b) {
  const earthRadius = 6_371_000;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const deltaLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const deltaLng = ((b.longitude - a.longitude) * Math.PI) / 180;

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function deduplicate(items) {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, 'ro'));
  const result = [];

  for (const item of sorted) {
    const normalizedName = item.name.toLocaleLowerCase('ro');
    const duplicate = result.find(
      (existing) =>
        existing.name.toLocaleLowerCase('ro') === normalizedName &&
        distanceMeters(existing, item) <= 120,
    );

    if (!duplicate) result.push(item);
  }

  return result;
}

async function requestEndpoint(endpoint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 170_000);

  try {
    console.log(`Incerc serverul Overpass: ${endpoint}`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'user-agent': 'FishCast-Romania/1.0 (GitHub Actions sync)',
      },
      body: new URLSearchParams({ data: OVERPASS_QUERY }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchOverpass() {
  let lastError;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      return await requestEndpoint(endpoint);
    } catch (error) {
      lastError = error;
      console.warn(`Server indisponibil: ${endpoint}`);
      console.warn(error instanceof Error ? error.message : String(error));
    }
  }

  throw lastError ?? new Error('Niciun server Overpass nu a raspuns.');
}

async function main() {
  const payload = await fetchOverpass();
  const syncedAt = new Date().toISOString();
  const normalized = (payload.elements ?? [])
    .map((element) => normalizeElement(element, syncedAt))
    .filter(Boolean);
  const lakes = deduplicate(normalized);

  if (lakes.length < MIN_RESULTS) {
    throw new Error(
      `Import suspect: au fost gasite doar ${lakes.length} locatii. Fisierul existent nu este suprascris.`,
    );
  }

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(lakes, null, 2)}\n`, 'utf8');
  console.log(`Sincronizare finalizata: ${lakes.length} locatii salvate.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
