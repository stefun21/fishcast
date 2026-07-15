import type {Metadata} from 'next';import './globals.css';import Header from '@/components/Header';
export const metadata:Metadata={title:'FishCast România',description:'Descoperă bălți, verifică activitatea peștilor și planifică partida de pescuit.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ro"><body><Header/>{children}<footer><div className="shell">FishCast România · Datele despre activitate sunt estimative și nu garantează capturi.</div></footer></body></html>}
