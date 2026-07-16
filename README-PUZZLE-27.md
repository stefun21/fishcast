# Puzzle 27 — Eliminare conexiuni data.gov.ro

Acest patch scoate complet apelurile către `data.gov.ro` din GitHub Actions.

Catalogul este generat din:
- OpenStreetMap / Geofabrik
- Wikidata
- ANPA

Fișierele GeoJSON oficiale lipsă sunt înlocuite cu colecții goale valide, astfel
încât builderul existent să continue fără timeout-uri și fără erori false.

## Instalare

Încarcă direct conținutul arhivei în rădăcina repository-ului și acceptă
suprascrierea fișierului:

`.github/workflows/sync-lakes.yml`

Apoi rulează:

`Actions → Actualizare automata catalog FishCast → Run workflow`
