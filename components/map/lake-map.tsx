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
  const clusterRef = useRef<import("leaflet").MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<import("leaflet").CircleMarker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function mountMap() {
      if (!containerRef.current || mapRef.current) return;

      try {
        const L = await import("leaflet");
        await import("leaflet.markercluster");
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

        const clusters = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 46,
          spiderfyOnMaxZoom: true,
          removeOutsideVisibleBounds: true,
        });
        clusters.addTo(map);

        mapRef.current = map;
        clusterRef.current = clusters;
        setMapReady(true);
        requestAnimationFrame(() => map.invalidateSize());
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
      clusterRef.current = null;
      userMarkerRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;

    async function updateMarkers() {
      const map = mapRef.current;
      const clusters = clusterRef.current;
      if (!map || !clusters) return;

      const L = await import("leaflet");
      clusters.clearLayers();

      const bounds = L.latLngBounds([]);
      for (const { lake, distance } of lakes) {
        const icon = L.divIcon({
          className: "fishcast-map-icon-wrap",
          html: `<span class="fishcast-map-icon" aria-label="${lake.name}"><span>${lake.score}</span></span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 42],
          popupAnchor: [0, -38],
        });
        const marker = L.marker([lake.latitude, lake.longitude], {
          icon,
          title: lake.name,
          riseOnHover: true,
        });
        marker.bindPopup(`
          <div class="fishcast-popup">
            <small>${lake.locality}, ${lake.county}</small>
            <strong>${lake.name}</strong>
            <span>${Math.round(distance)} km · Index ${lake.score}</span>
            <a href="/lakes/${encodeURIComponent(lake.id)}">Vezi detalii</a>
          </div>
        `);
        clusters.addLayer(marker);
        bounds.extend([lake.latitude, lake.longitude]);
      }

      if (position) {
        userMarkerRef.current?.remove();
        userMarkerRef.current = L.circleMarker(
          [position.latitude, position.longitude],
          {
            radius: 9,
            weight: 4,
            color: "#ffffff",
            fillColor: "#39e6a4",
            fillOpacity: 1,
          },
        ).addTo(map).bindTooltip("Poziția ta", { direction: "top" });
        bounds.extend([position.latitude, position.longitude]);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [38, 38], maxZoom: 11 });
      }
      requestAnimationFrame(() => map.invalidateSize());
    }

    void updateMarkers();
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
