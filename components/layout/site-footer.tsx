import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <strong>FishCast România</strong>
          <p>Catalog național, hartă, vreme live și recomandări pentru următoarea partidă.</p>
        </div>
        <nav aria-label="Linkuri secundare">
          <Link href="/lakes">Vezi toate locațiile</Link>
          <Link href="/explore">Hartă</Link>
          <Link href="/favorites">Favorite</Link>
        </nav>
      </div>
      <p className="site-footer-note">
        Verifică întotdeauna accesul, regulamentul și condițiile locale înainte de deplasare.
      </p>
    </footer>
  );
}
