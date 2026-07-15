export function fishingScore(x:{pressure:number;wind:number;gust:number;rain:number;cloud:number;temp:number;hour:number}){
  let score=62
  if(x.pressure>=1008&&x.pressure<=1023) score+=10; else if(x.pressure<995||x.pressure>1033) score-=12
  if(x.wind>=5&&x.wind<=18) score+=9; else if(x.wind>30) score-=18
  if(x.gust>45) score-=18
  if(x.rain>4) score-=14; else if(x.rain>0&&x.rain<=1.5) score+=4
  if(x.cloud>=45&&x.cloud<=90) score+=6
  if(x.temp>=8&&x.temp<=26) score+=5; else if(x.temp>34||x.temp<1) score-=12
  if(x.hour<=8||x.hour>=18) score+=8
  score=Math.max(5,Math.min(98,Math.round(score)))
  return {score,verdict:score>=80?'Excelent':score>=65?'Bun':score>=48?'Moderat':'Slab'}
}
