import Link from "next/link";

export default function NotFound() {
  return (
    <main className="system-page">
      <p className="section-kicker">404</p>
      <h1>Locația nu a fost găsită</h1>
      <p>Este posibil ca linkul să fie vechi sau locația să nu mai fie disponibilă.</p>
      <div className="system-actions">
        <Link className="primary-button" href="/explore">Explorează harta</Link>
        <Link className="secondary-button" href="/">Înapoi acasă</Link>
      </div>
    </main>
  );
}
