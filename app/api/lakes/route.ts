import { NextRequest, NextResponse } from "next/server";
import { demoLakes } from "@/data/lakes";
import { distanceKm } from "@/lib/geo";
import type { FishingMode, LakeCategory, LakeConfidence } from "@/types/lake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZES = new Set([12, 24, 48]);
const SORTS = new Set(["distance", "name", "quality"]);

function numberParam(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ro")
    .trim();
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Math.floor(numberParam(params.get("page")) ?? 1));
  const requestedPageSize = Math.floor(numberParam(params.get("pageSize")) ?? 24);
  const pageSize = PAGE_SIZES.has(requestedPageSize) ? requestedPageSize : 24;
  const query = normalize(params.get("q") ?? "");
  const mode = (params.get("mode") ?? "all") as FishingMode | "all";
  const category = (params.get("category") ?? "all") as LakeCategory | "all";
  const confidence = (params.get("confidence") ?? "all") as LakeConfidence | "all";
  const requestedSort = params.get("sort") ?? "distance";
  const sort = SORTS.has(requestedSort) ? requestedSort : "distance";
  const latitude = numberParam(params.get("lat"));
  const longitude = numberParam(params.get("lon"));
  const hasPosition = latitude !== null && longitude !== null;

  const filtered = demoLakes
    .filter((lake) => {
      if (query) {
        const searchable = normalize([
          lake.name,
          lake.locality,
          lake.county,
          lake.species.join(" "),
          lake.tags.join(" "),
          lake.source ?? "",
        ].join(" "));
        if (!searchable.includes(query)) return false;
      }
      if (mode !== "all" && !lake.modes.includes(mode)) return false;
      if (category !== "all" && lake.category !== category) return false;
      if (confidence !== "all" && lake.confidence !== confidence) return false;
      return true;
    })
    .map((lake) => ({
      ...lake,
      distanceKm: hasPosition
        ? Number(distanceKm(
            { latitude: latitude as number, longitude: longitude as number },
            { latitude: lake.latitude, longitude: lake.longitude },
          ).toFixed(1))
        : lake.distanceKm,
    }))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ro");
      if (sort === "quality") return (b.qualityScore ?? b.score) - (a.qualityScore ?? a.score);
      if (hasPosition) return a.distanceKm - b.distanceKm;
      return a.name.localeCompare(b.name, "ro");
    });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return NextResponse.json({
    items,
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      from: total === 0 ? 0 : start + 1,
      to: Math.min(start + pageSize, total),
    },
    sorting: {
      requested: sort,
      applied: sort === "distance" && !hasPosition ? "name" : sort,
      hasPosition,
    },
  });
}
