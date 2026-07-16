import { notFound } from 'next/navigation'
import { getLakeBySlug } from '@/lib/lakes'
import WeatherPanel from '@/components/WeatherPanel'
import ModeTags from '@/components/ModeTags'
import FavoriteButton from '@/components/FavoriteButton'
import { MapPin, Clock, Wallet, Phone, Globe, Navigation, ShieldCheck, Fish, ParkingCircle } from 'lucide-react'

export default async function LakePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const l = getLakeBySlug(slug)
  if (!l) notFound()
  const maps = `https://www.google.com/maps/dir/?api=1&destination=${l.latitude},${l.longitude}`
  const waze = `https://waze.com/ul?ll=${l.latitude}%2C${l.longitude}&navigate=yes`
  return <div className="container lake-page"><section className="lake-hero"><div><p className="eyebrow">{l.county || 'România'} · {l.locality || 'locație cartografiată'}</p><h1>{l.name}</h1><ModeTags modes={l.fishingModes}/><p>{l.description || 'Locație preluată automat din date publice. Verifică informațiile înainte de deplasare.'}</p><div className="actions"><a className="btn" href={maps} target="_blank" rel="noreferrer"><Navigation size={18}/>Google Maps</a><a className="btn secondary" href={waze} target="_blank" rel="noreferrer">Waze</a><FavoriteButton id={l.id}/></div></div><div className="verified-box"><ShieldCheck/><b>{l.verificationStatus === 'verified' ? 'Locație verificată' : l.verificationStatus === 'community-confirmed' ? 'Confirmată comunitar' : 'Date publice nevalidate complet'}</b><span>{l.verifiedAt ? `Ultima verificare: ${new Date(l.verifiedAt).toLocaleDateString('ro-RO')}` : `Sincronizată automat${l.lastSyncedAt ? `: ${new Date(l.lastSyncedAt).toLocaleDateString('ro-RO')}` : ''}`}</span>{l.sourceUrl && <a href={l.sourceUrl} target="_blank" rel="noreferrer">Sursa: {l.sourceName || 'deschide'}</a>}</div></section><section className="details-grid"><div><MapPin/><span>Coordonate</span><b>{l.latitude.toFixed(5)}, {l.longitude.toFixed(5)}</b></div><div><Clock/><span>Program</span><b>{l.openingHours || 'Nespecificat în sursă'}</b></div><div><Wallet/><span>Tarif</span><b>{l.priceInfo || 'Nespecificat în sursă'}</b></div><div><Fish/><span>Specii</span><b>{l.species.join(', ') || 'Neconfirmate'}</b></div><div><ParkingCircle/><span>Facilități</span><b>{l.facilities.join(', ') || 'Neconfirmate'}</b></div><div><Phone/><span>Contact</span><b>{l.phone || 'Nedisponibil'}</b></div></section>{l.website && <a className="official" href={l.website} target="_blank" rel="noreferrer"><Globe/>Deschide pagina oficială</a>}<WeatherPanel lat={l.latitude} lng={l.longitude}/></div>
}
