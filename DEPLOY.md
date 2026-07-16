# Deploy FishCast România – Etapa 1

## 1. Înlocuiește proiectul din GitHub

1. Dezarhivează pachetul.
2. Urcă **toate fișierele și directoarele din interior** direct în rădăcina repository-ului.
3. Verifică în GitHub că există exact fișierul:

```text
.github/workflows/sync-lakes.yml
```

Dacă `.github` lipsește, workflow-ul nu va apărea în tabul Actions. Folderul începe cu punct și poate fi ascuns de unele programe de fișiere.

## 2. Activează GitHub Actions

În repository:

1. `Settings → Actions → General`
2. La **Actions permissions**, permite rularea acțiunilor.
3. La **Workflow permissions**, selectează **Read and write permissions**.
4. Salvează.

Apoi:

1. Deschide tabul **Actions**.
2. În stânga trebuie să apară **Sincronizare automată bălți**.
3. Deschide workflow-ul.
4. Apasă **Run workflow → Run workflow**.

Workflow-ul rulează și automat zilnic la 03:23 UTC.

## 3. Vercel

- Framework Preset: `Next.js`
- Node.js: `22.x`
- Root Directory: gol sau `./`
- Install Command: implicit
- Build Command: implicit
- Output Directory: implicit
- Environment Variables: niciuna

Vercel va face automat un deployment după fiecare commit realizat de workflow.

## 4. Verificare rapidă

După prima rulare Actions, deschide în GitHub:

```text
data/lakes.generated.json
```

Fișierul trebuie să conțină locațiile importate. Dacă serviciile publice Overpass sunt temporar indisponibile, workflow-ul va eșua fără să suprascrie baza existentă; îl poți rula din nou mai târziu.
