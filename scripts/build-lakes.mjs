import { createReadStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { resolve } from "node:path";

const input = resolve(process.argv[2] || "tmp/fishing.geojsonseq");
const output = resolve(process.argv[3] || "data/lakes.generated.json");
const metadataOutput = resolve(process.argv[4] || "data/catalog-meta.json");
const syncedAt = new Date().toISOString();

if (!existsSync(input)) throw new Error(`Fișierul de intrare nu există: ${input}`);

const fishingWords = /pesc|fishing|fishery|balta|baltă|iaz|heleșteu|helesteu|piscicol|acvacultur|aquaculture/i;
const discardWords = /stație|statie|canalizare|epurare|rezervor apă|castel de apă|depozit|carieră|cariera/i;
const genericNames = /^(lac|balta|baltă|iaz|heleșteu|helesteu|acumulare|pescărie|pescarie)$/i;

function clean(value) {
  return typeof value === "string" && value.trim() ? value.trim().replace(/\s+/g, " ") : null;
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ro")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function asCenter(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point") return geometry.coordinates;
  const points = [];
  const walk = (coords) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") points.push(coords);
    else coords.forEach(walk);
  };
  walk(geometry.coordinates);
  if (!points.length) return null;
  const sum = points.reduce((acc, [lon, lat]) => [acc[0] + lon, acc[1] + lat], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function tokenSimilarity(a, b) {
  const left = new Set(normalizeName(a).split(" ").filter(Boolean));
  const right = new Set(normalizeName(b).split(" ").filter(Boolean));
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / Math.max(left.size, right.size);
}

function classify(tags, name) {
  let score = 0;
  const labels = [];
  let category = "water";

  if (tags.leisure === "fishing" || tags.amenity === "fishing" || tags.sport === "fishing" || tags.fishing === "yes") {
    score += 100;
    labels.push("Loc de pescuit");
    category = "fishing";
  }
  if (tags.landuse === "aquaculture") {
    score += 74;
    labels.push("Amenajare piscicolă");
    category = category === "fishing" ? category : "aquaculture";
  }
  if (tags.water === "pond") {
    score += 24;
    labels.push("Iaz");
    if (category === "water") category = "pond";
  }
  if (tags.water === "reservoir") {
    score += 12;
    labels.push("Acumulare");
    if (category === "water") category = "reservoir";
  }
  if (fishingWords.test(name || "")) score += 38;
  if (tags.website || tags["contact:website"]) score += 16;
  if (tags.phone || tags["contact:phone"]) score += 16;
  if (tags.opening_hours) score += 8;
  if (tags.name) score += 8;
  if (genericNames.test(name || "")) score -= 10;
  if (discardWords.test(name || "")) score -= 120;

  const qualityScore = Math.max(0, Math.min(100, score));
  const confidence = qualityScore >= 90 && (tags.website || tags.phone || tags["contact:website"] || tags["contact:phone"])
    ? "verified"
    : qualityScore >= 60
      ? "likely"
      : "limited";

  return { score, qualityScore, labels: [...new Set(labels)], category, confidence };
}

function detectModes(tags) {
  const text = Object.entries(tags).map(([key, value]) => `${key}=${value}`).join(" ").toLocaleLowerCase("ro");
  const modes = [];
  if (/catch.?and.?release|no.?kill|fara retinere|fără reținere|eliberare obligatorie/.test(text)) modes.push("catch-release");
  if (/cu retinere|cu reținere|retinere permisa|reținere permisă|harvest|keep fish/.test(text)) modes.push("retention");
  return modes;
}

const candidates = [];
const stats = { parsed: 0, rejectedUnnamed: 0, rejectedLowScore: 0, rejectedInvalidGeometry: 0, duplicates: 0 };
const inputStream = createReadStream(input, { encoding: "utf8" });
const reader = createInterface({ input: inputStream, crlfDelay: Infinity });

for await (let line of reader) {
  line = line.replace(/^\x1e/, "").trim();
  if (!line) continue;
  let feature;
  try { feature = JSON.parse(line); } catch { continue; }
  stats.parsed += 1;

  const tags = feature.properties || {};
  const name = clean(tags["name:ro"] || tags.name || tags["official_name"]);
  if (!name) {
    stats.rejectedUnnamed += 1;
    continue;
  }

  const classification = classify(tags, name);
  if (classification.score < 45) {
    stats.rejectedLowScore += 1;
    continue;
  }

  const center = asCenter(feature.geometry);
  if (!center) {
    stats.rejectedInvalidGeometry += 1;
    continue;
  }
  const [longitude, latitude] = center;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 43 || latitude > 49 || longitude < 20 || longitude > 30) {
    stats.rejectedInvalidGeometry += 1;
    continue;
  }

  const osmType = clean(tags.osm_type) || clean(feature.id?.split?.("/")?.[0]) || "object";
  const osmId = clean(tags.osm_id?.toString()) || clean(feature.id?.split?.("/")?.[1]) || String(candidates.length + 1);
  candidates.push({
    id: `osm-${osmType}-${osmId}`,
    name,
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
    locality: clean(tags["addr:city"] || tags["addr:village"] || tags["addr:place"] || tags["is_in:city"]),
    county: clean(tags["addr:county"] || tags["is_in:county"]),
    modes: detectModes(tags),
    phone: clean(tags.phone || tags["contact:phone"]),
    website: clean(tags.website || tags["contact:website"]),
    openingHours: clean(tags.opening_hours),
    source: "OpenStreetMap",
    sourceUrl: `https://www.openstreetmap.org/${osmType}/${osmId}`,
    confidence: classification.confidence,
    qualityScore: classification.qualityScore,
    category: classification.category,
    lastSyncedAt: syncedAt,
    osmTags: classification.labels,
    _score: classification.score,
  });
}

const sorted = candidates.sort((a, b) => b._score - a._score || a.name.localeCompare(b.name, "ro"));
const deduped = [];
for (const lake of sorted) {
  const duplicateIndex = deduped.findIndex((existing) => {
    const distance = haversineKm(existing, lake);
    if (distance > 0.45) return false;
    const similarity = tokenSimilarity(existing.name, lake.name);
    return normalizeName(existing.name) === normalizeName(lake.name) || similarity >= 0.7;
  });

  if (duplicateIndex >= 0) {
    stats.duplicates += 1;
    const existing = deduped[duplicateIndex];
    if (lake._score > existing._score) deduped[duplicateIndex] = lake;
    continue;
  }
  deduped.push(lake);
}

for (const lake of deduped) delete lake._score;

const metadata = {
  generatedAt: syncedAt,
  source: "OpenStreetMap via Geofabrik",
  total: deduped.length,
  confidence: {
    verified: deduped.filter((lake) => lake.confidence === "verified").length,
    likely: deduped.filter((lake) => lake.confidence === "likely").length,
    limited: deduped.filter((lake) => lake.confidence === "limited").length,
  },
  categories: Object.fromEntries([...new Set(deduped.map((lake) => lake.category))].sort().map((category) => [category, deduped.filter((lake) => lake.category === category).length])),
  diagnostics: stats,
};

mkdirSync(resolve(output, ".."), { recursive: true });
writeFileSync(output, `${JSON.stringify(deduped, null, 2)}\n`, "utf8");
writeFileSync(metadataOutput, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
console.log(`Generate: ${deduped.length} locații în ${output}`);
console.log(`Duplicate eliminate: ${stats.duplicates}`);
