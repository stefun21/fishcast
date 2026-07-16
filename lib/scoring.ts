export function fishingScore(input:{pressure:number;wind:number;gust:number;rain:number;cloud:number;temp:number;hour:number;pressureTrend?:number}){
  let score=58
  if(input.pressure>=1008&&input.pressure<=1023) score+=10; else score-=5
  const trend=Math.abs(input.pressureTrend||0); if(trend<=1.5) score+=8; else if(trend>4) score-=12
  if(input.wind>=4&&input.wind<=18) score+=9; else if(input.wind>28) score-=16
  if(input.gust>45) score-=22
  if(input.rain>4) score-=15; else if(input.rain>0&&input.rain<1.5) score+=3
  if(input.cloud>=35&&input.cloud<=85) score+=6
  if(input.temp>=8&&input.temp<=25) score+=7; else if(input.temp>32||input.temp<1) score-=12
  if(input.hour<=8||input.hour>=18) score+=10
  score=Math.max(5,Math.min(98,Math.round(score)))
  return {score,verdict:score>=82?'Condiții foarte bune':score>=68?'Condiții bune':score>=50?'Condiții mixte':'Mai bine amână'}
}
