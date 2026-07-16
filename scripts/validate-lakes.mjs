import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.argv[2] || "data/lakes.generated.json");
const metadataFile = resolve(process.argv[3] || "data/catalog-meta.json");
const lakes = JSON.parse(readFileSync(file, "utf8"));
const metadata = JSON.parse(readFileSync(metadataFile, "utf8"));
if (!Array.isArray(lakes)) throw new Error("Catalogul generat trebuie să fie un array JSON.");

const ids = new Set();
const allowedConfidence = new Set(["verified", "likely", "limited"]);
const allowedModes = new Set(["retention", "catch-release"]);

for (const [index, lake] of lakes.entries()) {
  if (!lake.id || !lake.name) throw new Error(`Înregistrarea ${index} nu are id sau nume.`);
  if (ids.has(lake.id)) throw new Error(`ID duplicat: ${lake.id}`);
  ids.add(lake.id);
  if (!Number.isFinite(lake.latitude) || lake.latitude < 43 || lake.latitude > 49) throw new Error(`Latitudine invalidă pentru ${lake.name}`);
  if (!Number.isFinite(lake.longitude) || lake.longitude < 20 || lake.longitude > 30) throw new Error(`Longitudine invalidă pentru ${lake.name}`);
  if (!allowedConfidence.has(lake.confidence)) throw new Error(`Confidence invalid pentru ${lake.name}`);
  if (!Number.isInteger(lake.qualityScore) || lake.qualityScore < 0 || lake.qualityScore > 100) throw new Error(`qualityScore invalid pentru ${lake.name}`);
  if (!Array.isArray(lake.modes) || lake.modes.some((mode) => !allowedModes.has(mode))) throw new Error(`Mod de pescuit invalid pentru ${lake.name}`);
  if (lake.website && !/^https?:\/\//i.test(lake.website)) throw new Error(`Website invalid pentru ${lake.name}`);
}

if (metadata.total !== lakes.length) throw new Error("Metadatele catalogului nu corespund numărului de locații.");
console.log(`Validare OK: ${lakes.length} locații, metadata sincronizată.`);
