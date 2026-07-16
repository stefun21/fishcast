# Deploy FishCast v3

1. Șterge conținutul vechi al repository-ului GitHub.
2. Încarcă direct toate fișierele și directoarele din această arhivă în rădăcina repository-ului.
3. Vercel face deploy automat.
4. GitHub Actions pornește automat importul multi-sursă după push și salvează catalogul generat în `data/lakes.generated.json`.
5. Commit-ul automat declanșează al doilea deploy Vercel, care va conține catalogul extins.

Nu sunt necesare variabile de mediu, alte conturi sau comenzi locale.
