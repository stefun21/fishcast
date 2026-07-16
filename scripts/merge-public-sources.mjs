import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [osmPath, naturalPath, reservoirPath, wikidataPath, outputPath, metaPath] = process.argv.slice(2).map(resolve);
const syncedAt = new Date().toISOString();

function readJson(path, fallback) {
  if (!path || !existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function clean(value) {
  return typeof value === "string" && value.trim() ? value.trim().replace(/\s+/g, " ") : null;
}

function normalizeName(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hashId(source, name, lat, lon) {
  return createHash("sha1").update(`${source}|${normalizeName(name)}|${lat.toFixed(5)}|${lon.toFixed(5)}`).digest("hex").slice(0, 16);
}

function centerOfGeometry(geometry) {
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

function propertyName(properties = {}) {
  const directKeys = ["name", "NAME", "Name", "denumire", "DENUMIRE", "Denumire", "nume", "NUME", "Nume", "den_lac", "DEN_LAC", "lac", "LAC"];
  for (const key of directKeys) {
    const value = clean(properties[key]);
    if (value) return value;
  }
  for (const [key, value] of Object.entries(properties)) {
    if (/denum|nume|name|lac/i.test(key)) {
      const cleaned = clean(value);
      if (cleaned && cleaned.length < 140) return cleaned;
    }
  }
  return null;
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

function similarity(a, b) {
  const left = new Set(normalizeName(a).split(" ").filter(Boolean));
  const right = new Set(normalizeName(b).split(" ").filter(Boolean));
  if (!left.size || !right.size) return 0;
  let common = 0;
  for (const token of left) if (right.has(token)) common += 1;
  return common / Math.max(left.size, right.size);
}

function fromOfficialGeoJson(path, category, label, sourceUrl) {
  const geo = readJson(path, { features: [] });
  const features = Array.isArray(geo.features) ? geo.features : [];
  const rows = [];
  for (const feature of features) {
    const name = propertyName(feature.properties || {});
    const center = centerOfGeometry(feature.geometry);
    if (!name || !center) continue;
    const [longitude, latitude] = center;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 43 || latitude > 49 || longitude < 20 || longitude > 30) continue;
    rows.push({
      id: `ro-water-${hashId(label, name, latitude, longitude)}`,
      name,
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
      locality: null,
      county: null,
      modes: [],
      phone: null,
      website: null,
      openingHours: null,
      source: label,
      sourceUrl,
      confidence: "likely",
      qualityScore: category === "reservoir" ? 56 : 52,
      category,
      lastSyncedAt: syncedAt,
      osmTags: [category === "reservoir" ? "Lac de acumulare" : "Lac natural"],
    });
  }
  return rows;
}

function fromWikidata(path) {
  const data = readJson(path, { results: { bindings: [] } });
  const bindings = data?.results?.bindings || [];
  const rows = [];
  for (const row of bindings) {
    const name = clean(row.itemLabel?.value);
    const point = row.coord?.value?.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
    if (!name || !point) continue;
    const longitude = Number(point[1]);
    const latitude = Number(point[2]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 43 || latitude > 49 || longitude < 20 || longitude > 30) continue;
    const qid = row.item?.value?.split("/").pop();
    rows.push({
      id: `wikidata-${qid || hashId("wikidata", name, latitude, longitude)}`,
      name,
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
      locality: null,
      county: null,
      modes: [],
      phone: null,
      website: clean(row.website?.value),
      openingHours: null,
      source: "Wikidata",
      sourceUrl: qid ? `https://www.wikidata.org/wiki/${qid}` : null,
      confidence: "likely",
      qualityScore: 58,
      category: "water",
      lastSyncedAt: syncedAt,
      osmTags: ["Lac documentat public"],
    });
  }
  return rows;
}

function richness(item) {
  return (item.qualityScore || 0) + (item.website ? 10 : 0) + (item.phone ? 10 : 0) + (item.openingHours ? 5 : 0) + (item.locality ? 3 : 0) + (item.county ? 3 : 0);
}

function mergeRecords(primary, secondary) {
  const winner = richness(primary) >= richness(secondary) ? primary : secondary;
  const other = winner === primary ? secondary : primary;
  return {
    ...other,
    ...winner,
    modes: [...new Set([...(primary.modes || []), ...(secondary.modes || [])])],
    osmTags: [...new Set([...(primary.osmTags || []), ...(secondary.osmTags || [])])],
    source: [...new Set([primary.source, secondary.source].filter(Boolean))].join(" + "),
    sourceUrl: winner.sourceUrl || other.sourceUrl || null,
    qualityScore: Math.max(primary.qualityScore || 0, secondary.qualityScore || 0),
    confidence: primary.confidence === "verified" || secondary.confidence === "verified" ? "verified" : "likely",
  };
}

const osm = readJson(osmPath, []);
const natural = fromOfficialGeoJson(naturalPath, "water", "Apele Române — lacuri naturale", "https://data.gov.ro/dataset/hidrografie");
const reservoirs = fromOfficialGeoJson(reservoirPath, "reservoir", "Apele Române — lacuri de acumulare", "https://data.gov.ro/dataset/hidrografie");
const wikidata = fromWikidata(wikidataPath);
const all = [...osm, ...natural, ...reservoirs, ...wikidata].filter((item) => item?.name && Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
all.sort((a, b) => richness(b) - richness(a));

const merged = [];
let duplicates = 0;
for (const candidate of all) {
  const index = merged.findIndex((existing) => {
    const distance = haversineKm(existing, candidate);
    if (distance > 1.2) return false;
    return normalizeName(existing.name) === normalizeName(candidate.name) || similarity(existing.name, candidate.name) >= 0.66;
  });
  if (index >= 0) {
    merged[index] = mergeRecords(merged[index], candidate);
    duplicates += 1;
  } else {
    merged.push(candidate);
  }
}

merged.sort((a, b) => a.name.localeCompare(b.name, "ro"));
const sourceCounts = {};
for (const item of merged) {
  for (const source of String(item.source || "Necunoscut").split(" + ")) sourceCounts[source] = (sourceCounts[source] || 0) + 1;
}

const metadata = {
  generatedAt: syncedAt,
  source: "Catalog multi-sursă: OpenStreetMap, Apele Române/data.gov.ro și Wikidata",
  total: merged.length,
  confidence: {
    verified: merged.filter((lake) => lake.confidence === "verified").length,
    likely: merged.filter((lake) => lake.confidence === "likely").length,
    limited: merged.filter((lake) => lake.confidence === "limited").length,
  },
  categories: Object.fromEntries([...new Set(merged.map((lake) => lake.category))].sort().map((category) => [category, merged.filter((lake) => lake.category === category).length])),
  diagnostics: {
    input: { osm: osm.length, natural: natural.length, reservoirs: reservoirs.length, wikidata: wikidata.length },
    duplicates,
    sources: sourceCounts,
  },
};

mkdirSync(resolve(outputPath, ".."), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
writeFileSync(metaPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
console.log(`Catalog final: ${merged.length} locații (${duplicates} duplicate unite).`);
console.log(metadata.diagnostics.input);
