# FishCast România

FishCast este o aplicație PWA pentru pescarii din România. Catalogul combină automat surse publice fără chei API și fără conturi externe, apoi afișează locațiile pe hartă, ordonate după distanța față de utilizator.

## Ce include

- hartă Leaflet cu clustering pentru mii de locații;
- geolocație, căutare și filtre;
- favorite salvate local în browser;
- navigație Google Maps și Waze;
- vreme live prin Open-Meteo;
- Fishing Index calculat din presiune, vânt, rafale, temperatură și precipitații;
- PWA instalabilă pe telefon și desktop;
- catalog automat multi-sursă.

## Catalogul automat

La primul push și apoi săptămânal, GitHub Actions construiește catalogul din:

- OpenStreetMap, prin extractul Geofabrik pentru România;
- lacuri naturale publicate de Administrația Națională Apele Române;
- lacuri de acumulare publicate de Administrația Națională Apele Române;
- corpuri de apă de suprafață publicate pe data.gov.ro;
- lacuri documentate în Wikidata;
- listele publice ANPA, folosite pentru a identifica habitate piscicole deja prezente în sursele geografice.

Sursele opționale pot fi temporar indisponibile. Generatorul continuă cu sursele care răspund și nu înlocuiește catalogul existent cu un rezultat suspect de mic.

## Deploy

1. Șterge fișierele vechi din repository.
2. Încarcă direct conținutul arhivei în rădăcina repository-ului GitHub.
3. Vercel va detecta automat Next.js și va face deploy.
4. Workflow-ul GitHub pornește automat după push, generează catalogul și face un commit nou. Vercel publică apoi catalogul actualizat.

Nu sunt necesare variabile de mediu, cont Supabase, chei Google sau comenzi rulate local.

## Comenzi locale opționale

```bash
npm ci
npm run build
npm run validate:lakes
```

## Principiul datelor

FishCast separă clar:

- locuri de pescuit cartografiate explicit;
- amenajări piscicole;
- habitate piscicole identificate în liste ANPA;
- lacuri, iazuri și acumulări care pot necesita verificarea accesului.

Informațiile despre taxe, program sau regimul de reținere sunt afișate numai dacă există în sursa publică.
