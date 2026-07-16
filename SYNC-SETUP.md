# FishCast - sincronizare manuala si rezumabila

Acest pachet inlocuieste sincronizarea GitHub Actions care ramanea blocata la o singura interogare mare Overpass.

## Ce face diferit

- imparte Romania in 12 zone mici;
- ruleaza cererile pe rand;
- fiecare cerere are timeout;
- schimba automat intre trei servere Overpass;
- salveaza progresul dupa fiecare zona;
- daca o cerere esueaza, comanda poate fi rulata din nou si continua de unde a ramas;
- aplicația nu apeleaza Overpass la runtime; citeste doar `data/lakes.generated.json`.

## Instalare in proiect

Copiaza directoarele `scripts` si `data` in radacina proiectului.

In `package.json`, in obiectul `scripts`, adauga:

```json
"sync:lakes": "node scripts/sync-lakes.mjs",
"validate:lakes": "node scripts/validate-lakes.mjs"
```

Ai grija sa existe virgula intre scripturile JSON.

## Rulare

Din terminal, in folderul proiectului:

```bash
npm run sync:lakes
npm run validate:lakes
```

Prima rulare poate dura mai multe minute. Daca se opreste, ruleaza din nou `npm run sync:lakes`; progresul este pastrat in fisiere temporare din `data/`.

Dupa finalizare, fa commit pentru:

```text
data/lakes.generated.json
```

Nu urca fisierele temporare `.sync-state.json` si `.lakes.partial.json` daca rularea nu s-a terminat.
