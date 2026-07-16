import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export function HomeHero() {
  return (
    <section className="home-hero">
      <div className="hero-content">
        <div className="hero-status">
          <span className="status-dot" /> Catalog național actualizat automat
        </div>
        <h1>Locul potrivit. Momentul potrivit.</h1>
        <p>
          Descoperă ape din toată România, ordonează-le după distanță și verifică vremea live înainte să pornești la drum.
        </p>

        <form className="hero-search" action="/lakes">
          <span aria-hidden="true"><Icon name="search" size={21} /></span>
          <input
            aria-label="Caută o baltă sau localitate"
            name="q"
            placeholder="Caută baltă, localitate sau județ"
            type="search"
          />
          <button type="submit" aria-label="Pornește căutarea">
            <Icon name="arrow" size={20} />
          </button>
        </form>

        <div className="hero-actions">
          <Link className="primary-button" href="/lakes">
            <Icon name="list" size={18} /> Vezi toate locațiile
          </Link>
          <Link className="ghost-button" href="/explore">
            <Icon name="map" size={18} /> Explorează harta
          </Link>
        </div>
      </div>

      <div className="hero-visual" aria-hidden="true">
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <div className="hero-orbit hero-orbit-three" />
        <span className="hero-pin hero-pin-one"><Icon name="fish" size={18} /></span>
        <span className="hero-pin hero-pin-two"><Icon name="fish" size={16} /></span>
        <span className="hero-pin hero-pin-three"><Icon name="fish" size={15} /></span>
        <div className="hero-score-card">
          <small>FISHING INDEX</small>
          <strong>82</strong>
          <span>Condiții bune</span>
        </div>
      </div>
    </section>
  );
}
