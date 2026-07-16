# Deploy fără calculator

## GitHub

1. Creează sau golește repository-ul.
2. Folosește `Add file → Upload files` și urcă toate fișierele proiectului.
3. Verifică existența `.github/workflows/sync-lakes.yml`.
4. Deschide `Settings → Actions → General`.
5. Selectează `Allow all actions and reusable workflows`.
6. La `Workflow permissions`, selectează `Read and write permissions` și salvează.
7. Deschide tabul `Actions`.
8. Alege `Actualizare automata locatii` și apasă `Run workflow`.

Workflow-ul nu folosește Overpass. Descarcă extractul național Geofabrik și îl procesează în runnerul GitHub, ceea ce evită blocajele întâlnite anterior.

## Vercel

- Framework Preset: Next.js
- Node.js: 22.x
- Root Directory: gol
- Build Command: implicit
- Output Directory: implicit
- Environment Variables: niciuna
