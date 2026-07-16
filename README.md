# FishCast România

FishCast România este o aplicație PWA pentru descoperirea locurilor de pescuit, cu geolocație, hartă interactivă, favorite, vreme live și Fishing Index.

## Funcționalități

- căutare după nume, localitate, județ și specie;
- sortare după distanța față de utilizator;
- filtre cu reținere și fără reținere;
- hartă Leaflet cu clustering;
- pagini individuale și navigație Google Maps/Waze;
- favorite salvate local;
- vreme live prin Open-Meteo;
- Fishing Index pentru următoarele ore;
- instalare PWA;
- actualizare automată a catalogului prin GitHub Actions.

## Deploy

1. Urcă toate puzzle-urile în ordine, acceptând suprascrierea fișierelor.
2. Conectează repository-ul la Vercel.
3. Folosește Node.js 22.x și setările implicite Next.js.
4. Nu sunt necesare variabile de mediu.

## Catalog automat

Workflow-ul `.github/workflows/sync-lakes.yml` poate fi pornit manual din GitHub Actions și rulează periodic pentru a actualiza catalogul generat.

## Surse

Datele despre locații provin din OpenStreetMap/Geofabrik. Datele meteo sunt furnizate de Open-Meteo. Informațiile pot fi incomplete; verifică regulamentul oficial înainte de deplasare.
