"use client";
import { useEffect, useState } from "react";
type Address = { locality:string; county:string; displayName:string };
export function PlaceEnrichment({ latitude, longitude }:{ latitude:number; longitude:number }) {
  const [address,setAddress]=useState<Address|null>(null); const [status,setStatus]=useState("Identificăm localitatea...");
  useEffect(()=>{ const key=`fishcast-address:${latitude.toFixed(5)},${longitude.toFixed(5)}`; const cached=localStorage.getItem(key);
    if(cached){ try{ setAddress(JSON.parse(cached)); setStatus(""); return; }catch{} }
    fetch(`/api/reverse-geocode?lat=${latitude}&lon=${longitude}`).then(r=>r.ok?r.json():Promise.reject()).then((v:Address)=>{setAddress(v);setStatus("");localStorage.setItem(key,JSON.stringify(v));}).catch(()=>setStatus("Localitatea nu a putut fi identificată automat."));
  },[latitude,longitude]);
  return <div className="place-enrichment" aria-live="polite">{address?<><strong>{address.locality}, {address.county}</strong>{address.displayName&&<small>{address.displayName}</small>}</>:<small>{status}</small>}</div>;
}
