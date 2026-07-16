import fs from "node:fs";
import path from "node:path";

const [, , lakesArg = "data/lakes.generated.json", metaArg = "data/catalog-meta.json"] = process.argv;
const lakesPath = path.resolve(process.cwd(), lakesArg);
const metaPath = path.resolve(process.cwd(), metaArg);

function fail(message) { console.error(`VALIDATION_ERROR: ${message}`); process.exit(1); }
function readJson(filePath, required = true) {
  if (!fs.existsSync(filePath)) { if (required) fail(`Lipsește fișierul: ${filePath}`); return null; }
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch (error) { fail(`JSON invalid: ${error.message}`); }
}

const lakes = readJson(lakesPath, true);
if (!Array.isArray(lakes)) fail("Catalogul trebuie să fie un array JSON.");
if (lakes.length < 3) fail(`Catalog suspect de mic: ${lakes.length} locații.`);

const ids = new Set();
let errors = 0;
for (const [index, lake] of lakes.entries()) {
  const label = lake?.id || `#${index + 1}`;
  if (!lake || typeof lake !== "object" || Array.isArray(lake)) { console.error(`${label}: obiect invalid`); errors += 1; continue; }
  if (!String(lake.id || "").trim()) { console.error(`${label}: id lipsă`); errors += 1; }
  else if (ids.has(lake.id)) { console.error(`${label}: id duplicat`); errors += 1; }
  else ids.add(lake.id);
  if (!String(lake.name || "").trim()) { console.error(`${label}: nume lipsă`); errors += 1; }
  const lat = Number(lake.latitude); const lon = Number(lake.longitude);
  if (!Number.isFinite(lat) || lat < 43.35 || lat > 48.35) { console.error(`${label}: latitudine invalidă`); errors += 1; }
  if (!Number.isFinite(lon) || lon < 20.15 || lon > 30.25) { console.error(`${label}: longitudine invalidă`); errors += 1; }
  if (!new Set(["fishing", "aquaculture", "pond", "reservoir", "water"]).has(lake.category)) { console.error(`${label}: categorie invalidă`); errors += 1; }
  if (!new Set(["verified", "likely", "limited"]).has(lake.confidence)) { console.error(`${label}: confidence invalid`); errors += 1; }
}
if (errors) fail(`${errors} probleme găsite.`);
const meta = readJson(metaPath, false);
if (meta && Number(meta.total) !== lakes.length) fail(`Metadatele declară ${meta.total}, catalogul are ${lakes.length}.`);
console.log(`Catalog valid: ${lakes.length} locații, ${ids.size} ID-uri unice.`);
