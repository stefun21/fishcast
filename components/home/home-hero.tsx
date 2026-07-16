import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export function HomeHero() {
  return (
    <section className="home-hero">
      <div className="hero-content">
        <div className="hero-status">
          <span className="status-dot" /> Platformă pentru pescarii din România
        </div>
        <h1>Unde merită să pescuiești astăzi?</h1>
        <p>
          Descoperă locuri, compară distanțe și pregătește partida potrivită.
          Vremea live și Fishing Index se montează în puzzle-urile următoare.
        </p>

        <form className="hero-search" action="/explore">
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
          <Link className="primary-button" href="/explore">
            <Icon name="map" size={18} /> Explorează harta
          </Link>
          <button className="ghost-button" type="button">
            <Icon name="location" size={18} /> Folosește locația mea
          </button>
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
