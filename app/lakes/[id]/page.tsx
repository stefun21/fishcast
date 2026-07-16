import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/lakes/favorite-button";
import { LiveWeather } from "@/components/weather/live-weather";
import { Icon } from "@/components/ui/icon";
import { demoLakes, getLakeById } from "@/data/lakes";

export function generateStaticParams() {
  return demoLakes.map((lake) => ({ id: lake.id }));
}

export default async function LakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lake = getLakeById(id);
  if (!lake) notFound();

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lake.latitude},${lake.longitude}`;
  const wazeUrl = `https://www.waze.com/ul?ll=${lake.latitude},${lake.longitude}&navigate=yes`;

  return (
    <main className="page-content lake-detail-page">
      <Link className="text-link detail-back" href="/explore">← Înapoi la explorare</Link>
      <section className={`lake-detail-hero lake-tone-${lake.tone}`}>
        <div className="lake-card-pattern" aria-hidden="true" />
        <div className="lake-detail-copy">
          <p className="section-kicker">{lake.locality} · {lake.county}</p>
          <h1>{lake.name}</h1>
          <p>{lake.description}</p>
          <div className="lake-tags">{lake.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </div>
        <div className="detail-score"><small>INDEX DEMO</small><strong>{lake.score}</strong></div>
        <FavoriteButton id={lake.id} name={lake.name} />
      </section>

      <LiveWeather latitude={lake.latitude} longitude={lake.longitude} />

      <section className="detail-grid">
        <article className="detail-panel">
          <p className="section-kicker">LOCALIZARE</p>
          <h2>Coordonate și distanță</h2>
          <div className="detail-metrics">
            <span><Icon name="location" size={19} /><small>Latitudine</small><strong>{lake.latitude.toFixed(4)}</strong></span>
            <span><Icon name="location" size={19} /><small>Longitudine</small><strong>{lake.longitude.toFixed(4)}</strong></span>
            <span><Icon name="location" size={19} /><small>Distanță demo</small><strong>{lake.distanceKm} km</strong></span>
          </div>
        </article>

        <article className="detail-panel">
          <p className="section-kicker">SPECII ȘI FACILITĂȚI</p>
          <h2>Ce găsești aici</h2>
          <div className="detail-columns">
            <div><strong>Specii</strong>{lake.species.map((item) => <span key={item}>{item}</span>)}</div>
            <div><strong>Facilități</strong>{lake.facilities.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
        </article>
      </section>

      <section className="navigation-panel">
        <div><p className="section-kicker">NAVIGAȚIE</p><h2>Pornește la drum</h2></div>
        <div className="navigation-actions">
          <a className="primary-button" href={mapsUrl} target="_blank" rel="noreferrer">Google Maps <Icon name="arrow" size={17} /></a>
          <a className="ghost-button" href={wazeUrl} target="_blank" rel="noreferrer">Waze <Icon name="arrow" size={17} /></a>
        </div>
      </section>
    </main>
  );
}
