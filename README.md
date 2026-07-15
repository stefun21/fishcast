# FishCast România

Starter Next.js pentru descoperirea bălților de pescuit, prognoză meteo, scor estimativ de activitate, favorite și navigație.

## Ce este inclus

- Homepage cu căutare, listă și hartă
- Sortare după locația utilizatorului
- Pagini individuale pentru bălți
- Scor de pescuit pe ore și prognoză 7 zile prin Open-Meteo
- Navigație prin Waze și Google Maps
- Favorite salvate în localStorage
- Scor FishCast pentru fiecare baltă, fără Google API
- Notă personală de 1-5 stele, salvată în browser
- Design responsive

## Cum funcționează ratingul

`Scor FishCast` este un scor editorial inclus în datele fiecărei bălți. Poate fi stabilit manual pe baza accesului, facilităților, varietății speciilor, programului și calității informațiilor disponibile.

Utilizatorul poate acorda și o notă personală. Nota se salvează local în browser și nu este agregată cu notele altor persoane. Pentru un rating public comun este necesară ulterior o bază de date precum Supabase.

## Pornire locală

```bash
npm install
cp .env.example .env.local
npm run dev
```

Deschide `http://localhost:3000`.

## Deploy pe GitHub + Vercel

1. Creează un repository nou în GitHub.
2. Urcă toate fișierele din acest folder în rădăcina repository-ului.
3. În Vercel apasă **Add New → Project** și importă repository-ul.
4. Vercel detectează automat Next.js. Lasă comenzile implicite și apasă **Deploy**.

Nu este necesară nicio cheie Google API.

## Cum adaugi o baltă

Editează `lib/lakes.ts` și adaugă un obiect nou. Câmpul `rating` reprezintă Scorul FishCast pe o scară de la 1 la 5.

## Limitări MVP

- Favoritele și nota personală sunt per browser/dispozitiv.
- Scorul de pescuit este o estimare euristică, nu o predicție biologică garantată.
- Datele despre program și tarife trebuie validate cu administratorii bălților.
