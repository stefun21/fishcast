import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <strong>FishCast România</strong>
          <p>Locuri de pescuit, vreme live și recomandări bazate pe condițiile reale.</p>
        </div>
        <nav aria-label="Linkuri secundare">
          <Link href="/explore">Explorează</Link>
          <Link href="/favorites">Favorite</Link>
        </nav>
      </div>
      <p className="site-footer-note">
        Verifică întotdeauna regulamentul și condițiile locale înainte de deplasare.
      </p>
    </footer>
  );
}
