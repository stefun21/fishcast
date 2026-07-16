const coreItems = [
  "Next.js + TypeScript",
  "GitHub + Vercel",
  "Fără conturi externe",
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="/" aria-label="FishCast România">
          <span className="brand-mark">FC</span>
          <span>
            <strong>FishCast</strong>
            <small>România</small>
          </span>
        </a>

        <span className="status-pill">
          <span className="status-dot" /> Core activ
        </span>
      </header>

      <section className="hero">
        <p className="eyebrow">FISHCAST V2 · PUZZLE 01</p>
        <h1>Găsește locul potrivit. La momentul potrivit.</h1>
        <p className="hero-copy">
          Fundația noului FishCast este instalată. Următoarele pachete vor adăuga
          navigația, harta, locațiile, vremea și Fishing Index.
        </p>

        <div className="actions">
          <a className="primary-action" href="#core">
            Verifică instalarea
          </a>
          <span className="secondary-note">Deploy minim și stabil</span>
        </div>
      </section>

      <section className="core-card" id="core">
        <div>
          <p className="card-label">CORE READY</p>
          <h2>Primul modul este montat.</h2>
          <p>
            Când această pagină apare pe domeniul Vercel, putem continua cu
            următorul ZIP fără să acumulăm erori ascunse.
          </p>
        </div>

        <ul>
          {coreItems.map((item) => (
            <li key={item}>
              <span aria-hidden="true">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <footer>
        <span>FishCast România</span>
        <span>Sprint 1 · Core</span>
      </footer>
    </main>
  );
}
