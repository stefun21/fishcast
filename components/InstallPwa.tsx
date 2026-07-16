'use client'
import { useEffect,useState } from 'react'
import { Download } from 'lucide-react'
type InstallEvent = Event & { prompt:()=>Promise<void>; userChoice:Promise<{outcome:string}> }
export default function InstallPwa(){const[event,setEvent]=useState<InstallEvent|null>(null);useEffect(()=>{const onPrompt=(e:Event)=>{e.preventDefault();setEvent(e as InstallEvent)};window.addEventListener('beforeinstallprompt',onPrompt);return()=>window.removeEventListener('beforeinstallprompt',onPrompt)},[]);if(!event)return null;return <button className="install-pwa" onClick={async()=>{await event.prompt();await event.userChoice;setEvent(null)}}><Download size={17}/>Instalează aplicația</button>}
