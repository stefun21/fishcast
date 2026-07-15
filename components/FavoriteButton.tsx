'use client';
import {Heart} from 'lucide-react';import {useEffect,useState} from 'react';
const KEY='fishcast-favorites';
export function getFavorites():string[]{if(typeof window==='undefined')return[];try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
export default function FavoriteButton({id,compact=false}:{id:string;compact?:boolean}){const [on,setOn]=useState(false);useEffect(()=>setOn(getFavorites().includes(id)),[id]);function toggle(e:React.MouseEvent){e.preventDefault();e.stopPropagation();const list=getFavorites();const next=on?list.filter(x=>x!==id):[...list,id];localStorage.setItem(KEY,JSON.stringify(next));setOn(!on);window.dispatchEvent(new Event('favorites-changed'));}return <button onClick={toggle} className={`favorite-btn ${on?'active':''}`} aria-label="Salvează la favorite"><Heart size={19} fill={on?'currentColor':'none'}/>{!compact&&(on?'Salvată':'Favorite')}</button>}
