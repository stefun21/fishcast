"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    let cancelled = false;

    async function mountMap() {
      if (!containerRef.current || mapRef.current) return;

      const L = await import("leaflet");
      await import("leaflet.markercluster");
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [45.75, 24.9],
        zoom: 7,
        zoomControl: false,
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
      });
      clusters.addTo(map);

      mapRef.current = map;
      clusterRef.current = clusters;
      map.invalidateSize();
    }

    void mountMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      clusterRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
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
          html: `<span class="fishcast-map-icon"><span>${lake.score}</span></span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 42],
          popupAnchor: [0, -38],
        });
        const marker = L.marker([lake.latitude, lake.longitude], { icon });
        marker.bindPopup(`
          <div class="fishcast-popup">
            <small>${lake.locality}, ${lake.county}</small>
            <strong>${lake.name}</strong>
            <span>${Math.round(distance)} km · Index ${lake.score}</span>
            <a href="/lakes/${lake.id}">Vezi detalii</a>
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
    }

    void updateMarkers();
  }, [lakes, position]);

  return (
    <section className="lake-map-shell" aria-label="Hartă interactivă cu locațiile de pescuit">
      <div ref={containerRef} className="lake-map" />
      <div className="lake-map-caption">
        <span><strong>{lakes.length}</strong> locații pe hartă</span>
        <small>Apasă pe un marker pentru detalii</small>
      </div>
    </section>
  );
}
