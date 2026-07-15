# FishCast România Pro

Aplicație Next.js 15 + Supabase + PWA pentru descoperirea locurilor de pescuit, sortare după geolocație și analiză meteo orientată spre pescuit.

## Funcții incluse

- căutare după nume, localitate, județ și specie;
- geolocație și sortare automată după distanță;
- filtre „Cu reținere” și „Fără reținere”;
- status clar: verificată, confirmată comunitar sau în verificare;
- pagină completă pentru fiecare baltă;
- navigare Google Maps și Waze;
- favorite salvate local;
- prognoză Open-Meteo, presiune, vânt, rafale, umiditate și precipitații;
- Fishing Score pe oră și estimare transparentă a temperaturii apei;
- sincronizare zilnică OpenStreetMap/Overpass în Supabase;
- PWA instalabilă, manifest, iconuri și service worker;
- fallback demo când Supabase nu este încă configurat.

## 1. Supabase

1. Deschide proiectul Supabase.
2. Intră la **SQL Editor → New query**.
3. Copiază tot conținutul din `supabase/schema.sql` și apasă **Run**.
4. Din fereastra **Connect**, copiază Project URL și Publishable key.
5. Din **Settings → API Keys**, copiază Secret key. Cheia secretă nu se publică și nu primește prefixul `NEXT_PUBLIC_`.

## 2. Variabile în Vercel

În interfața actuală Vercel, variabilele sunt în proiect la **Settings → Environments**. Adaugă pentru Production, Preview și Development:

```env
NEXT_PUBLIC_SUPABASE_URL=https://proiectul-tau.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
CRON_SECRET=un-sir-lung-si-aleatoriu
```

## 3. Deploy

1. Urcă fișierele direct în rădăcina repository-ului GitHub.
2. Importă repository-ul în Vercel.
3. Framework Preset: Next.js.
4. Node.js: 24.x.
5. Nu seta manual Install Command, Build Command sau Output Directory.
6. Deploy.

## 4. Sincronizarea bălților

`vercel.json` pornește o sincronizare zilnică la 03:15 UTC. Pe Vercel Hobby, cron-urile sunt limitate la o execuție pe zi.

Endpoint:

```text
GET /api/sync/lakes
Authorization: Bearer <CRON_SECRET>
```

Sincronizarea caută în OpenStreetMap elemente `leisure=fishing` și `sport=fishing` din România. Orice locație nouă este introdusă ca **unverified**, nu ca verificată. Administratorul poate confirma ulterior datele în Supabase.

## 5. Ce înseamnă „toate bălțile”

Nu există o bază publică gratuită care să garanteze toate bălțile comerciale din România și toate regulamentele lor. Proiectul folosește o arhitectură serioasă:

- import automat dintr-o bază actualizată;
- deduplicare prin `external_id`;
- status de verificare;
- sursă și dată de verificare;
- câmpuri necunoscute rămân goale;
- tagurile de reținere apar numai când informația există.

## 6. PWA

După deploy, deschide aplicația în Chrome/Edge pe Android sau desktop și alege **Install app / Add to Home Screen**. Pe iPhone: Safari → Share → Add to Home Screen.

## Rulare locală

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Surse externe

- Open-Meteo pentru prognoză;
- OpenStreetMap/Overpass pentru descoperirea locațiilor;
- Supabase pentru baza persistentă;
- Vercel Cron pentru sincronizarea zilnică.

Verifică întotdeauna programul, tariful și regulamentul direct la administratorul bălții înainte de deplasare.
