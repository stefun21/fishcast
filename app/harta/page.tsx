import LakesMap from '@/components/LakesMap'

export default function MapPage() {
  return (
    <div className="container page">
      <p className="eyebrow">HARTA ROMÂNIEI</p>
      <h1>Explorează locurile de pescuit</h1>
      <p className="lead">Folosește geolocația, căutarea și filtrele pentru a descoperi rapid locațiile potrivite.</p>
      <LakesMap />
    </div>
  )
}
