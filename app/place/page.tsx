import Link from "next/link";
import { LiveWeather } from "@/components/weather/live-weather";
import { PlaceEnrichment } from "@/components/lakes/place-enrichment";
import { CommunitySources } from "@/components/lakes/community-sources";
import { Icon } from "@/components/ui/icon";
export default async function PublicPlacePage({ searchParams }:{ searchParams:Promise<Record<string,string|string[]|undefined>> }) {
  const p=await searchParams; const name=typeof p.name==="string"?p.name:"Loc de pescuit"; const latitude=Number(typeof p.lat==="string"?p.lat:NaN); const longitude=Number(typeof p.lon==="string"?p.lon:NaN);
  const sourceUrl=typeof p.sourceUrl==="string"?p.sourceUrl:undefined; const source=typeof p.source==="string"?p.source:"Sursă publică"; const category=typeof p.category==="string"?p.category:"water";
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)) return <main className="page-content"><h1>Coordonate invalide</h1></main>;
  const mapsUrl=`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`; const wazeUrl=`https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
  return <main className="page-content lake-detail-page"><Link className="text-link detail-back" href="/explore">← Înapoi la explorare</Link>
    <section className="lake-detail-hero lake-tone-blue"><div className="lake-card-pattern" aria-hidden="true"/><div className="lake-detail-copy"><p className="section-kicker">DESCOPERIT LIVE · {source}</p><h1>{name}</h1><PlaceEnrichment latitude={latitude} longitude={longitude}/><div className="lake-tags"><span>{category==="fishing"?"Loc de pescuit":category==="aquaculture"?"Amenajare piscicolă":"Corp de apă"}</span><span>Date de bază</span></div></div><div className="detail-score"><small>ÎNCREDERE</small><strong>{category==="fishing"?72:56}</strong></div></section>
    <LiveWeather latitude={latitude} longitude={longitude}/><section className="detail-grid"><article className="detail-panel"><p className="section-kicker">LOCALIZARE</p><h2>Coordonate exacte</h2><div className="detail-metrics"><span><Icon name="location" size={19}/><small>Latitudine</small><strong>{latitude.toFixed(5)}</strong></span><span><Icon name="location" size={19}/><small>Longitudine</small><strong>{longitude.toFixed(5)}</strong></span></div></article><CommunitySources name={name} sourceUrl={sourceUrl}/></section>
    <section className="navigation-panel"><div><p className="section-kicker">NAVIGAȚIE</p><h2>Pornește la drum</h2></div><div className="navigation-actions"><a className="primary-button" href={mapsUrl} target="_blank" rel="noreferrer">Google Maps <Icon name="arrow" size={17}/></a><a className="ghost-button" href={wazeUrl} target="_blank" rel="noreferrer">Waze <Icon name="arrow" size={17}/></a></div></section>
  </main>;
}
