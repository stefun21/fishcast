"use client";

import { useMemo, useState } from "react";
import { LakeCard } from "@/components/lakes/lake-card";
import { LakeMap } from "@/components/map/lake-map";
import { Icon } from "@/components/ui/icon";
import { demoLakes } from "@/data/lakes";
import { distanceKm } from "@/lib/geo";
import type { FishingMode } from "@/types/lake";

type Position = { latitude: number; longitude: number } | null;
type ViewMode = "map" | "list";

export function LakeExplorer() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FishingMode | "all">("all");
  const [view, setView] = useState<ViewMode>("map");
  const [position, setPosition] = useState<Position>(null);
  const [locationStatus, setLocationStatus] = useState("Folosește locația pentru sortare");

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ro");
    return demoLakes
      .filter((lake) => {
        const searchable = `${lake.name} ${lake.locality} ${lake.county} ${lake.species.join(" ")}`.toLocaleLowerCase("ro");
        return (!normalized || searchable.includes(normalized)) &&
          (mode === "all" || lake.modes.includes(mode));
      })
      .map((lake) => ({
        lake,
        distance: position
          ? distanceKm(position, { latitude: lake.latitude, longitude: lake.longitude })
          : lake.distanceKm,
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [mode, position, query]);

  function locateUser() {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocația nu este disponibilă în acest browser");
      return;
    }
    setLocationStatus("Căutăm poziția ta...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationStatus("Sortate după distanța față de tine");
      },
      () => setLocationStatus("Permisiunea pentru locație nu a fost acordată"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <>
      <section className="explorer-toolbar" aria-label="Căutare și filtre">
        <label className="explorer-search">
          <Icon name="search" size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută baltă, localitate, județ sau specie"
          />
        </label>
        <button className="location-button" type="button" onClick={locateUser}>
          <Icon name="location" size={18} /> Lângă mine
        </button>
      </section>

      <div className="explorer-options">
        <div className="filter-row" aria-label="Filtre rapide">
          <button className={mode === "all" ? "filter-chip active" : "filter-chip"} onClick={() => setMode("all")} type="button">Toate</button>
          <button className={mode === "retention" ? "filter-chip active" : "filter-chip"} onClick={() => setMode("retention")} type="button">Cu reținere</button>
          <button className={mode === "catch-release" ? "filter-chip active" : "filter-chip"} onClick={() => setMode("catch-release")} type="button">Fără reținere</button>
        </div>
        <div className="view-switch" aria-label="Tip afișare">
          <button className={view === "map" ? "active" : ""} onClick={() => setView("map")} type="button"><Icon name="map" size={16} /> Hartă</button>
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} type="button"><Icon name="home" size={16} /> Listă</button>
        </div>
      </div>

      <p className="explorer-status" aria-live="polite">{locationStatus} · {results.length} rezultate</p>

      {view === "map" && results.length > 0 && <LakeMap lakes={results} position={position} />}

      {view === "list" && (
        <div className="lake-grid compact-grid">
          {results.map(({ lake, distance }) => (
            <LakeCard key={lake.id} lake={lake} compact distance={distance} />
          ))}
        </div>
      )}

      {results.length === 0 && (
        <div className="inline-empty-state">
          <strong>Nicio locație găsită</strong>
          <span>Încearcă alt termen sau resetează filtrul.</span>
        </div>
      )}
    </>
  );
}
