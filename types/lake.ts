export type LakeTone = "blue" | "emerald" | "gold";
export type FishingMode = "retention" | "catch-release";
export type LakeConfidence = "verified" | "likely" | "limited";
export type LakeCategory = "fishing" | "aquaculture" | "pond" | "reservoir" | "water";

export interface Lake {
  id: string;
  name: string;
  locality: string;
  county: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  score: number;
  wind: string;
  pressure: string;
  tags: string[];
  modes: FishingMode[];
  species: string[];
  facilities: string[];
  description: string;
  tone: LakeTone;
  source?: string;
  sourceUrl?: string;
  confidence?: LakeConfidence;
  qualityScore?: number;
  category?: LakeCategory;
  lastSyncedAt?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  detailHref?: string;
}

export interface GeneratedLake {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  locality?: string | null;
  county?: string | null;
  modes?: FishingMode[];
  phone?: string | null;
  website?: string | null;
  openingHours?: string | null;
  source?: string;
  sourceUrl?: string | null;
  confidence?: LakeConfidence;
  qualityScore?: number;
  category?: LakeCategory;
  lastSyncedAt?: string;
  osmTags?: string[];
}
