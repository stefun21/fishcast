'use client'

import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import Link from 'next/link'
import type { Lake } from '@/lib/types'
import { LocateFixed, Search } from 'lucide-react'

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 9), { animate: true })
  }, [center, map])
  return null
}

export default function LakesMapClient() {
  const [lakes, setLakes] = useState<Lake[]>([])
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [message, setMessage] = useState('Permite locația pentru rezultate ordonate după distanță.')

  async function load(nextCoords = coords, nextQuery = query, nextMode = mode) {
    const params = new URLSearchParams()
    if (nextCoords) {
      params.set('lat', String(nextCoords.lat))
      params.set('lng', String(nextCoords.lng))
    }
    if (nextQuery.trim()) params.set('q', nextQuery.trim())
    if (nextMode) params.set('mode', nextMode)
    const response = await fetch(`/api/lakes?${params.toString()}`)
    const payload = await response.json()
    setLakes(payload.lakes || [])
  }

  useEffect(() => {
    load(null, '', '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function locate() {
    if (!navigator.geolocation) {
      setMessage('Geolocația nu este disponibilă în acest browser.')
      return
    }
    setMessage('Căutăm poziția ta…')
    navigator.geolocation.getCurrentPosition(
      position => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude }
        setCoords(next)
        setMessage('Locațiile sunt ordonate după distanța față de tine.')
        load(next, query, mode)
      },
      () => setMessage('Nu ai permis accesul la locație.'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 }
    )
  }

  const center = useMemo<[number, number]>(() => {
    if (coords) return [coords.lat, coords.lng]
    if (lakes[0]) return [lakes[0].latitude, lakes[0].longitude]
    return [45.8, 24.9]
  }, [coords, lakes])

  return (
    <>
      <section className="search-panel map-search-panel">
        <div className="search">
          <Search size={20} />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && load()}
            placeholder="Caută baltă, județ sau localitate…"
          />
          <button onClick={() => load()}>Caută</button>
        </div>
        <div className="filters">
          <button className="locate" onClick={locate}><LocateFixed size={18} />Poziția mea</button>
          <span className="hint">{message}</span>
          <select value={mode} onChange={event => { setMode(event.target.value); load(coords, query, event.target.value) }}>
            <option value="">Toate regimurile</option>
            <option value="retention">Cu reținere</option>
            <option value="catch-release">Fără reținere</option>
          </select>
        </div>
      </section>

      <div className="map-shell">
        <MapContainer center={center} zoom={7} scrollWheelZoom className="leaflet-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter center={center} />
          {coords && <CircleMarker center={[coords.lat, coords.lng]} radius={9} pathOptions={{ weight: 4 }}><Popup>Poziția ta</Popup></CircleMarker>}
          {lakes.map(lake => (
            <CircleMarker key={lake.id} center={[lake.latitude, lake.longitude]} radius={7} pathOptions={{ weight: 2 }}>
              <Popup>
                <div className="map-popup">
                  <strong>{lake.name}</strong>
                  <span>{[lake.locality, lake.county].filter(Boolean).join(', ') || 'România'}</span>
                  {typeof lake.distanceKm === 'number' && <span>{lake.distanceKm} km de tine</span>}
                  <Link href={`/balta/${lake.slug}`}>Vezi detalii</Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p className="map-result-count">{lakes.length} locații afișate pe hartă.</p>
    </>
  )
}
