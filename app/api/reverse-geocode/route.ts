import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");
  if (!lat || !lon) return NextResponse.json({ error: "Coordonate lipsă" }, { status: 400 });
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2"); url.searchParams.set("lat", lat); url.searchParams.set("lon", lon);
  url.searchParams.set("zoom", "10"); url.searchParams.set("addressdetails", "1");
  const response = await fetch(url, { headers:{ "user-agent":"FishCast-Romania/2.0", "accept-language":"ro,en;q=0.7" }, next:{ revalidate:86400 } });
  if (!response.ok) return NextResponse.json({ error:"Localitatea nu a putut fi identificată" }, { status:502 });
  const data = await response.json() as { address?:Record<string,string>; display_name?:string };
  const a = data.address || {};
  return NextResponse.json({ locality:a.city || a.town || a.village || a.municipality || a.hamlet || "Localitate necunoscută", county:a.county || a.state || "Județ necunoscut", displayName:data.display_name || "" });
}
