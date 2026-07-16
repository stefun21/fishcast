"use client";

import { useEffect, useMemo, useState } from "react";
import { LakeCard } from "@/components/lakes/lake-card";
import { LakeMap } from "@/components/map/lake-map";
import { Icon } from "@/components/ui/icon";
import { demoLakes } from "@/data/lakes";
import { distanceKm } from "@/lib/geo";
import type { FishingMode, Lake, LakeCategory, LakeConfidence } from "@/types/lake";

type Position = { latitude: number; longitude: number } | null;
type ViewMode = "map" | "list";
type CategoryFilter = LakeCategory | "all";
type ConfidenceFilter = LakeConfidence | "all";

const SETTINGS_KEY = "fishcast-explorer-settings-v1";
const LIVE_CACHE_KEY = "fishcast-live-lakes-v1";
const LIVE_CACHE_TTL = 6 * 60 * 60 * 1000;
const RADII = [25, 50, 80, 100] as const;

const keyFor = (lake: Lake) => `${lake.name.toLocaleLowerCase("ro")}|${lake.latitude.toFixed(4)}|${lake.longitude.toFixed(4)}`;

export function LakeExplorer() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FishingMode | "all">("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [confidence, setConfidence] = useState<ConfidenceFilter>("all");
  const [radius, setRadius] = useState<(typeof RADII)[number]>(50);
  const [view, setView] = useState<ViewMode>("map");
  const [position, setPosition] = useState<Position>(null);
  const [liveLakes, setLiveLakes] = useState<Lake[]>([]);
  const [locationStatus, setLocationStatus] = useState("Folosește locația pentru sortare și descoperire live");
  const [loadingLive, setLoadingLive] = useState(false);

  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null") as {
        radius?: number;
        category?: CategoryFilter;
        confidence?: ConfidenceFilter;
        view?: ViewMode;
      } | null;
      if (settings?.radius && RADII.includes(settings.radius as (typeof RADII)[number])) setRadius(settings.radius as (typeof RADII)[number]);
      if (settings?.category) setCategory(settings.category);
      if (settings?.confidence) setConfidence(settings.confidence);
      if (settings?.view) setView(settings.view);

      const cached = JSON.parse(localStorage.getItem(LIVE_CACHE_KEY) || "null") as {
        createdAt?: number;
        position?: Position;
        lakes?: Lake[];
        radius?: number;
      } | null;
      if (cached?.createdAt && Date.now() - cached.createdAt < LIVE_CACHE_TTL && cached.lakes?.length) {
        setLiveLakes(cached.lakes);
        setPosition(cached.position || null);
        setLocationStatus(`Am restaurat ${cached.lakes.length} locații salvate recent${cached.radius ? ` din raza de ${cached.radius} km` : ""}`);
      }
    } catch {
      // Datele locale invalide sunt ignorate în siguranță.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ radius, category, confidence, view }));
  }, [radius, category, confidence, view]);

  const allLakes = useMemo(() => {
    const map = new Map<string, Lake>();
    for (const lake of demoLakes) map.set(keyFor(lake), lake);
    for (const lake of liveLakes) map.set(keyFor(lake), lake);
    return Array.from(map.values());
  }, [liveLakes]);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ro");
    return allLakes
      .filter((lake) => {
        const searchable = `${lake.name} ${lake.locality} ${lake.county} ${lake.species.join(" ")} ${lake.tags.join(" ")}`.toLocaleLowerCase("ro");
        const modeMatches = mode === "all" || lake.modes.includes(mode);
        const categoryMatches = category === "all" || lake.category === category;
        const confidenceMatches = confidence === "all" || lake.confidence === confidence;
        return (!normalizedQuery || searchable.includes(normalizedQuery)) && modeMatches && categoryMatches && confidenceMatches;
      })
      .map((lake) => ({
        lake,
        distance: position ? distanceKm(position, { latitude: lake.latitude, longitude: lake.longitude }) : lake.distanceKm,
      }))
      .filter(({ distance }) => !position || distance <= radius + 0.5)
      .sort((a, b) => a.distance - b.distance);
  }, [allLakes, category, confidence, mode, position, query, radius]);

  async function discoverNearby(coords: { latitude: number; longitude: number }, forceRadius = radius) {
    setLoadingLive(true);
    setLocationStatus(`Căutăm locuri de pescuit și corpuri de apă în raza de ${forceRadius} km...`);
    try {
      const categories = category === "all"
        ? "fishing,aquaculture,pond,reservoir"
        : category;
      const response = await fetch(`/api/nearby-lakes?lat=${coords.latitude}&lon=${coords.longitude}&radius=${forceRadius}&categories=${categories}`);
      const data = await response.json() as { lakes?: Lake[]; error?: string; cached?: boolean; stale?: boolean; partial?: boolean; diagnostics?: string[] };
      if (!response.ok) throw new Error(data.error || "Căutarea live nu a răspuns");

      const lakes = data.lakes || [];
      setLiveLakes(lakes);
      localStorage.setItem(LIVE_CACHE_KEY, JSON.stringify({ createdAt: Date.now(), position: coords, lakes, radius: forceRadius }));
      const cacheNote = data.stale ? " · rezultate de rezervă" : data.cached ? " · din cache" : data.partial ? " · rezultate parțiale" : "";
      setLocationStatus(`Am descoperit ${lakes.length} locații publice în raza de ${forceRadius} km${cacheNote}`);
    } catch (error) {
      setLocationStatus(error instanceof Error ? error.message : "Căutarea live nu a putut fi efectuată");
    } finally {
      setLoadingLive(false);
    }
  }

  function locateUser() {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocația nu este disponibilă în acest browser");
      return;
    }
    setLocationStatus("Căutăm poziția ta...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { latitude: coords.latitude, longitude: coords.longitude };
        setPosition(next);
        void discoverNearby(next);
      },
      () => setLocationStatus("Permisiunea pentru locație nu a fost acordată"),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 5 * 60 * 1000 },
    );
  }

  function refreshSearch() {
    if (position) void discoverNearby(position);
    else locateUser();
  }

  return <>
    <section className="explorer-toolbar" aria-label="Căutare și filtre">
      <label className="explorer-search">
        <Icon name="search" size={19} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caută baltă, localitate, județ sau specie" />
      </label>
      <button className="location-button" type="button" onClick={refreshSearch} disabled={loadingLive}>
        <Icon name="location" size={18} />
        {loadingLive ? "Descoperim..." : position ? "Actualizează" : "Lângă mine"}
      </button>
    </section>

    <section className="advanced-filter-panel" aria-label="Filtre avansate">
      <div className="filter-control-group">
        <span>Rază</span>
        <div className="filter-row compact-filter-row">
          {RADII.map((value) => <button key={value} className={radius === value ? "filter-chip active" : "filter-chip"} onClick={() => setRadius(value)} type="button">{value} km</button>)}
        </div>
      </div>

      <label className="filter-select-label">
        <span>Tip locație</span>
        <select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)}>
          <option value="all">Toate tipurile</option>
          <option value="fishing">Locuri de pescuit</option>
          <option value="aquaculture">Amenajări piscicole</option>
          <option value="pond">Iazuri</option>
          <option value="reservoir">Acumulări</option>
          <option value="water">Alte corpuri de apă</option>
        </select>
      </label>

      <label className="filter-select-label">
        <span>Încredere date</span>
        <select value={confidence} onChange={(event) => setConfidence(event.target.value as ConfidenceFilter)}>
          <option value="all">Toate nivelurile</option>
          <option value="verified">Verificate</option>
          <option value="likely">Probabil relevante</option>
          <option value="limited">Date limitate</option>
        </select>
      </label>
    </section>

    <div className="explorer-options">
      <div className="filter-row" aria-label="Regim de pescuit">
        <button className={mode === "all" ? "filter-chip active" : "filter-chip"} onClick={() => setMode("all")} type="button">Toate</button>
        <button className={mode === "retention" ? "filter-chip active" : "filter-chip"} onClick={() => setMode("retention")} type="button">Cu reținere</button>
        <button className={mode === "catch-release" ? "filter-chip active" : "filter-chip"} onClick={() => setMode("catch-release")} type="button">Fără reținere</button>
      </div>
      <div className="view-switch" aria-label="Tip afișare">
        <button className={view === "map" ? "active" : ""} onClick={() => setView("map")} type="button"><Icon name="map" size={16} />Hartă</button>
        <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} type="button"><Icon name="home" size={16} />Listă</button>
      </div>
    </div>

    <p className="explorer-status" aria-live="polite">{locationStatus} · {results.length} rezultate afișate</p>
    {view === "map" && results.length > 0 && <LakeMap lakes={results} position={position} />}
    {view === "list" && <div className="lake-grid compact-grid">{results.map(({ lake, distance }) => <LakeCard key={lake.id} lake={lake} compact distance={distance} />)}</div>}
    {results.length === 0 && <div className="inline-empty-state"><strong>Nicio locație găsită</strong><span>Mărește raza, schimbă filtrele sau actualizează căutarea live.</span></div>}
  </>;
}
