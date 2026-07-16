"use client";
import { useEffect, useMemo, useState } from "react";

type Lake = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  locality?: string | null;
  county?: string | null;
  website?: string | null;
  phone?: string | null;
  openingHours?: string | null;
  fishingModes?: string[];
  sourceUrl?: string | null;
  confidence?: "high" | "medium" | "limited";
};

type LocatedLake = Lake & { distanceKm?: number };

function distanceKm(aLat:number,aLon:number,bLat:number,bLon:number){
  const r=6371; const dLat=(bLat-aLat)*Math.PI/180; const dLon=(bLon-aLon)*Math.PI/180;
  const x=Math.sin(dLat/2)**2+Math.cos(aLat*Math.PI/180)*Math.cos(bLat*Math.PI/180)*Math.sin(dLon/2)**2;
  return 2*r*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

export default function LakesExplorer({ lakes }: { lakes: Lake[] }) {
  const [query,setQuery]=useState("");
  const [position,setPosition]=useState<{lat:number;lon:number}|null>(null);
  const [favorites,setFavorites]=useState<string[]>([]);
  const [onlyFavorites,setOnlyFavorites]=useState(false);

  useEffect(()=>{ try{setFavorites(JSON.parse(localStorage.getItem("fishcast-favorites")||"[]"));}catch{} },[]);
  const toggle=(id:string)=>setFavorites(prev=>{const next=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];localStorage.setItem("fishcast-favorites",JSON.stringify(next));return next;});
  const locate=()=>navigator.geolocation?.getCurrentPosition(p=>setPosition({lat:p.coords.latitude,lon:p.coords.longitude}),()=>alert("Locația nu a putut fi obținută."),{enableHighAccuracy:true,timeout:12000});

  const visible=useMemo<LocatedLake[]>(()=>{
    const q=query.trim().toLocaleLowerCase("ro");
    return lakes
      .filter(l=>!onlyFavorites||favorites.includes(l.id))
      .filter(l=>!q||[l.name,l.locality,l.county].filter(Boolean).join(" ").toLocaleLowerCase("ro").includes(q))
      .map<LocatedLake>(l=>position?{...l,distanceKm:distanceKm(position.lat,position.lon,l.lat,l.lon)}:{...l})
      .sort((a,b)=>position?(a.distanceKm??Infinity)-(b.distanceKm??Infinity):a.name.localeCompare(b.name,"ro"));
  },[lakes,query,position,onlyFavorites,favorites]);

  return <>
    <section className="hero">
      <div className="eyebrow">ASISTENT PENTRU PESCUIT</div>
      <h1>Descoperă unde merită să pescuiești.</h1>
      <p>Locații actualizate automat din date publice, ordonate după distanță, fără cont și fără chei API.</p>
      <div className="controls">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Caută baltă, localitate sau județ" aria-label="Caută" />
        <button onClick={locate}>Folosește locația mea</button>
        <button className={onlyFavorites?"secondary active":"secondary"} onClick={()=>setOnlyFavorites(v=>!v)}>Favorite ({favorites.length})</button>
      </div>
    </section>
    <section className="summary"><strong>{visible.length}</strong> locații afișate {position&&<span>• sortate după distanță</span>}</section>
    <section className="grid">
      {visible.slice(0,300).map(l=><article className="lake" key={l.id}>
        <div className="lakeTop"><span className={`badge ${l.confidence||"limited"}`}>{l.confidence==="high"?"Date bogate":l.confidence==="medium"?"Date parțiale":"Date limitate"}</span><button className="heart" onClick={()=>toggle(l.id)} aria-label="Favorite">{favorites.includes(l.id)?"♥":"♡"}</button></div>
        <h2>{l.name}</h2>
        <p className="place">{[l.locality,l.county].filter(Boolean).join(", ")||"Localitate necunoscută"}</p>
        {l.distanceKm!=null&&<p className="distance">{l.distanceKm.toFixed(1)} km</p>}
        <div className="tags">{(l.fishingModes||[]).map(m=><span key={m}>{m==="retention"?"Cu reținere":"Fără reținere"}</span>)}</div>
        <div className="actions">
          <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lon}`}>Google Maps</a>
          <a target="_blank" rel="noreferrer" href={`https://waze.com/ul?ll=${l.lat}%2C${l.lon}&navigate=yes`}>Waze</a>
          {l.sourceUrl&&<a target="_blank" rel="noreferrer" href={l.sourceUrl}>Sursă</a>}
        </div>
      </article>)}
    </section>
  </>;
}
