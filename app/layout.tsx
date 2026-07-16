import type { Metadata, Viewport } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import Header from '@/components/Header'
import PwaRegister from '@/components/PwaRegister'

export const metadata: Metadata = {
  title: { default: 'FishCast România', template: '%s · FishCast România' },
  description: 'Bălți verificate, vreme detaliată și scor de pescuit pentru România.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'FishCast' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' }
}
export const viewport: Viewport = { themeColor: '#071915', width: 'device-width', initialScale: 1, viewportFit: 'cover' }
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ro"><body><PwaRegister/><Header/><main>{children}</main><footer><b>FishCast România</b><span>Datele despre locații trebuie confirmate înainte de deplasare. Respectă regulamentele locale și siguranța pe apă.</span></footer></body></html>}
