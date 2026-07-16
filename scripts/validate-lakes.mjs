import fs from "node:fs";
import path from "node:path";

const [, , lakesArg = "data/lakes.generated.json", metaArg = "data/catalog-meta.json"] = process.argv;

const lakesPath = path.resolve(process.cwd(), lakesArg);
const metaPath = path.resolve(process.cwd(), metaArg);

function fail(message) {
  console.error(`VALIDATION_ERROR: ${message}`);
  process.exit(1);
}

function readJson(filePath, required = true) {
  if (!fs.existsSync(filePath)) {
    if (required) fail(`Lipsește fișierul: ${path.relative(process.cwd(), filePath)}`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`JSON invalid în ${path.relative(process.cwd(), filePath)}: ${error.message}`);
  }
}

const lakes = readJson(lakesPath, true);

if (!Array.isArray(lakes)) {
  fail("Catalogul de locații trebuie să fie un array JSON.");
}

if (lakes.length === 0) {
  fail("Catalogul este gol.");
}

const ids = new Set();
let invalidCount = 0;

for (const [index, lake] of lakes.entries()) {
  if (!lake || typeof lake !== "object" || Array.isArray(lake)) {
    console.error(`Locația #${index + 1} nu este un obiect valid.`);
    invalidCount += 1;
    continue;
  }

  const id = String(lake.id ?? "").trim();
  const name = String(lake.name ?? "").trim();
  const latitude = Number(lake.latitude);
  const longitude = Number(lake.longitude);

  if (!id) {
    console.error(`Locația #${index + 1} nu are id.`);
    invalidCount += 1;
  } else if (ids.has(id)) {
    console.error(`ID duplicat: ${id}`);
    invalidCount += 1;
  } else {
    ids.add(id);
  }

  if (!name) {
    console.error(`Locația ${id || `#${index + 1}`} nu are nume.`);
    invalidCount += 1;
  }

  if (!Number.isFinite(latitude) || latitude < 43.4 || latitude > 48.4) {
    console.error(`Latitudine invalidă pentru ${id || name || `#${index + 1}`}: ${lake.latitude}`);
    invalidCount += 1;
  }

  if (!Number.isFinite(longitude) || longitude < 20.0 || longitude > 30.5) {
    console.error(`Longitudine invalidă pentru ${id || name || `#${index + 1}`}: ${lake.longitude}`);
    invalidCount += 1;
  }

  if (lake.fishingModes !== undefined) {
    if (!Array.isArray(lake.fishingModes)) {
      console.error(`fishingModes trebuie să fie array pentru ${id || name}`);
      invalidCount += 1;
    } else {
      const allowed = new Set(["retention", "catch-release"]);
      const bad = lake.fishingModes.filter((mode) => !allowed.has(mode));
      if (bad.length) {
        console.error(`fishingModes invalid pentru ${id || name}: ${bad.join(", ")}`);
        invalidCount += 1;
      }
    }
  }
}

if (invalidCount > 0) {
  fail(`Catalogul conține ${invalidCount} probleme.`);
}

const meta = readJson(metaPath, false);

if (meta !== null && (typeof meta !== "object" || Array.isArray(meta))) {
  fail("catalog-meta.json trebuie să conțină un obiect JSON.");
}

console.log(`Catalog valid: ${lakes.length} locații, ${ids.size} ID-uri unice.`);
if (meta !== null) {
  console.log(`Metadate valide: ${path.relative(process.cwd(), metaPath)}`);
}
