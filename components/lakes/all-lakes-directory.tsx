"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LakeCard } from "@/components/lakes/lake-card";
import { Icon } from "@/components/ui/icon";
import type { FishingMode, Lake, LakeCategory, LakeConfidence } from "@/types/lake";

type ApiResponse = {
  items: Lake[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    from: number;
    to: number;
  };
  sorting: {
    requested: string;
    applied: string;
    hasPosition: boolean;
  };
};

type Coordinates = { latitude: number; longitude: number } | null;
type SortMode = "distance" | "name" | "quality";

const emptyResponse: ApiResponse = {
  items: [],
  pagination: { page: 1, pageSize: 24, total: 0, totalPages: 1, from: 0, to: 0 },
  sorting: { requested: "distance", applied: "name", hasPosition: false },
};

function paginationWindow(current: number, total: number) {
  const pages = new Set([1, total, current - 2, current - 1, current, current + 1, current + 2]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
}

export function AllLakesDirectory({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [mode, setMode] = useState<FishingMode | "all">("all");
  const [category, setCategory] = useState<LakeCategory | "all">("all");
  const [confidence, setConfidence] = useState<LakeConfidence | "all">("all");
  const [sort, setSort] = useState<SortMode>("distance");
  const [pageSize, setPageSize] = useState(24);
  const [page, setPage] = useState(1);
  const [coordinates, setCoordinates] = useState<Coordinates>(null);
  const [locationState, setLocationState] = useState<"checking" | "ready" | "denied" | "unsupported">("checking");
  const [data, setData] = useState<ApiResponse>(emptyResponse);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 260);
    return () => window.clearTimeout(timer);
  }, [query]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState("unsupported");
      return;
    }

    setLocationState("checking");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationState("ready");
        setSort("distance");
        setPage(1);
      },
      () => setLocationState("denied"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60 * 1000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, mode, category, confidence, sort, pageSize]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      q: debouncedQuery,
      mode,
      category,
      confidence,
      sort,
    });

    if (coordinates) {
      params.set("lat", String(coordinates.latitude));
      params.set("lon", String(coordinates.longitude));
    }

    setLoading(true);
    setError("");
    fetch(`/api/lakes?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalogul nu a putut fi încărcat.");
        return response.json() as Promise<ApiResponse>;
      })
      .then(setData)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Catalogul nu a putut fi încărcat.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [category, confidence, coordinates, debouncedQuery, mode, page, pageSize, sort]);

  const pages = useMemo(
    () => paginationWindow(data.pagination.page, data.pagination.totalPages),
    [data.pagination.page, data.pagination.totalPages],
  );

  function goToPage(nextPage: number) {
    setPage(Math.max(1, Math.min(nextPage, data.pagination.totalPages)));
    window.requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const locationMessage = locationState === "ready"
    ? "Ordonate după distanța reală față de tine"
    : locationState === "checking"
      ? "Determinăm locația pentru ordonarea automată..."
      : "Locația nu este disponibilă; catalogul este ordonat alfabetic";

  return (
    <section className="directory-shell" ref={topRef}>
      <div className="directory-summary-bar">
        <div>
          <span className={locationState === "ready" ? "live-dot active" : "live-dot"} />
          <strong>{locationMessage}</strong>
          <small>{data.pagination.total.toLocaleString("ro-RO")} locații în catalog</small>
        </div>
        {locationState !== "ready" && (
          <button className="subtle-action" type="button" onClick={requestLocation}>
            <Icon name="location" size={16} /> Activează locația
          </button>
        )}
      </div>

      <div className="directory-controls">
        <label className="directory-search">
          <Icon name="search" size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută după nume, localitate, județ sau specie"
          />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Șterge căutarea">×</button>}
        </label>

        <label className="directory-select">
          <span>Sortare</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
            <option value="distance">Cele mai apropiate</option>
            <option value="name">Nume A–Z</option>
            <option value="quality">Calitatea datelor</option>
          </select>
        </label>
      </div>

      <div className="directory-filter-row">
        <label>
          <span>Tip locație</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as LakeCategory | "all")}>
            <option value="all">Toate</option>
            <option value="fishing">Loc de pescuit</option>
            <option value="aquaculture">Amenajare piscicolă</option>
            <option value="pond">Iaz</option>
            <option value="reservoir">Acumulare</option>
            <option value="water">Corp de apă</option>
          </select>
        </label>
        <label>
          <span>Regim</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as FishingMode | "all")}>
            <option value="all">Orice regim</option>
            <option value="retention">Cu reținere</option>
            <option value="catch-release">Fără reținere</option>
          </select>
        </label>
        <label>
          <span>Încredere</span>
          <select value={confidence} onChange={(event) => setConfidence(event.target.value as LakeConfidence | "all")}>
            <option value="all">Toate nivelurile</option>
            <option value="verified">Verificat</option>
            <option value="likely">Probabil relevant</option>
            <option value="limited">Date limitate</option>
          </select>
        </label>
        <label>
          <span>Pe pagină</span>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
        </label>
      </div>

      <div className="directory-result-head">
        <p>
          {data.pagination.total > 0
            ? `Afișăm ${data.pagination.from}–${data.pagination.to} din ${data.pagination.total.toLocaleString("ro-RO")}`
            : "Niciun rezultat"}
        </p>
        {loading && <span className="directory-loading"><i /> Actualizăm lista</span>}
      </div>

      {error && <div className="directory-error">{error}</div>}

      <div className={loading ? "directory-list is-loading" : "directory-list"} aria-busy={loading}>
        {data.items.map((lake) => (
          <LakeCard key={lake.id} lake={lake} compact distance={lake.distanceKm} />
        ))}
      </div>

      {!loading && !error && data.items.length === 0 && (
        <div className="inline-empty-state">
          <strong>Nicio locație pentru filtrele selectate</strong>
          <span>Șterge căutarea sau alege filtre mai largi.</span>
        </div>
      )}

      {data.pagination.totalPages > 1 && (
        <nav className="catalog-pagination" aria-label="Paginarea catalogului">
          <button type="button" onClick={() => goToPage(1)} disabled={data.pagination.page === 1} aria-label="Prima pagină">«</button>
          <button type="button" onClick={() => goToPage(data.pagination.page - 1)} disabled={data.pagination.page === 1}>Înapoi</button>
          <div className="pagination-pages">
            {pages.map((pageNumber, index) => {
              const previous = pages[index - 1];
              return (
                <span key={pageNumber}>
                  {previous && pageNumber - previous > 1 && <i>…</i>}
                  <button
                    type="button"
                    className={pageNumber === data.pagination.page ? "active" : ""}
                    onClick={() => goToPage(pageNumber)}
                    aria-current={pageNumber === data.pagination.page ? "page" : undefined}
                  >
                    {pageNumber}
                  </button>
                </span>
              );
            })}
          </div>
          <button type="button" onClick={() => goToPage(data.pagination.page + 1)} disabled={data.pagination.page === data.pagination.totalPages}>Înainte</button>
          <button type="button" onClick={() => goToPage(data.pagination.totalPages)} disabled={data.pagination.page === data.pagination.totalPages} aria-label="Ultima pagină">»</button>
        </nav>
      )}
    </section>
  );
}
