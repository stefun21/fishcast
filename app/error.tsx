"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="system-page" role="alert">
      <p className="section-kicker">EROARE</p>
      <h1>Ceva nu a mers</h1>
      <p>Încearcă din nou. Datele salvate în favorite nu sunt afectate.</p>
      <button className="primary-button" type="button" onClick={reset}>
        Reîncearcă
      </button>
    </main>
  );
}
