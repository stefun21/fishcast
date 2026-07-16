import Link from 'next/link'
import { Fish, Heart, Map, Home } from 'lucide-react'
import InstallPwa from './InstallPwa'
export default function Header(){return <header className="topbar"><Link className="brand" href="/"><span className="logo"><Fish size={22}/></span><span>FishCast <b>România</b></span></Link><nav><Link href="/"><Home size={17}/>Acasă</Link><Link href="/harta"><Map size={17}/>Explorează</Link><Link href="/favorite"><Heart size={17}/>Favorite</Link><InstallPwa/></nav></header>}
