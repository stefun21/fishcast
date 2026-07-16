export type FishingMode = 'retention' | 'catch-release'
export type VerificationStatus = 'verified' | 'community-confirmed' | 'unverified' | 'possibly-closed'
export interface Lake {
  id: string; osmId?: string | null; slug: string; name: string; county?: string; locality?: string; latitude: number; longitude: number
  description?: string; species: string[]; fishingModes?: FishingMode[]; openingHours?: string; priceInfo?: string; phone?: string | null
  website?: string | null; facilities: string[]; verificationStatus: VerificationStatus; verifiedAt?: string | null; sourceUrl?: string | null
  sourceName?: string | null; imageUrl?: string; distanceKm?: number; lastSyncedAt?: string | null
}
export interface WeatherHour { time: string; temperature: number; apparentTemperature: number; pressure: number; pressureTrend: number; humidity: number; precipitationProbability: number; precipitation: number; cloudCover: number; visibility: number; windSpeed: number; windGusts: number; weatherCode: number; score: number; verdict: string }
export interface WeatherPayload { current: WeatherHour; hourly: WeatherHour[]; daily: { date: string; sunrise: string; sunset: string; max: number; min: number; score: number }[]; waterTemperatureEstimate?: number; explanation: string[]; warnings: string[]; source: string }
