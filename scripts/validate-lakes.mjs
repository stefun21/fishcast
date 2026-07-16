import fs from 'node:fs/promises';

const FILE = 'data/lakes.generated.json';
const ALLOWED_MODES = new Set(['retention', 'catch-release']);
const ALLOWED_STATUSES = new Set(['unverified', 'community-confirmed', 'verified']);

function fail(message) {
  throw new Error(message);
}

const raw = await fs.readFile(FILE, 'utf8');
const lakes = JSON.parse(raw);

if (!Array.isArray(lakes)) fail(`${FILE} trebuie sa contina un array JSON.`);
if (lakes.length === 0) fail(`${FILE} este gol.`);

const ids = new Set();
const slugs = new Set();

for (const [index, lake] of lakes.entries()) {
  const location = `${FILE}[${index}]`;

  if (!lake || typeof lake !== 'object') fail(`${location}: obiect invalid.`);
  if (!lake.id || !lake.slug || !lake.name) fail(`${location}: lipsesc id, slug sau name.`);
  if (ids.has(lake.id)) fail(`${location}: id duplicat: ${lake.id}`);
  if (slugs.has(lake.slug)) fail(`${location}: slug duplicat: ${lake.slug}`);

  ids.add(lake.id);
  slugs.add(lake.slug);

  if (!Number.isFinite(lake.latitude) || lake.latitude < 43.4 || lake.latitude > 48.5) {
    fail(`${location}: latitudine invalida.`);
  }

  if (!Number.isFinite(lake.longitude) || lake.longitude < 20 || lake.longitude > 30.2) {
    fail(`${location}: longitudine invalida.`);
  }

  if (lake.fishingModes) {
    if (!Array.isArray(lake.fishingModes)) fail(`${location}: fishingModes trebuie sa fie array.`);
    for (const mode of lake.fishingModes) {
      if (!ALLOWED_MODES.has(mode)) fail(`${location}: fishingMode invalid: ${mode}`);
    }
  }

  if (!ALLOWED_STATUSES.has(lake.verificationStatus)) {
    fail(`${location}: verificationStatus invalid: ${lake.verificationStatus}`);
  }

  for (const key of ['website', 'sourceUrl']) {
    if (!lake[key]) continue;
    try {
      new URL(lake[key]);
    } catch {
      fail(`${location}: ${key} nu este URL valid.`);
    }
  }
}

console.log(`Validare reusita: ${lakes.length} locatii.`);
