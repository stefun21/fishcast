# 🎣 FishCast România

**Descoperă unde merită să pescuiești astăzi.** FishCast România este o aplicație PWA modernă pentru pescari, cu locații sincronizate automat, hartă interactivă, geolocație, vreme detaliată și un Fishing Score explicabil.

## Ce oferă Etapa 1

- import automat al locurilor de pescuit din OpenStreetMap prin Overpass;
- sincronizare zilnică și rulare manuală prin GitHub Actions;
- hartă interactivă OpenStreetMap;
- sortarea locațiilor după distanța față de utilizator;
- căutare după baltă, localitate, județ sau specie;
- filtre „Cu reținere” și „Fără reținere” numai când informația există;
- pagină detaliată pentru fiecare locație;
- navigație către Waze și Google Maps;
- favorite salvate local, fără cont;
- vreme live prin Open-Meteo;
- temperatură, presiune și tendința presiunii;
- vânt, rafale, ploaie, umiditate și vizibilitate;
- Fishing Score pentru următoarele ore, cu explicații și avertizări;
- estimarea temperaturii apei, marcată explicit ca estimare;
- instalare PWA pe telefon și desktop;
- zero chei API și zero bază de date externă.

## Cum funcționează datele

GitHub Actions rulează `scripts/sync-lakes.mjs`, interoghează mai multe instanțe publice Overpass, normalizează rezultatele, elimină duplicatele și actualizează `data/lakes.generated.json`. Orice commit nou declanșează automat un deployment Vercel.

FishCast nu inventează informații. Programul, telefonul, site-ul și regimul de pescuit sunt afișate numai când există în sursa publică. Locațiile cu date insuficiente sunt marcate corespunzător.

## Tehnologii

Next.js 15 · React 19 · TypeScript · Leaflet · OpenStreetMap · Overpass API · Open-Meteo · GitHub Actions · Vercel · PWA

## Pornire locală

```bash
npm ci
npm run dev
```

Aplicația va fi disponibilă la `http://localhost:3000`.

## Verificări

```bash
npm run check
npm run build
```

## Sincronizare manuală locală

```bash
npm run sync:lakes
npm run validate:lakes
```

Sincronizarea necesită acces la internet și depinde de disponibilitatea instanțelor publice Overpass.

## Deploy

Instrucțiunile complete sunt în [DEPLOY.md](./DEPLOY.md).

## Licențe și atribuire

Datele despre locații provin din OpenStreetMap și sunt supuse licenței ODbL. Harta folosește tile-uri OpenStreetMap cu atribuirea vizibilă. Datele meteo sunt furnizate de Open-Meteo.

> Regulamentele, programul și tarifele se pot schimba. Verifică sursa oficială înainte de deplasare.
