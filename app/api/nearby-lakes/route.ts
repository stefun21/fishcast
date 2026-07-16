import { NextRequest, NextResponse } from "next/server";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];

function safeNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function categoryFor(tags: Record<string, string>) {
  if (tags.leisure === "fishing" || tags.sport === "fishing" || tags.fishing === "yes") return "fishing";
  if (tags.landuse === "aquaculture") return "aquaculture";
  if (tags.water === "reservoir") return "reservoir";
  if (tags.water === "pond") return "pond";
  return "water";
}

export async function GET(request: NextRequest) {
  const lat = safeNumber(request.nextUrl.searchParams.get("lat"), NaN);
  const lon = safeNumber(request.nextUrl.searchParams.get("lon"), NaN);
  const radiusKm = Math.min(Math.max(safeNumber(request.nextUrl.searchParams.get("radius"), 80), 10), 120);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return NextResponse.json({ error: "Coordonate invalide" }, { status: 400 });

  const radius = Math.round(radiusKm * 1000);
  const query = `[out:json][timeout:25];(
    nwr(around:${radius},${lat},${lon})[leisure=fishing];
    nwr(around:${radius},${lat},${lon})[sport=fishing];
    nwr(around:${radius},${lat},${lon})[fishing=yes];
    nwr(around:${radius},${lat},${lon})[landuse=aquaculture];
    nwr(around:${radius},${lat},${lon})[natural=water][name];
    nwr(around:${radius},${lat},${lon})[water=pond][name];
    nwr(around:${radius},${lat},${lon})[water=reservoir][name];
  );out center tags;`;

  let lastError = "Nu am putut contacta sursa publică";
  for (const endpoint of ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 18000);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams({ data: query }),
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      if (!response.ok) { lastError = `Sursa a răspuns cu ${response.status}`; continue; }

      const data = await response.json() as { elements?: Array<{ id:number; type:"node"|"way"|"relation"; lat?:number; lon?:number; center?:{lat?:number;lon?:number}; tags?:Record<string,string> }> };
      const seen = new Set<string>();
      const lakes = (data.elements || []).flatMap((element) => {
        const latitude = element.lat ?? element.center?.lat;
        const longitude = element.lon ?? element.center?.lon;
        const tags = element.tags || {};
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
        const name = tags.name || tags["name:ro"] || tags.operator || `Loc de pescuit #${element.id}`;
        const key = `${name.toLocaleLowerCase("ro")}|${Number(latitude).toFixed(4)}|${Number(longitude).toFixed(4)}`;
        if (seen.has(key)) return [];
        seen.add(key);
        const sourceUrl = `https://www.openstreetmap.org/${element.type}/${element.id}`;
        const locality = tags["addr:city"] || tags["addr:village"] || tags["addr:town"] || "În apropiere";
        const county = tags["addr:county"] || "România";
        const category = categoryFor(tags);
        const qs = new URLSearchParams({ name, lat:String(latitude), lon:String(longitude), locality, county, source:"OpenStreetMap live", sourceUrl, category });
        return [{
          id:`live-${element.type}-${element.id}`, name, locality, county, latitude, longitude,
          distanceKm:999, score:category === "fishing" ? 72 : category === "aquaculture" ? 66 : 56,
          wind:"Date live pe pagina locației", pressure:"Date live pe pagina locației",
          tags:[category === "fishing" ? "Loc de pescuit" : category === "aquaculture" ? "Amenajare piscicolă" : "Corp de apă"],
          modes:[], species:[], facilities:[],
          description:"Locație descoperită live din date publice. Verifică accesul și regulamentul înainte de deplasare.",
          tone:category === "fishing" ? "emerald" : category === "aquaculture" ? "gold" : "blue",
          source:"OpenStreetMap live", sourceUrl, confidence:category === "fishing" ? "likely" : "limited", category,
          detailHref:`/place?${qs.toString()}`,
          website:tags.website || tags["contact:website"] || undefined,
          phone:tags.phone || tags["contact:phone"] || undefined,
          openingHours:tags.opening_hours || undefined,
        }];
      });
      return NextResponse.json({ lakes, source:endpoint, radiusKm });
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Eroare necunoscută";
    }
  }
  return NextResponse.json({ error:lastError, lakes:[] }, { status:503 });
}
