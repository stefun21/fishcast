import generatedRaw from "@/data/lakes.generated.json";
import type { GeneratedLake, Lake, LakeTone } from "@/types/lake";

const curatedLakes: Lake[] = [
  {
    id: "demo-varlaam",
    name: "Lacul Varlaam",
    locality: "Adunații-Copăceni",
    county: "Giurgiu",
    latitude: 44.2318,
    longitude: 26.0218,
    distanceKm: 27,
    score: 88,
    wind: "Date live pe pagina locației",
    pressure: "Date live pe pagina locației",
    tags: ["Crap", "Fără reținere"],
    modes: ["catch-release"],
    species: ["Crap", "Amur"],
    facilities: ["Parcare", "Pontoane", "Cazare în apropiere"],
    description: "Locație inițială inclusă în catalogul FishCast.",
    tone: "emerald",
    confidence: "verified",
    source: "Catalog FishCast",
  },
  {
    id: "demo-solacolu",
    name: "Domeniul Solacolu",
    locality: "Sărulești",
    county: "Călărași",
    latitude: 44.4156,
    longitude: 26.6523,
    distanceKm: 44,
    score: 81,
    wind: "Date live pe pagina locației",
    pressure: "Date live pe pagina locației",
    tags: ["Crap", "Regim mixt"],
    modes: ["retention", "catch-release"],
    species: ["Crap", "Caras", "Somn"],
    facilities: ["Parcare", "Foișoare", "Toalete"],
    description: "Locație inițială inclusă în catalogul FishCast.",
    tone: "blue",
    confidence: "verified",
    source: "Catalog FishCast",
  },
  {
    id: "demo-moara-vlasiei",
    name: "Moara Vlăsiei 2",
    locality: "Moara Vlăsiei",
    county: "Ilfov",
    latitude: 44.6491,
    longitude: 26.2452,
    distanceKm: 31,
    score: 76,
    wind: "Date live pe pagina locației",
    pressure: "Date live pe pagina locației",
    tags: ["Crap", "Regim mixt"],
    modes: ["retention", "catch-release"],
    species: ["Crap", "Amur", "Caras"],
    facilities: ["Parcare", "Pontoane", "Magazin în apropiere"],
    description: "Locație inițială inclusă în catalogul FishCast.",
    tone: "gold",
    confidence: "verified",
    source: "Catalog FishCast",
  },
];

function toneFor(index: number): LakeTone {
  return (["blue", "emerald", "gold"] as const)[index % 3];
}

function normalizeGenerated(item: GeneratedLake, index: number): Lake | null {
  if (!item.id || !item.name || !Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) {
    return null;
  }

  const sourceTags = Array.isArray(item.osmTags) ? item.osmTags : [];
  const modes = Array.isArray(item.modes) ? item.modes : [];
  const modeTags = [
    modes.includes("retention") ? "Cu reținere" : null,
    modes.includes("catch-release") ? "Fără reținere" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    id: item.id,
    name: item.name,
    locality: item.locality || "Localitate necunoscută",
    county: item.county || "Județ necunoscut",
    latitude: item.latitude,
    longitude: item.longitude,
    distanceKm: 999,
    score: item.confidence === "verified" ? 78 : item.confidence === "likely" ? 68 : 58,
    wind: "Date live pe pagina locației",
    pressure: "Date live pe pagina locației",
    tags: [...sourceTags.slice(0, 2), ...modeTags],
    modes,
    species: [],
    facilities: [],
    description: "Locație importată automat din date publice. Verifică informațiile oficiale înainte de deplasare.",
    tone: toneFor(index),
    source: item.source || "OpenStreetMap",
    sourceUrl: item.sourceUrl || undefined,
    confidence: item.confidence || "limited",
    qualityScore: item.qualityScore,
    category: item.category,
    lastSyncedAt: item.lastSyncedAt,
    phone: item.phone || undefined,
    website: item.website || undefined,
    openingHours: item.openingHours || undefined,
  };
}

const generatedLakes = (generatedRaw as GeneratedLake[])
  .map(normalizeGenerated)
  .filter((lake): lake is Lake => lake !== null);

function keyFor(lake: Lake) {
  return `${lake.name.toLocaleLowerCase("ro").replace(/\s+/g, " ").trim()}|${lake.latitude.toFixed(3)}|${lake.longitude.toFixed(3)}`;
}

const merged = new Map<string, Lake>();
for (const lake of generatedLakes) merged.set(keyFor(lake), lake);
for (const lake of curatedLakes) merged.set(keyFor(lake), lake);

export const demoLakes = Array.from(merged.values());
export const lakes = demoLakes;

export function getLakeById(id: string) {
  return demoLakes.find((lake) => lake.id === id);
}
