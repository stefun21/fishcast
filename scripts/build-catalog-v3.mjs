import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { basename, dirname, resolve } from "node:path";

const args = process.argv.slice(2);
const options = Object.fromEntries(args.map((value, index) => value.startsWith("--") ? [value.slice(2), args[index + 1]] : null).filter(Boolean));

const osmPath = resolve(options.osm || "tmp/waters.geojsonseq");
const naturalPath = resolve(options.natural || "tmp/natural.geojson");
const reservoirsPath = resolve(options.reservoirs || "tmp/reservoirs.geojson");
const surfacePath = resolve(options.surface || "tmp/surface.geojson");
const wikidataPath = resolve(options.wikidata || "tmp/wikidata.json");
const anpaPath = resolve(options.anpa || "tmp/anpa-text.txt");
const outputPath = resolve(options.output || "data/lakes.generated.json");
const metaPath = resolve(options.meta || "data/catalog-meta.json");
const maxItems = Math.max(500, Math.min(Number(options.max || 8000), 15000));
const minItems = Math.max(1, Math.min(Number(options.min || 25), 500));
const syncedAt = new Date().toISOString();

const ROMANIA_BOUNDS = { minLat: 43.35, maxLat: 48.35, minLon: 20.15, maxLon: 30.25 };
const fishingWords = /pesc|fishing|fishery|balta|baltă|iaz|heleșteu|helesteu|piscicol|acvacultur|aquaculture/i;
const discardWords = /stație|statie|canalizare|epurare|rezervor apă|castel de apă|depozit|carieră|cariera|piscină|piscina|fântână|fantana|decantare|industrial/i;
const genericWaterName = /^(lac|balta|baltă|iaz|heleșteu|helesteu|acumulare|rezervor|corp de apă|water)$/i;

function readJson(path, fallback) {
  if (!path || !existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function clean(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text && !/^(null|undefined|n\/a|-|0)$/i.test(text) ? text : null;
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ro")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugWords(value) {
  return normalize(value).split(" ").filter((word) => word.length > 2 && !["lac", "lacul", "balta", "iaz", "romania"].includes(word));
}

function hashId(...parts) {
  return createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 16);
}

function inRomania(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= ROMANIA_BOUNDS.minLat && latitude <= ROMANIA_BOUNDS.maxLat
    && longitude >= ROMANIA_BOUNDS.minLon && longitude <= ROMANIA_BOUNDS.maxLon;
}

function centerOfGeometry(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) return geometry.coordinates;
  const points = [];
  const walk = (coords) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") points.push(coords);
    else for (const child of coords) walk(child);
  };
  walk(geometry.coordinates);
  if (!points.length) return null;
  const stride = Math.max(1, Math.floor(points.length / 250));
  let lon = 0; let lat = 0; let count = 0;
  for (let index = 0; index < points.length; index += stride) {
    lon += points[index][0]; lat += points[index][1]; count += 1;
  }
  return count ? [lon / count, lat / count] : null;
}

function haversineKm(a, b) {
  const radius = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const lat1 = a.latitude * rad;
  const lat2 = b.latitude * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function tokenSimilarity(a, b) {
  const left = new Set(slugWords(a));
  const right = new Set(slugWords(b));
  if (!left.size || !right.size) return 0;
  let common = 0;
  for (const token of left) if (right.has(token)) common += 1;
  return common / Math.max(left.size, right.size);
}

function firstProperty(properties, patterns) {
  for (const [key, value] of Object.entries(properties || {})) {
    if (patterns.some((pattern) => pattern.test(key))) {
      const result = clean(value);
      if (result) return result;
    }
  }
  return null;
}

function propertyName(properties = {}) {
  const preferred = ["name", "NAME", "Name", "denumire", "DENUMIRE", "Denumire", "nume", "NUME", "Nume", "den_lac", "DEN_LAC", "WB_NAME", "waterbody", "DENUMIRE_L"];
  for (const key of preferred) {
    const result = clean(properties[key]);
    if (result && result.length < 160) return result;
  }
  return firstProperty(properties, [/denum/i, /^nume/i, /name/i, /lac/i, /water.*name/i]);
}

function propertyCode(properties = {}) {
  return firstProperty(properties, [/^id$/i, /cod/i, /code/i, /objectid/i, /fid/i, /siruta/i]);
}

function modeTags(tags) {
  const text = normalize(Object.entries(tags || {}).map(([key, value]) => `${key} ${value}`).join(" "));
  const modes = [];
  if (/catch and release|catch release|no kill|fara retinere|eliberare obligatorie/.test(text)) modes.push("catch-release");
  if (/cu retinere|retinere permisa|harvest|keep fish/.test(text)) modes.push("retention");
  return modes;
}

function osmClassification(tags, name, explicitName) {
  let score = 0;
  let category = "water";
  const labels = [];
  const fishing = tags.leisure === "fishing" || tags.amenity === "fishing" || tags.sport === "fishing" || tags.fishing === "yes";
  const aquaculture = tags.landuse === "aquaculture" || Boolean(tags.aquaculture);
  const pond = tags.water === "pond";
  const reservoir = tags.water === "reservoir" || tags.landuse === "reservoir";

  if (fishing) { score += 100; category = "fishing"; labels.push("Loc de pescuit cartografiat"); }
  if (aquaculture) { score += 78; if (!fishing) category = "aquaculture"; labels.push("Amenajare piscicolă"); }
  if (pond) { score += 34; if (category === "water") category = "pond"; labels.push("Iaz"); }
  if (reservoir) { score += 31; if (category === "water") category = "reservoir"; labels.push("Lac de acumulare"); }
  if (tags.water === "lake") { score += 26; labels.push("Lac"); }
  if (tags.natural === "water") score += 12;
  if (explicitName) score += 24;
  if (fishingWords.test(name || "")) score += 30;
  if (tags.website || tags["contact:website"]) score += 14;
  if (tags.phone || tags["contact:phone"]) score += 14;
  if (tags.opening_hours) score += 7;
  if (tags.access === "private" || tags.access === "customers" || tags.access === "permit") score += 5;
  if (discardWords.test(name || "")) score -= 150;
  if (genericWaterName.test(name || "")) score -= 8;

  const qualityScore = Math.max(20, Math.min(100, score));
  const confidence = fishing && (tags.website || tags.phone || tags["contact:website"] || tags["contact:phone"])
    ? "verified"
    : score >= 60 ? "likely" : "limited";

  return { score, qualityScore, confidence, category, labels: [...new Set(labels)] };
}

async function parseOsm() {
  if (!existsSync(osmPath)) return [];
  const rows = [];
  const reader = createInterface({ input: createReadStream(osmPath, { encoding: "utf8" }), crlfDelay: Infinity });
  let sequence = 0;
  for await (let line of reader) {
    line = line.replace(/^\x1e/, "").trim();
    if (!line) continue;
    let feature;
    try { feature = JSON.parse(line); } catch { continue; }
    const tags = feature.properties || {};
    const center = centerOfGeometry(feature.geometry);
    if (!center) continue;
    const longitude = Number(center[0]);
    const latitude = Number(center[1]);
    if (!inRomania(latitude, longitude)) continue;

    const typeFromId = String(feature.id || "").split("/")[0] || clean(tags.osm_type) || "object";
    const idFromFeature = String(feature.id || "").split("/")[1] || clean(tags.osm_id) || String(++sequence);
    const explicitName = clean(tags["name:ro"] || tags.name || tags.official_name || tags.alt_name || tags.operator);
    const preliminary = osmClassification(tags, explicitName, Boolean(explicitName));
    const highSignal = preliminary.category === "fishing" || preliminary.category === "aquaculture";
    if (!explicitName && !highSignal) continue;
    const name = explicitName || (preliminary.category === "fishing" ? `Loc de pescuit cartografiat #${idFromFeature}` : `Amenajare piscicolă #${idFromFeature}`);
    if (preliminary.score < 24) continue;

    rows.push({
      id: `osm-${typeFromId}-${idFromFeature}`,
      name,
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
      locality: clean(tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || tags["addr:place"] || tags["is_in:city"]),
      county: clean(tags["addr:county"] || tags["is_in:county"]),
      modes: modeTags(tags),
      phone: clean(tags.phone || tags["contact:phone"]),
      website: clean(tags.website || tags["contact:website"]),
      openingHours: clean(tags.opening_hours),
      source: "OpenStreetMap / Geofabrik",
      sourceUrl: `https://www.openstreetmap.org/${typeFromId}/${idFromFeature}`,
      confidence: preliminary.confidence,
      qualityScore: preliminary.qualityScore,
      category: preliminary.category,
      lastSyncedAt: syncedAt,
      osmTags: preliminary.labels,
      _priority: preliminary.score + (explicitName ? 10 : 0),
    });
  }
  return rows;
}

function officialRows(path, source, sourceUrl, fallbackCategory, fallbackLabel) {
  const data = readJson(path, { features: [] });
  const features = Array.isArray(data.features) ? data.features : [];
  return features.flatMap((feature, index) => {
    const center = centerOfGeometry(feature.geometry);
    if (!center) return [];
    const longitude = Number(center[0]);
    const latitude = Number(center[1]);
    if (!inRomania(latitude, longitude)) return [];
    const properties = feature.properties || {};
    const explicitName = propertyName(properties);
    const code = propertyCode(properties) || String(index + 1);
    const categoryText = normalize(Object.values(properties).join(" "));
    const category = /acumul|reservoir|baraj/.test(categoryText) ? "reservoir" : fallbackCategory;
    const name = explicitName || `${fallbackLabel} #${code}`;
    return [{
      id: `official-${hashId(source, name, latitude.toFixed(5), longitude.toFixed(5))}`,
      name,
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
      locality: firstProperty(properties, [/localit/i, /uat/i, /municip/i, /oras/i, /comun/i]),
      county: firstProperty(properties, [/judet/i, /county/i]),
      modes: [], phone: null, website: null, openingHours: null,
      source, sourceUrl,
      confidence: explicitName ? "likely" : "limited",
      qualityScore: explicitName ? (category === "reservoir" ? 61 : 57) : 43,
      category,
      lastSyncedAt: syncedAt,
      osmTags: [category === "reservoir" ? "Lac de acumulare oficial" : "Corp de apă oficial"],
      _priority: explicitName ? 58 : 34,
    }];
  });
}

function wikidataRows() {
  const data = readJson(wikidataPath, { results: { bindings: [] } });
  const bindings = data?.results?.bindings || [];
  return bindings.flatMap((row) => {
    const name = clean(row.itemLabel?.value);
    const point = String(row.coord?.value || "").match(/Point\(([-\d.]+) ([-\d.]+)\)/);
    if (!name || !point) return [];
    const longitude = Number(point[1]);
    const latitude = Number(point[2]);
    if (!inRomania(latitude, longitude)) return [];
    const qid = String(row.item?.value || "").split("/").pop();
    return [{
      id: `wikidata-${qid || hashId(name, latitude, longitude)}`,
      name,
      latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)),
      locality: null, county: null, modes: [], phone: null,
      website: clean(row.website?.value), openingHours: null,
      source: "Wikidata", sourceUrl: qid ? `https://www.wikidata.org/wiki/${qid}` : null,
      confidence: "likely", qualityScore: 57, category: "water", lastSyncedAt: syncedAt,
      osmTags: ["Corp de apă documentat public"], _priority: 54,
    }];
  });
}

function anpaText() {
  if (!existsSync(anpaPath)) return "";
  return normalize(readFileSync(anpaPath, "utf8"));
}

function enrichWithAnpa(item, text) {
  if (!text || genericWaterName.test(item.name)) return item;
  const words = slugWords(item.name);
  if (!words.length) return item;
  const phrase = words.join(" ");
  const matched = phrase.length >= 6 && text.includes(phrase)
    || (words.length >= 2 && words.every((word) => text.includes(word)));
  if (!matched) return item;
  return {
    ...item,
    source: [...new Set([...(String(item.source || "").split(" + ").filter(Boolean)), "ANPA — habitate piscicole"] )].join(" + "),
    confidence: item.confidence === "verified" ? "verified" : "likely",
    qualityScore: Math.min(100, (item.qualityScore || 50) + 16),
    osmTags: [...new Set([...(item.osmTags || []), "Habitat piscicol ANPA"])],
    _priority: (item._priority || 0) + 18,
  };
}

function richness(item) {
  return (item._priority || 0) + (item.qualityScore || 0) + (item.website ? 12 : 0) + (item.phone ? 12 : 0) + (item.locality ? 5 : 0) + (item.county ? 5 : 0);
}

function mergeRecords(a, b) {
  const winner = richness(a) >= richness(b) ? a : b;
  const other = winner === a ? b : a;
  const sources = [...new Set([...String(a.source || "").split(" + "), ...String(b.source || "").split(" + ")].filter(Boolean))];
  return {
    ...other, ...winner,
    name: genericWaterName.test(winner.name) && !genericWaterName.test(other.name) ? other.name : winner.name,
    locality: winner.locality || other.locality || null,
    county: winner.county || other.county || null,
    modes: [...new Set([...(a.modes || []), ...(b.modes || [])])],
    osmTags: [...new Set([...(a.osmTags || []), ...(b.osmTags || [])])],
    source: sources.join(" + "),
    sourceUrl: winner.sourceUrl || other.sourceUrl || null,
    qualityScore: Math.max(a.qualityScore || 0, b.qualityScore || 0),
    confidence: a.confidence === "verified" || b.confidence === "verified" ? "verified" : a.confidence === "likely" || b.confidence === "likely" ? "likely" : "limited",
    _priority: Math.max(a._priority || 0, b._priority || 0) + 5,
  };
}

function isDuplicate(a, b) {
  const distance = haversineKm(a, b);
  if (distance > 1.1) return false;
  const exact = normalize(a.name) === normalize(b.name);
  const similar = tokenSimilarity(a.name, b.name) >= 0.67;
  const generic = /^((lac|iaz|corp de apa|amenajare piscicola|loc de pescuit).*)#\w+/i.test(normalize(a.name)) || /^((lac|iaz|corp de apa|amenajare piscicola|loc de pescuit).*)#\w+/i.test(normalize(b.name));
  return exact || similar || (generic && distance <= 0.18);
}

const osm = await parseOsm();
const natural = officialRows(naturalPath, "Apele Române — lacuri naturale", "https://data.gov.ro/dataset/hidrografie", "water", "Lac natural cartografiat");
const reservoirs = officialRows(reservoirsPath, "Apele Române — lacuri de acumulare", "https://data.gov.ro/dataset/hidrografie", "reservoir", "Lac de acumulare cartografiat");
const surface = officialRows(surfacePath, "Apele Române — corpuri de apă de suprafață", "https://data.gov.ro/dataset/zone-de-administrare-restrictie-reglementare-si-unitati-de-raportare", "water", "Corp de apă cartografiat");
const wikidata = wikidataRows();
const anpa = anpaText();

const candidates = [...osm, ...natural, ...reservoirs, ...surface, ...wikidata]
  .filter((item) => item?.name && inRomania(item.latitude, item.longitude))
  .map((item) => enrichWithAnpa(item, anpa))
  .sort((a, b) => richness(b) - richness(a));

const merged = [];
let duplicateCount = 0;
for (const candidate of candidates) {
  const index = merged.findIndex((existing) => isDuplicate(existing, candidate));
  if (index >= 0) {
    merged[index] = mergeRecords(merged[index], candidate);
    duplicateCount += 1;
  } else {
    merged.push(candidate);
  }
}

const categoryRank = { fishing: 0, aquaculture: 1, pond: 2, reservoir: 3, water: 4 };
const finalRows = merged
  .sort((a, b) => (categoryRank[a.category] ?? 9) - (categoryRank[b.category] ?? 9) || richness(b) - richness(a) || a.name.localeCompare(b.name, "ro"))
  .slice(0, maxItems)
  .map(({ _priority, ...item }) => item);

if (finalRows.length < minItems) {
  console.warn(`Catalogul nou are doar ${finalRows.length} locații (minim ${minItems}). Fișierul existent este păstrat.`);
  process.exit(0);
}

const sourceCounts = {};
for (const item of finalRows) {
  for (const source of String(item.source || "Necunoscut").split(" + ")) sourceCounts[source] = (sourceCounts[source] || 0) + 1;
}

const metadata = {
  generatedAt: syncedAt,
  source: "Catalog automat multi-sursă fără chei API",
  total: finalRows.length,
  confidence: {
    verified: finalRows.filter((item) => item.confidence === "verified").length,
    likely: finalRows.filter((item) => item.confidence === "likely").length,
    limited: finalRows.filter((item) => item.confidence === "limited").length,
  },
  categories: Object.fromEntries(Object.keys(categoryRank).map((category) => [category, finalRows.filter((item) => item.category === category).length])),
  diagnostics: {
    inputs: { osm: osm.length, natural: natural.length, reservoirs: reservoirs.length, surface: surface.length, wikidata: wikidata.length },
    candidates: candidates.length,
    duplicatesMerged: duplicateCount,
    retained: finalRows.length,
    sources: sourceCounts,
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(finalRows, null, 2)}\n`, "utf8");
writeFileSync(metaPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
console.log(`Catalog FishCast v3: ${finalRows.length} locații din ${candidates.length} candidați.`);
console.log(JSON.stringify(metadata.diagnostics.inputs));
