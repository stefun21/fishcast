export type FishingMode = 'retention' | 'catch-release'
export type VerificationStatus = 'verified' | 'community-confirmed' | 'unverified' | 'possibly-closed'

export interface Lake {
  id: string
  slug: string
  name: string
  county?: string
  locality?: string
  latitude: number
  longitude: number
  description?: string
  species: string[]
  fishingModes?: FishingMode[]
  openingHours?: string
  priceInfo?: string
  phone?: string
  website?: string
  facilities: string[]
  verificationStatus: VerificationStatus
  verifiedAt?: string
  sourceUrl?: string
  sourceName?: string
  imageUrl?: string
  rating?: number
  ratingCount?: number
  distanceKm?: number
}

export interface WeatherHour {
  time: string
  temperature: number
  apparentTemperature: number
  pressure: number
  humidity: number
  precipitationProbability: number
  precipitation: number
  cloudCover: number
  windSpeed: number
  windGusts: number
  weatherCode: number
  score: number
  verdict: string
}

export interface WeatherPayload {
  current: WeatherHour
  hourly: WeatherHour[]
  daily: { date: string; sunrise: string; sunset: string; max: number; min: number; score: number }[]
  station?: { code: string; name?: string; distanceKm?: number; observedAt?: string; temperature?: number; pressure?: number; windSpeed?: number }
  waterTemperatureEstimate?: number
  explanation: string[]
  source: string
}
