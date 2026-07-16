'use client'

import dynamic from 'next/dynamic'

const LakesMapClient = dynamic(() => import('./LakesMapClient'), {
  ssr: false,
  loading: () => <div className="map-shell map-loading">Se încarcă harta…</div>
})

export default function LakesMap() {
  return <LakesMapClient />
}
