# 🎣 FishCast România

FishCast România este o aplicație PWA pentru descoperirea locurilor de pescuit din România. Locațiile sunt actualizate automat din extractul zilnic OpenStreetMap furnizat de Geofabrik, fără Supabase, fără chei API și fără rularea unor comenzi pe calculatorul utilizatorului.

## Ce funcționează în Etapa 1

- import automat al locațiilor de pescuit;
- actualizare programată prin GitHub Actions;
- căutare după nume, localitate sau județ;
- geolocație și sortare după distanță;
- favorite salvate în browser;
- navigație Google Maps și Waze;
- etichete cu/fără reținere doar când sursa conține informația;
- PWA instalabilă;
- zero conturi externe și zero variabile de mediu.

## Surse

- OpenStreetMap / Geofabrik pentru locații;
- Open-Meteo va fi adăugat în Etapa 2 pentru vreme și Fishing Score;
- AviationWeather.gov va fi folosit opțional pentru observații METAR apropiate.

## Deploy

1. Urcă toate fișierele în rădăcina repository-ului GitHub.
2. În GitHub: Settings → Actions → General → Workflow permissions → Read and write permissions.
3. În tabul Actions rulează `Actualizare automata locatii`.
4. Importă repository-ul în Vercel. Nu sunt necesare variabile de mediu.

## Licență date

Datele OpenStreetMap sunt utilizate sub licența ODbL. Atribuirea trebuie păstrată în aplicație.
