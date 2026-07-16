"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "fishcast-favorites";

type FavoriteButtonProps = {
  lakeId: string;
  className?: string;
};

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function FavoriteButton({ lakeId, className = "" }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(readFavorites().includes(lakeId));
  }, [lakeId]);

  function toggleFavorite() {
    const current = readFavorites();
    const next = current.includes(lakeId)
      ? current.filter((id) => id !== lakeId)
      : [...current, lakeId];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setIsFavorite(next.includes(lakeId));
    window.dispatchEvent(new CustomEvent("fishcast:favorites-changed"));
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Elimină din favorite" : "Adaugă la favorite"}
      className={className}
    >
      <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
    </button>
  );
}
