export default function Loading() {
  return (
    <main className="system-page" aria-live="polite" aria-busy="true">
      <div className="loading-ring" aria-hidden="true" />
      <h1>Pregătim harta...</h1>
      <p>Încărcăm locațiile și cele mai recente condiții disponibile.</p>
    </main>
  );
}
