import Link from "next/link";
import { HomeHero } from "@/components/home/home-hero";
import { QuickActions } from "@/components/home/quick-actions";
import { LakeCard } from "@/components/lakes/lake-card";
import { demoLakes } from "@/data/lakes";

export default function HomePage() {
  return (
    <main className="page-content home-page">
      <HomeHero />

      <section className="content-section compact-section" aria-labelledby="quick-actions-title">
        <div className="section-heading visually-hidden">
          <h2 id="quick-actions-title">Acțiuni rapide</h2>
        </div>
        <QuickActions />
      </section>

      <section className="content-section" aria-labelledby="nearby-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">DESCOPERĂ</p>
            <h2 id="nearby-title">Locuri de pescuit</h2>
            <p>
              Explorează catalogul, activează locația și sortează automat rezultatele după distanță.
            </p>
          </div>
          <Link className="text-link" href="/lakes">
            Vezi toate <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="lake-grid">
          {demoLakes.slice(0, 6).map((lake) => (
            <LakeCard key={lake.id} lake={lake} />
          ))}
        </div>
      </section>

      <section className="content-section insight-banner" aria-labelledby="today-title">
        <div className="insight-icon" aria-hidden="true">
          <span>LIVE</span>
        </div>
        <div>
          <p className="section-kicker">FISHING INDEX</p>
          <h2 id="today-title">Condiții calculate pentru fiecare locație</h2>
          <p>
            Presiunea, vântul, rafalele, precipitațiile și temperatura sunt analizate pentru următoarele ore.
          </p>
        </div>
        <Link className="insight-status" href="/lakes">Vezi catalogul</Link>
      </section>
    </main>
  );
}
