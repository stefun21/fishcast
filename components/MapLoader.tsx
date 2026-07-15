'use client';
import dynamic from 'next/dynamic';import {Lake} from '@/lib/types';
const MapClient=dynamic(()=>import('./MapClient'),{ssr:false,loading:()=> <div className="map-loading">Se încarcă harta...</div>});
export default function MapLoader(props:{lakes:Lake[];center?:[number,number];height?:string}){return <MapClient {...props}/>}
