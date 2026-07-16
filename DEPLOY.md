# Deploy FishCast pe GitHub și Vercel

## 1. GitHub

Încarcă **fișierele din interiorul acestui folder** direct în rădăcina repository-ului. `package.json`, `app/`, `components/`, `data/` și `.github/` trebuie să fie la primul nivel.

În repository deschide:

`Settings → Actions → General → Workflow permissions`

Selectează **Read and write permissions** și salvează.

Apoi deschide:

`Actions → Sincronizare automată bălți → Run workflow`

Prima sincronizare poate dura câteva minute. La final trebuie să apară un commit automat care actualizează `data/lakes.generated.json`.

## 2. Vercel

Importă repository-ul în Vercel.

- Framework Preset: **Next.js**
- Root Directory: gol / `./`
- Install Command: gol
- Build Command: gol
- Output Directory: gol
- Node.js: **22.x**
- Environment Variables: **niciuna**

După primul deploy, Vercel va publica automat commit-urile noi din branch-ul conectat.

## 3. Verificări

- Permite geolocația și apasă **În apropiere**.
- Deschide o baltă și verifică prognoza.
- Testează filtrele cu/fără reținere.
- Instalează PWA din butonul din meniu sau din meniul browserului.

## Dacă sincronizarea eșuează

Instanțele publice Overpass pot fi temporar ocupate. Workflow-ul încearcă trei servere și păstrează baza existentă dacă importul pare incomplet. Rulează din nou workflow-ul după câteva minute.
