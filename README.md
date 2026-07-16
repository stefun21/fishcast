# 🎣 FishCast România

**Descoperă unde merită să pescuiești astăzi.** FishCast România este o aplicație PWA profesională pentru pescari, cu locații sincronizate automat din surse publice, sortare după geolocație, vreme detaliată și un Fishing Score explicabil.

## Ce oferă

- import automat zilnic al locurilor de pescuit din OpenStreetMap prin Overpass;
- eliminare de duplicate și validare înainte de publicare;
- sortare de la cea mai apropiată locație față de utilizator;
- căutare după nume, localitate, județ sau specie;
- filtre **Cu reținere** și **Fără reținere** doar când informația există în sursă;
- pagină completă pentru fiecare locație, cu Waze și Google Maps;
- vreme live pe coordonatele exacte: temperatură, presiune și tendință, vânt, rafale, ploaie, umiditate și vizibilitate;
- Fishing Score pe ore, avertizări de siguranță și estimarea temperaturii apei;
- favorite salvate local, fără cont;
- PWA instalabilă pe Android, iOS și desktop;
- zero chei API și zero baze de date externe.

## Arhitectură

```text
OpenStreetMap / Overpass
        ↓ GitHub Action zilnic
scripts/sync-lakes.mjs
        ↓ validare și deduplicare
data/lakes.generated.json
        ↓ commit automat
Vercel redeploy

Open-Meteo → /api/weather → Fishing Score live
```

## Deploy rapid

1. Urcă toate fișierele din acest folder direct în rădăcina repository-ului GitHub.
2. Importă repository-ul în Vercel și selectează Next.js.
3. Nu adăuga variabile de mediu. Proiectul nu folosește Supabase.
4. În GitHub: **Settings → Actions → General → Workflow permissions → Read and write permissions**.
5. În tabul **Actions**, rulează manual workflow-ul **Sincronizare automată bălți**.
6. După commit-ul automat, Vercel publică automat lista actualizată.

## Rulare locală

```bash
npm install
npm run dev
```

## Sincronizare și verificare manuală

```bash
npm run sync:lakes
npm run validate:lakes
npm run build
```

Scriptul încearcă mai multe instanțe publice Overpass și nu suprascrie fișierul existent dacă importul pare incomplet.

## Date și transparență

FishCast nu inventează taxe, program, specii sau regim de pescuit. Câmpurile sunt afișate doar când există în sursa publică. Locațiile importate automat sunt marcate clar ca date nevalidate complet. Verifică întotdeauna regulamentul oficial și condițiile locale înainte de deplasare.

## Tehnologii

Next.js · React · TypeScript · GitHub Actions · Vercel · OpenStreetMap · Overpass API · Open-Meteo · PWA

## Licențe și atribuiri

Datele despre locații provin din OpenStreetMap, © colaboratorii OpenStreetMap, licență ODbL. Datele meteo sunt furnizate de Open-Meteo. Codul aplicației poate fi adaptat pentru proiectul propriu.
