import { NextRequest, NextResponse } from 'next/server'
import { fishingScore } from '@/lib/scoring'
export const revalidate = 900
export async function GET(req: NextRequest) {
  const lat=Number(req.nextUrl.searchParams.get('lat')), lng=Number(req.nextUrl.searchParams.get('lng'))
  if(!Number.isFinite(lat)||!Number.isFinite(lng)) return NextResponse.json({error:'Coordonate invalide'},{status:400})
  const hourly=['temperature_2m','apparent_temperature','relative_humidity_2m','precipitation_probability','precipitation','weather_code','cloud_cover','visibility','pressure_msl','surface_pressure','wind_speed_10m','wind_gusts_10m','wind_direction_10m'].join(',')
  const daily=['sunrise','sunset','temperature_2m_max','temperature_2m_min'].join(',')
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=${hourly}&daily=${daily}&timezone=auto&forecast_days=7&past_days=1`
  const res=await fetch(url,{next:{revalidate:900}})
  if(!res.ok) return NextResponse.json({error:'Serviciul meteo nu răspunde'},{status:502})
  const d=await res.json(), now=Date.now(); let closest=0,min=Infinity
  d.hourly.time.forEach((t:string,i:number)=>{const diff=Math.abs(new Date(t).getTime()-now);if(diff<min){min=diff;closest=i}})
  const hours=d.hourly.time.slice(closest,closest+48).map((time:string,j:number)=>{const i=closest+j; const pressure=d.hourly.pressure_msl[i] ?? d.hourly.surface_pressure[i]; const previous=d.hourly.pressure_msl[Math.max(0,i-3)] ?? pressure; const pressureTrend=Number((pressure-previous).toFixed(1)); const s=fishingScore({pressure,wind:d.hourly.wind_speed_10m[i],gust:d.hourly.wind_gusts_10m[i],rain:d.hourly.precipitation[i],cloud:d.hourly.cloud_cover[i],temp:d.hourly.temperature_2m[i],hour:new Date(time).getHours(),pressureTrend}); return {time,temperature:d.hourly.temperature_2m[i],apparentTemperature:d.hourly.apparent_temperature[i],pressure,pressureTrend,humidity:d.hourly.relative_humidity_2m[i],precipitationProbability:d.hourly.precipitation_probability[i],precipitation:d.hourly.precipitation[i],cloudCover:d.hourly.cloud_cover[i],visibility:d.hourly.visibility[i],windSpeed:d.hourly.wind_speed_10m[i],windGusts:d.hourly.wind_gusts_10m[i],weatherCode:d.hourly.weather_code[i],...s}})
  const rows=d.daily.time.map((date:string,i:number)=>{const day=hours.filter((h:any)=>h.time.startsWith(date));return {date,sunrise:d.daily.sunrise[i],sunset:d.daily.sunset[i],max:d.daily.temperature_2m_max[i],min:d.daily.temperature_2m_min[i],score:Math.round(day.reduce((a:number,h:any)=>a+h.score,0)/Math.max(1,day.length))}})
  const current=hours[0], explanation:string[]=[], warnings:string[]=[]
  explanation.push(Math.abs(current.pressureTrend)<=1.5?'Presiunea este relativ stabilă în ultimele ore':current.pressureTrend>0?'Presiunea este în creștere':'Presiunea este în scădere')
  explanation.push(current.windSpeed<=20?'Vântul este gestionabil pentru majoritatea tehnicilor':'Vântul poate îngreuna lansarea și prezentarea momelii')
  explanation.push(current.precipitationProbability<40?'Risc redus de precipitații':'Există probabilitate crescută de ploaie')
  if(current.windGusts>=45) warnings.push('Rafale puternice: evită barca și zonele expuse.')
  if(current.weatherCode>=95) warnings.push('Risc de furtună. Amână partida dacă apar descărcări electrice.')
  if(current.visibility<1000) warnings.push('Vizibilitate redusă în zonă.')
  const recent=d.hourly.temperature_2m.slice(Math.max(0,closest-72),closest+1); const avg=recent.reduce((a:number,b:number)=>a+b,0)/Math.max(1,recent.length); const water=Math.round(avg*0.72+4)
  return NextResponse.json({current,hourly:hours,daily:rows,waterTemperatureEstimate:water,explanation,warnings,source:'Open-Meteo · analiză FishCast'})
}
