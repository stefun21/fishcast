import Link from "next/link";
import { FavoriteButton } from "@/components/lakes/favorite-button";
import { Icon } from "@/components/ui/icon";
import type { Lake } from "@/types/lake";

const confidenceLabels = {
  verified: "Verificat",
  likely: "Probabil relevant",
  limited: "Date limitate",
} as const;

const categoryLabels = {
  fishing: "Loc de pescuit",
  aquaculture: "Amenajare piscicolă",
  pond: "Iaz",
  reservoir: "Acumulare",
  water: "Corp de apă",
} as const;

export function LakeCard({
  lake,
  compact = false,
  distance,
}: {
  lake: Lake;
  compact?: boolean;
  distance?: number;
}) {
  const shownDistance = distance ?? lake.distanceKm;
  const href = lake.detailHref || `/lakes/${encodeURIComponent(lake.id)}`;
  const confidenceLabel = confidenceLabels[lake.confidence ?? "limited"];
  const categoryLabel = lake.category ? categoryLabels[lake.category] : null;

  return (
    <article className={compact ? "lake-card compact" : "lake-card"}>
      <Link className="lake-card-hitbox" href={href} aria-label={`Deschide ${lake.name}`} />

      <div className={`lake-card-visual lake-tone-${lake.tone}`}>
        <div className="lake-card-pattern" aria-hidden="true" />
        <span className="lake-distance">
          <Icon name="location" size={14} /> {shownDistance >= 900 ? "Distanță necunoscută" : `${shownDistance < 10 ? shownDistance.toFixed(1) : Math.round(shownDistance)} km`}
        </span>
        <FavoriteButton id={lake.id} name={lake.name} />
        <div className="lake-score">
          <small>FISHCAST</small>
          <strong>{lake.score}</strong>
        </div>
      </div>

      <div className="lake-card-body">
        <div className="lake-card-title-row">
          <div>
            <p>{lake.locality}, {lake.county}</p>
            <h3>{lake.name}</h3>
          </div>
          <span className={`verified-badge confidence-${lake.confidence ?? "limited"}`}>
            <Icon name={lake.confidence === "verified" ? "check" : "info"} size={13} /> {confidenceLabel}
          </span>
        </div>

        <div className="lake-tags">
          {categoryLabel && <span className="category-tag">{categoryLabel}</span>}
          {lake.tags.slice(0, compact ? 2 : 4).map((tag) => <span key={tag}>{tag}</span>)}
        </div>

        {!compact && (
          <div className="lake-meta">
            <span><Icon name="wind" size={16} /> {lake.wind}</span>
            <span><Icon name="pressure" size={16} /> {lake.pressure}</span>
          </div>
        )}

        <span className="lake-card-link">
          Deschide locația <Icon name="arrow" size={16} />
        </span>
      </div>
    </article>
  );
}
