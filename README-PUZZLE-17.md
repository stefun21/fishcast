# Puzzle 17 — Map and catalog sync repair

Acest patch înlocuiește clustering-ul fragil al hărții cu markere Canvas Leaflet și simplifică workflow-ul catalogului la o singură sursă stabilă: extractul zilnic OpenStreetMap România de la Geofabrik.

După upload:

1. Acceptă suprascrierea fișierelor.
2. Așteaptă deploy-ul Vercel.
3. În GitHub rulează `Actions → Actualizare catalog FishCast → Run workflow`.
4. Verifică `data/catalog-meta.json` după terminare.
