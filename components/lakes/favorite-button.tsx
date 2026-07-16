"use client";

import { Icon } from "@/components/ui/icon";
import { useFavorites } from "@/hooks/use-favorites";

export function FavoriteButton({ id, name }: { id: string; name: string }) {
  const { isFavorite, ready, toggleFavorite } = useFavorites();
  const active = ready && isFavorite(id);

  return (
    <button
      className={active ? "favorite-button active" : "favorite-button"}
      type="button"
      aria-pressed={active}
      aria-label={active ? `Elimină ${name} din favorite` : `Adaugă ${name} la favorite`}
      onClick={() => toggleFavorite(id)}
    >
      <Icon name="heart" size={18} />
    </button>
  );
}
