"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "fishcast-favorites";

type FavoriteButtonProps = {
  id?: string;
  lakeId?: string;
  name?: string;
  className?: string;
};

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function FavoriteButton({
  id,
  lakeId,
  name,
  className = "",
}: FavoriteButtonProps) {
  const resolvedId = lakeId ?? id ?? name ?? "unknown-lake";
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(readFavorites().includes(resolvedId));
  }, [resolvedId]);

  function toggleFavorite() {
    const current = readFavorites();
    const next = current.includes(resolvedId)
      ? current.filter((favoriteId) => favoriteId !== resolvedId)
      : [...current, resolvedId];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setIsFavorite(next.includes(resolvedId));
    window.dispatchEvent(new CustomEvent("fishcast:favorites-changed"));
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite
          ? `Elimină ${name ?? "locația"} din favorite`
          : `Adaugă ${name ?? "locația"} la favorite`
      }
      className={className}
    >
      <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
    </button>
  );
}
