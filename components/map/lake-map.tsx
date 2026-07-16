"use client";

import { useEffect, useRef, useState } from "react";
import type { Lake } from "@/types/lake";

type Position = { latitude: number; longitude: number } | null;

export function LakeMap({
  lakes,
  position,
}: {
  lakes: Array<{ lake: Lake; distance: number }>;
  position: Position;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function mountMap() {
      if (!containerRef.current || mapRef.current) return;

      try {
        const L = await import("leaflet");
        if (cancelled || !containerRef.current) return;

        const map = L.map(containerRef.current, {
          center: [45.75, 24.9],
          zoom: 7,
          zoomControl: false,
          preferCanvas: true,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const markers = L.layerGroup().addTo(map);
        mapRef.current = map;
        markersRef.current = markers;
        setMapReady(true);

        window.setTimeout(() => map.invalidateSize(), 50);
      } catch (error) {
        console.error("FishCast map init failed", error);
        setMapError("Harta nu a putut fi încărcată. Reîncearcă după reîmprospătarea paginii.");
      }
    }

    void mountMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;

    async function updateMarkers() {
      const map = mapRef.current;
      const markers = markersRef.current;
      if (!map || !markers) return;

      const L = await import("leaflet");
      markers.clearLayers();

      const bounds = L.latLngBounds([]);
      const renderer = L.canvas({ padding: 0.5 });

      for (const { lake, distance } of lakes) {
        if (!Number.isFinite(lake.latitude) || !Number.isFinite(lake.longitude)) continue;

        const marker = L.circleMarker([lake.latitude, lake.longitude], {
          renderer,
          radius: 9,
          weight: 3,
          color: "#07111d",
          fillColor: "#39e6a4",
          fillOpacity: 0.95,
        });

        const detailsUrl = lake.source === "Catalog FishCast"
          ? `/lakes/${encodeURIComponent(lake.id)}`
          : `/place?name=${encodeURIComponent(lake.name)}&lat=${lake.latitude}&lon=${lake.longitude}&source=${encodeURIComponent(lake.source || "Sursă publică")}&sourceUrl=${encodeURIComponent(lake.sourceUrl || "")}&category=${encodeURIComponent(lake.category || "water")}`;

        marker.bindPopup(`
          <div class="fishcast-popup">
            <small>${lake.locality || "Localitate necunoscută"}${lake.county ? `, ${lake.county}` : ""}</small>
            <strong>${lake.name}</strong>
            <span>${Math.round(distance)} km${lake.score ? ` · Index ${lake.score}` : ""}</span>
            <a href="${detailsUrl}">Vezi detalii</a>
          </div>
        `);

        marker.addTo(markers);
        bounds.extend([lake.latitude, lake.longitude]);
      }

      if (position) {
        L.circleMarker([position.latitude, position.longitude], {
          renderer,
          radius: 8,
          weight: 4,
          color: "#ffffff",
          fillColor: "#2f80ed",
          fillOpacity: 1,
        }).bindTooltip("Poziția ta", { direction: "top" }).addTo(markers);
        bounds.extend([position.latitude, position.longitude]);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [38, 38], maxZoom: 11 });
      }

      window.setTimeout(() => map.invalidateSize(), 50);
    }

    void updateMarkers().catch((error) => {
      console.error("FishCast marker update failed", error);
      setMapError("Marker-ele nu au putut fi afișate. Reîncearcă după reîmprospătarea paginii.");
    });
  }, [lakes, mapReady, position]);

  if (mapError) {
    return <div className="inline-empty-state"><strong>Harta este indisponibilă</strong><span>{mapError}</span></div>;
  }

  return (
    <section className="lake-map-shell" aria-label="Hartă interactivă cu locațiile de pescuit">
      <div ref={containerRef} className="lake-map" />
      <div className="lake-map-caption">
        <span><strong>{lakes.length}</strong> locații pe hartă</span>
        <small>{mapReady ? "Apasă pe un marker pentru detalii" : "Se încarcă harta..."}</small>
      </div>
    </section>
  );
}
