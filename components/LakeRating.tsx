'use client';
import {useEffect,useState} from 'react';
import {Star,ShieldCheck} from 'lucide-react';

export default function LakeRating({lakeId,fishcastRating}:{lakeId:string;fishcastRating:number}){
  const key=`fishcast-user-rating:${lakeId}`;
  const [userRating,setUserRating]=useState(0);
  useEffect(()=>{const saved=Number(localStorage.getItem(key)||0);if(saved>=1&&saved<=5)setUserRating(saved)},[key]);
  function rate(value:number){setUserRating(value);localStorage.setItem(key,String(value))}
  return <section className="panel rating-panel">
    <div className="section-title"><div><span className="eyebrow">Evaluare fără API extern</span><h2>Scorul bălții</h2></div></div>
    <div className="rating-summary">
      <div className="rating-score"><Star fill="currentColor"/><strong>{fishcastRating.toFixed(1)}</strong><span>/ 5</span></div>
      <div><h3>Scor FishCast</h3><p>Scor editorial calculat din acces, facilități, varietatea speciilor, program și informațiile disponibile pentru baltă.</p></div>
    </div>
    <div className="personal-rating">
      <div><ShieldCheck/><div><strong>Nota ta</strong><span>Se salvează doar pe dispozitivul tău.</span></div></div>
      <div className="rating-stars" aria-label="Acordă o notă">
        {[1,2,3,4,5].map(value=><button key={value} onClick={()=>rate(value)} aria-label={`${value} stele`}><Star fill={value<=userRating?'currentColor':'none'}/></button>)}
      </div>
      {userRating>0&&<small>Ai acordat {userRating} din 5 stele.</small>}
    </div>
    <p className="source-note">Acesta nu este un rating public agregat. Pentru note comune între toți utilizatorii ar fi necesară o bază de date, de exemplu Supabase.</p>
  </section>
}
