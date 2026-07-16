"use client";

import { useEffect, useRef, useState } from "react";
import type { Lake } from "@/types/lake";

type Position = { latitude: number; longitude: number } | null;

function markerClass(category?: Lake["category"], confidence?: Lake["confidence"]) {
  const categoryClass = category ? `fishcast-marker-${category}` : "fishcast-marker-water";
  const confidenceClass = confidence ? `fishcast-marker-${confidence}` : "fishcast-marker-limited";
  return `fishcast-map-marker ${categoryClass} ${confidenceClass}`;
}

export function LakeMap({
  lakes,
  position,
}: {
  lakes: Array<{ lake: Lake; distance: number }>;
  position: Position;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const clustersRef = useRef<import("leaflet").MarkerClusterGroup | null>(null);
  const userLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
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
          chunkedLoading: true,
          chunkInterval: 80,
          chunkDelay: 30,
          removeOutsideVisibleBounds: true,
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 14,
          maxClusterRadius: 54,
        });
        clusters.addTo(map);

        const userLayer = L.layerGroup().addTo(map);
        mapRef.current = map;
        clustersRef.current = clusters;
        userLayerRef.current = userLayer;
        setMapReady(true);
        window.setTimeout(() => map.invalidateSize(), 80);
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
      clustersRef.current = null;
      userLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;

    async function updateMarkers() {
      const map = mapRef.current;
      const clusters = clustersRef.current;
      const userLayer = userLayerRef.current;
      if (!map || !clusters || !userLayer) return;

      const L = await import("leaflet");
      clusters.clearLayers();
      userLayer.clearLayers();
      const bounds = L.latLngBounds([]);
      const markers: import("leaflet").Marker[] = [];

      for (const { lake, distance } of lakes) {
        if (!Number.isFinite(lake.latitude) || !Number.isFinite(lake.longitude)) continue;

        const icon = L.divIcon({
          className: "fishcast-marker-wrapper",
          html: `<span class="${markerClass(lake.category, lake.confidence)}" aria-hidden="true"></span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          popupAnchor: [0, -12],
        });

        const marker = L.marker([lake.latitude, lake.longitude], { icon, keyboard: true, title: lake.name });
        const detailsUrl = lake.detailHref || (lake.source === "Catalog FishCast"
          ? `/lakes/${encodeURIComponent(lake.id)}`
          : `/place?name=${encodeURIComponent(lake.name)}&lat=${lake.latitude}&lon=${lake.longitude}&source=${encodeURIComponent(lake.source || "Sursă publică")}&sourceUrl=${encodeURIComponent(lake.sourceUrl || "")}&category=${encodeURIComponent(lake.category || "water")}`);

        marker.bindPopup(`
          <div class="fishcast-popup">
            <small>${lake.locality || "Localitate necunoscută"}${lake.county ? `, ${lake.county}` : ""}</small>
            <strong>${lake.name}</strong>
            <span>${Number.isFinite(distance) && distance < 900 ? `${Math.round(distance)} km · ` : ""}${lake.tags[0] || "Corp de apă"}</span>
            <a href="${detailsUrl}">Vezi detalii</a>
          </div>
        `);

        markers.push(marker);
        bounds.extend([lake.latitude, lake.longitude]);
      }

      clusters.addLayers(markers);

      if (position) {
        L.circleMarker([position.latitude, position.longitude], {
          radius: 8,
          weight: 4,
          color: "#ffffff",
          fillColor: "#2f80ed",
          fillOpacity: 1,
        }).bindTooltip("Poziția ta", { direction: "top" }).addTo(userLayer);
        bounds.extend([position.latitude, position.longitude]);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [38, 38], maxZoom: position ? 11 : 8 });
      }
      window.setTimeout(() => map.invalidateSize(), 80);
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
        <small>{mapReady ? "Marker-ele apropiate sunt grupate automat" : "Se încarcă harta..."}</small>
      </div>
    </section>
  );
}
