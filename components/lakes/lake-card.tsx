import Link from "next/link";
import { FavoriteButton } from "@/components/lakes/favorite-button";
import { Icon } from "@/components/ui/icon";
import type { Lake } from "@/types/lake";

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

  return (
    <article className={compact ? "lake-card compact" : "lake-card"}>
      <div className={`lake-card-visual lake-tone-${lake.tone}`}>
        <div className="lake-card-pattern" aria-hidden="true" />
        <span className="lake-distance">
          <Icon name="location" size={14} /> {Math.round(shownDistance)} km
        </span>
        <FavoriteButton id={lake.id} name={lake.name} />
        <div className="lake-score">
          <small>INDEX DEMO</small>
          <strong>{lake.score}</strong>
        </div>
      </div>

      <div className="lake-card-body">
        <div className="lake-card-title-row">
          <div>
            <p>{lake.locality}, {lake.county}</p>
            <h3>{lake.name}</h3>
          </div>
          <span className="verified-badge" title="Date demonstrative">
            <Icon name="check" size={13} /> Demo
          </span>
        </div>

        <div className="lake-tags">
          {lake.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>

        {!compact && (
          <div className="lake-meta">
            <span><Icon name="wind" size={16} /> {lake.wind}</span>
            <span><Icon name="pressure" size={16} /> {lake.pressure}</span>
          </div>
        )}

        <Link className="lake-card-link" href={`/lakes/${lake.id}`}>
          Vezi detalii <Icon name="arrow" size={16} />
        </Link>
      </div>
    </article>
  );
}
