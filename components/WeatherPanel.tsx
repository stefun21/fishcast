'use client'
import { useEffect,useState } from 'react'
import type { CSSProperties } from 'react'
import { WeatherPayload } from '@/lib/types'
import { Wind,Gauge,Droplets,CloudRain,Sunrise,Thermometer,LoaderCircle,TriangleAlert } from 'lucide-react'
export default function WeatherPanel({lat,lng}:{lat:number,lng:number}){
 const[d,setD]=useState<WeatherPayload|null>(null); const[error,setError]=useState('')
 useEffect(()=>{setD(null);fetch(`/api/weather?lat=${lat}&lng=${lng}`).then(async r=>{if(!r.ok)throw new Error('Prognoza nu este disponibilă momentan');return r.json()}).then(setD).catch(e=>setError(e.message))},[lat,lng])
 if(error)return <div className="weather empty"><TriangleAlert/> {error}</div>
 if(!d)return <div className="weather loading"><LoaderCircle className="spin"/>Analizăm condițiile…</div>
 return <section className="weather"><div className="score-card"><div><p className="eyebrow">FISHING SCORE ACUM</p><div className="big-score">{d.current.score}<small>/100</small></div><h3>{d.current.verdict}</h3></div><div className="score-ring" style={{'--score':`${d.current.score*3.6}deg`} as CSSProperties}></div></div>{d.warnings?.length>0&&<div className="weather-warnings">{d.warnings.map(x=><p key={x}><TriangleAlert size={18}/>{x}</p>)}</div>}<div className="weather-grid"><div><Thermometer/><b>{d.current.temperature}°C</b><span>Aer</span></div><div><Gauge/><b>{Math.round(d.current.pressure)} hPa</b><span>Presiune ({d.current.pressureTrend>0?'+':''}{d.current.pressureTrend})</span></div><div><Wind/><b>{d.current.windSpeed} km/h</b><span>Vânt · rafale {d.current.windGusts}</span></div><div><CloudRain/><b>{d.current.precipitationProbability}%</b><span>Ploaie</span></div><div><Droplets/><b>{d.current.humidity}%</b><span>Umiditate</span></div><div><Sunrise/><b>~{d.waterTemperatureEstimate}°C</b><span>Apă estimată</span></div></div><div className="analysis"><h3>Analiza FishCast</h3>{d.explanation.map(x=><p key={x}>✓ {x}</p>)}<small>Temperatura apei este o estimare, nu o măsurătoare. Date meteo: {d.source}.</small></div><h3 className="timeline-title">Următoarele 12 ore</h3><div className="timeline">{d.hourly.slice(0,12).map(h=><div key={h.time}><span>{new Date(h.time).toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})}</span><b>{h.score}</b><small>{h.temperature}°</small></div>)}</div></section>
}
