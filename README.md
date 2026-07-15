# FishCast România

Starter Next.js pentru descoperirea bălților de pescuit, prognoză meteo, scor estimativ de activitate, favorite și navigație.

## Ce este inclus

- Homepage cu căutare, listă și hartă
- Sortare după locația utilizatorului
- Pagini individuale pentru bălți
- Scor de pescuit pe ore și prognoză 7 zile, alimentate de Open-Meteo
- Navigație prin Waze și Google Maps
- Favorite salvate în localStorage
- Recenzii demo și integrare opțională Google Places
- Design responsive

## Pornire locală

```bash
npm install
cp .env.example .env.local
npm run dev
```

Deschide `http://localhost:3000`.

## Deploy pe GitHub + Vercel

1. Creează un repository nou în GitHub.
2. Urcă toate fișierele din acest folder în rădăcina repository-ului.
3. În Vercel apasă **Add New → Project** și importă repository-ul.
4. Vercel detectează automat Next.js. Lasă comenzile implicite și apasă **Deploy**.
5. Pentru recenzii reale, mergi în **Project Settings → Environment Variables** și adaugă `GOOGLE_PLACES_API_KEY`.
6. După adăugarea variabilei, redeploy aplicația.

## Google Places

Cheia este opțională. În Google Cloud:

1. Creează/selectează un proiect.
2. Activează **Places API (New)**.
3. Configurează billing și restricționează cheia pentru API-ul respectiv.
4. Adaugă cheia numai ca variabilă server-side `GOOGLE_PLACES_API_KEY`; nu folosi prefixul `NEXT_PUBLIC_`.

Endpoint-urile `/api/places` și `/api/reviews` sunt deja pregătite. Pentru fiecare baltă reală, salvează ID-ul Google în `googlePlaceId` din `lib/lakes.ts`.

## Cum adaugi o baltă

Editează `lib/lakes.ts` și adaugă un obiect nou. Câmpurile esențiale sunt `id`, `name`, `lat`, `lng`, `hours`, `price`, `fish`, `facilities` și `description`.

## Limitări MVP

- Favoritele sunt per browser/dispozitiv. Pentru conturi și sincronizare folosește Supabase, Neon sau Vercel Postgres.
- Scorul de pescuit este o estimare euristică, nu o predicție biologică garantată.
- Datele demo despre program și tarife trebuie validate cu administratorii bălților.
- Pentru căutare publică la scară mare, folosește Google Places, Mapbox sau un serviciu Nominatim dedicat, nu instanța publică OSM în trafic intens.
