import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];

const ALLOWED_CATEGORIES = new Set(["fishing", "aquaculture", "pond", "reservoir", "water"]);
const CACHE_TTL_MS = 20 * 60 * 1000;
const STALE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_RESULTS = 450;

type LakeResult = {
  id: string;
  name: string;
  locality: string;
  county: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  score: number;
  wind: string;
  pressure: string;
  tags: string[];
  modes: string[];
  species: string[];
  facilities: string[];
  description: string;
  tone: "blue" | "emerald" | "gold";
  source: string;
  sourceUrl: string;
  confidence: "likely" | "limited";
  category: "fishing" | "aquaculture" | "pond" | "reservoir" | "water";
  detailHref: string;
  website?: string;
  phone?: string;
  openingHours?: string;
};

type CacheEntry = {
  createdAt: number;
  payload: { lakes: LakeResult[]; source: string; radiusKm: number; cached?: boolean; stale?: boolean };
};

declare global {
  // eslint-disable-next-line no-var
  var fishcastNearbyCache: Map<string, CacheEntry> | undefined;
}

const cache = globalThis.fishcastNearbyCache ?? new Map<string, CacheEntry>();
globalThis.fishcastNearbyCache = cache;

function safeNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function categoryFor(tags: Record<string, string>): LakeResult["category"] {
  if (tags.leisure === "fishing" || tags.sport === "fishing" || tags.fishing === "yes") return "fishing";
  if (tags.landuse === "aquaculture") return "aquaculture";
  if (tags.water === "reservoir") return "reservoir";
  if (tags.water === "pond") return "pond";
  return "water";
}

function clausesFor(categories: Set<string>, radius: number, lat: number, lon: number) {
  const around = `(around:${radius},${lat},${lon})`;
  const clauses: string[] = [];

  if (categories.has("fishing")) {
    clauses.push(`nwr${around}[leisure=fishing];`);
    clauses.push(`nwr${around}[sport=fishing];`);
    clauses.push(`nwr${around}[fishing=yes];`);
  }
  if (categories.has("aquaculture")) clauses.push(`nwr${around}[landuse=aquaculture];`);
  if (categories.has("pond")) clauses.push(`nwr${around}[natural=water][water=pond][name];`);
  if (categories.has("reservoir")) clauses.push(`nwr${around}[natural=water][water=reservoir][name];`);
  if (categories.has("water")) {
    clauses.push(`nwr${around}[natural=water][name][water!=pond][water!=reservoir];`);
    clauses.push(`nwr${around}[waterway=riverbank][name];`);
  }

  return clauses;
}

async function fetchEndpoint(endpoint: string, query: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        "user-agent": "FishCast-Romania/2.0 (+https://vercel.app)",
      },
      body: new URLSearchParams({ data: query }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as {
      elements?: Array<{
        id: number;
        type: "node" | "way" | "relation";
        lat?: number;
        lon?: number;
        center?: { lat?: number; lon?: number };
        tags?: Record<string, string>;
      }>;
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  const lat = safeNumber(request.nextUrl.searchParams.get("lat"), NaN);
  const lon = safeNumber(request.nextUrl.searchParams.get("lon"), NaN);
  const radiusKm = Math.min(Math.max(safeNumber(request.nextUrl.searchParams.get("radius"), 50), 10), 120);
  const requested = (request.nextUrl.searchParams.get("categories") || "fishing,aquaculture,pond,reservoir")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => ALLOWED_CATEGORIES.has(value));
  const categories = new Set(requested.length ? requested : ["fishing", "aquaculture", "pond", "reservoir"]);

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Coordonate invalide" }, { status: 400 });
  }

  const cacheKey = `${lat.toFixed(2)}:${lon.toFixed(2)}:${radiusKm}:${Array.from(categories).sort().join(",")}`;
  const cached = cache.get(cacheKey);
  const age = cached ? Date.now() - cached.createdAt : Infinity;
  if (cached && age < CACHE_TTL_MS) {
    return NextResponse.json({ ...cached.payload, cached: true }, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
    });
  }

  const radius = Math.round(radiusKm * 1000);
  const clauses = clausesFor(categories, radius, lat, lon);
  const query = `[out:json][timeout:22];(${clauses.join("\n")});out center tags;`;

  let lastError = "Nu am putut contacta sursa publică";
  for (const endpoint of ENDPOINTS) {
    try {
      const data = await fetchEndpoint(endpoint, query);
      const seen = new Set<string>();
      const lakes = (data.elements || []).flatMap((element) => {
        const latitude = element.lat ?? element.center?.lat;
        const longitude = element.lon ?? element.center?.lon;
        const tags = element.tags || {};
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

        const category = categoryFor(tags);
        if (!categories.has(category)) return [];

        const fallbackName = category === "fishing" || category === "aquaculture"
          ? `Loc de pescuit #${element.id}`
          : `Corp de apă #${element.id}`;
        const name = tags["name:ro"] || tags.name || tags.operator || fallbackName;
        const key = `${name.toLocaleLowerCase("ro")}|${Number(latitude).toFixed(4)}|${Number(longitude).toFixed(4)}`;
        if (seen.has(key)) return [];
        seen.add(key);

        const sourceUrl = `https://www.openstreetmap.org/${element.type}/${element.id}`;
        const locality = tags["addr:city"] || tags["addr:village"] || tags["addr:town"] || tags["is_in:city"] || "În apropiere";
        const county = tags["addr:county"] || tags["is_in:county"] || "România";
        const actualDistance = distanceKm(lat, lon, Number(latitude), Number(longitude));
        const isNamed = Boolean(tags.name || tags["name:ro"] || tags.operator);
        const confidence: LakeResult["confidence"] = category === "fishing" || (category === "aquaculture" && isNamed) ? "likely" : "limited";
        const qs = new URLSearchParams({
          name,
          lat: String(latitude),
          lon: String(longitude),
          locality,
          county,
          source: "OpenStreetMap live",
          sourceUrl,
          category,
        });

        return [{
          id: `live-${element.type}-${element.id}`,
          name,
          locality,
          county,
          latitude: Number(latitude),
          longitude: Number(longitude),
          distanceKm: Number(actualDistance.toFixed(1)),
          score: category === "fishing" ? 74 : category === "aquaculture" ? 67 : category === "reservoir" ? 59 : 54,
          wind: "Date live pe pagina locației",
          pressure: "Date live pe pagina locației",
          tags: [
            category === "fishing" ? "Loc de pescuit" :
            category === "aquaculture" ? "Amenajare piscicolă" :
            category === "reservoir" ? "Acumulare" :
            category === "pond" ? "Iaz" : "Corp de apă",
          ],
          modes: [],
          species: [],
          facilities: [],
          description: "Locație descoperită din date publice. Verifică accesul și regulamentul înainte de deplasare.",
          tone: category === "fishing" ? "emerald" : category === "aquaculture" ? "gold" : "blue",
          source: "OpenStreetMap live",
          sourceUrl,
          confidence,
          category,
          detailHref: `/place?${qs.toString()}`,
          website: tags.website || tags["contact:website"] || undefined,
          phone: tags.phone || tags["contact:phone"] || undefined,
          openingHours: tags.opening_hours || undefined,
        } satisfies LakeResult];
      })
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, MAX_RESULTS);

      const payload = { lakes, source: endpoint, radiusKm };
      cache.set(cacheKey, { createdAt: Date.now(), payload });
      return NextResponse.json(payload, {
        headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
      });
    } catch (error) {
      lastError = error instanceof Error && error.name === "AbortError"
        ? "Sursa publică a depășit timpul de răspuns"
        : error instanceof Error ? error.message : "Eroare necunoscută";
    }
  }

  if (cached && age < STALE_TTL_MS) {
    return NextResponse.json({ ...cached.payload, cached: true, stale: true }, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=3600" },
    });
  }

  return NextResponse.json({ error: lastError, lakes: [] }, { status: 503 });
}
