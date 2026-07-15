import { NextRequest, NextResponse } from 'next/server'
import { fishingScore } from '@/lib/scoring'

export const revalidate = 900

export async function GET(req:NextRequest){
  const lat=Number(req.nextUrl.searchParams.get('lat')); const lng=Number(req.nextUrl.searchParams.get('lng'))
  if(!Number.isFinite(lat)||!Number.isFinite(lng)) return NextResponse.json({error:'Coordonate invalide'},{status:400})
  const vars=['temperature_2m','apparent_temperature','relative_humidity_2m','precipitation_probability','precipitation','weather_code','cloud_cover','surface_pressure','wind_speed_10m','wind_gusts_10m'].join(',')
  const daily=['sunrise','sunset','temperature_2m_max','temperature_2m_min'].join(',')
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=${vars}&daily=${daily}&timezone=auto&forecast_days=7&past_days=1`
  const res=await fetch(url,{next:{revalidate:900}})
  if(!res.ok) return NextResponse.json({error:'Serviciul meteo nu răspunde'},{status:502})
  const d=await res.json(); const now=Date.now(); let closest=0; let min=Infinity
  d.hourly.time.forEach((t:string,i:number)=>{const diff=Math.abs(new Date(t).getTime()-now);if(diff<min){min=diff;closest=i}})
  const hours=d.hourly.time.slice(closest,closest+48).map((time:string,j:number)=>{
    const i=closest+j; const s=fishingScore({pressure:d.hourly.surface_pressure[i],wind:d.hourly.wind_speed_10m[i],gust:d.hourly.wind_gusts_10m[i],rain:d.hourly.precipitation[i],cloud:d.hourly.cloud_cover[i],temp:d.hourly.temperature_2m[i],hour:new Date(time).getHours()})
    return {time,temperature:d.hourly.temperature_2m[i],apparentTemperature:d.hourly.apparent_temperature[i],pressure:d.hourly.surface_pressure[i],humidity:d.hourly.relative_humidity_2m[i],precipitationProbability:d.hourly.precipitation_probability[i],precipitation:d.hourly.precipitation[i],cloudCover:d.hourly.cloud_cover[i],windSpeed:d.hourly.wind_speed_10m[i],windGusts:d.hourly.wind_gusts_10m[i],weatherCode:d.hourly.weather_code[i],...s}
  })
  const dailyRows=d.daily.time.map((date:string,i:number)=>({date,sunrise:d.daily.sunrise[i],sunset:d.daily.sunset[i],max:d.daily.temperature_2m_max[i],min:d.daily.temperature_2m_min[i],score:Math.round(hours.filter((h:any)=>h.time.startsWith(date)).reduce((a:number,h:any)=>a+h.score,0)/Math.max(1,hours.filter((h:any)=>h.time.startsWith(date)).length))}))
  const current=hours[0]
  const explanation=[]
  explanation.push(current.pressure>=1008&&current.pressure<=1023?'Presiune într-un interval favorabil':'Presiune în afara intervalului optim')
  explanation.push(current.windSpeed<=20?'Vânt controlabil pentru majoritatea tehnicilor':'Vânt puternic; verifică siguranța pe mal')
  explanation.push(current.precipitationProbability<40?'Risc redus de precipitații':'Probabilitate crescută de ploaie')
  const water=Math.round((d.hourly.temperature_2m.slice(Math.max(0,closest-72),closest+1).reduce((a:number,b:number)=>a+b,0)/Math.max(1,Math.min(73,closest+1)))*0.72+4)
  return NextResponse.json({current,hourly:hours,daily:dailyRows,waterTemperatureEstimate:water,explanation,source:'Open-Meteo · estimare FishCast'})
}
