"use client";

import Link from "next/link";
import { LakeCard } from "@/components/lakes/lake-card";
import { Icon } from "@/components/ui/icon";
import { demoLakes } from "@/data/lakes";
import { useFavorites } from "@/hooks/use-favorites";

export function FavoritesList() {
  const { favorites, ready } = useFavorites();
  const lakes = demoLakes.filter((lake) => favorites.includes(lake.id));

  if (!ready) {
    return <p className="explorer-status">Se încarcă favoritele...</p>;
  }

  if (lakes.length === 0) {
    return (
      <section className="empty-state">
        <span className="empty-state-icon" aria-hidden="true"><Icon name="heart" size={34} /></span>
        <p className="section-kicker">ÎNCĂ NIMIC AICI</p>
        <h2>Salvează prima baltă</h2>
        <p>Apasă inima de pe orice card. Alegerea rămâne salvată pe acest dispozitiv.</p>
        <Link className="primary-button" href="/explore"><Icon name="map" size={18} /> Explorează locațiile</Link>
      </section>
    );
  }

  return <div className="lake-grid">{lakes.map((lake) => <LakeCard key={lake.id} lake={lake} />)}</div>;
}
