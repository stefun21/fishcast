'use client';
import 'leaflet/dist/leaflet.css';
import {MapContainer,TileLayer,Marker,Popup,useMap} from 'react-leaflet';
import L from 'leaflet';import Link from 'next/link';import {useEffect} from 'react';import {Lake} from '@/lib/types';
const icon=L.divIcon({className:'fish-marker',html:'🎣',iconSize:[38,38],iconAnchor:[19,38]});
function Recenter({center}:{center:[number,number]}){const map=useMap();useEffect(()=>{map.setView(center,10)},[center,map]);return null}
export default function MapClient({lakes,center=[44.43,26.1],height='520px'}:{lakes:Lake[];center?:[number,number];height?:string}){return <MapContainer center={center} zoom={9} style={{height,width:'100%'}} scrollWheelZoom><Recenter center={center}/><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{lakes.map(l=><Marker key={l.id} position={[l.lat,l.lng]} icon={icon}><Popup><div className="map-popup"><strong>{l.name}</strong><span>{l.locality}, {l.county}</span><span>⭐ Scor FishCast {l.rating} · {l.price}</span><Link href={`/balta/${l.id}`}>Vezi balta</Link></div></Popup></Marker>)}</MapContainer>}
