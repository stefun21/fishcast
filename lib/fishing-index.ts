import type { WeatherPayload } from "@/lib/weather";

type Hour = WeatherPayload["hourly"][number];

export type FishingIndexResult = {
  score: number;
  label: string;
  summary: string;
  reasons: string[];
  warnings: string[];
  bestHours: Array<{ time: string; score: number }>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function hourScore(hour: Hour, previous?: Hour) {
  let score = 58;

  const pressureDelta = previous ? hour.pressure - previous.pressure : 0;
  if (Math.abs(pressureDelta) <= 0.8) score += 12;
  else if (pressureDelta > 0.8 && pressureDelta <= 2.2) score += 7;
  else if (pressureDelta < -2.2) score -= 15;

  if (hour.windSpeed >= 5 && hour.windSpeed <= 18) score += 12;
  else if (hour.windSpeed > 28) score -= 18;
  else if (hour.windSpeed < 2) score -= 4;

  if (hour.windGusts > 45) score -= 20;
  else if (hour.windGusts > 32) score -= 10;

  if (hour.temperature >= 10 && hour.temperature <= 25) score += 10;
  else if (hour.temperature > 32 || hour.temperature < 3) score -= 13;

  if (hour.cloudCover >= 35 && hour.cloudCover <= 85) score += 8;
  else if (hour.cloudCover < 10) score -= 3;

  if (hour.precipitationProbability >= 20 && hour.precipitationProbability <= 55) score += 5;
  else if (hour.precipitationProbability > 80) score -= 15;

  if (hour.precipitation > 3) score -= 20;
  else if (hour.precipitation > 0 && hour.precipitation <= 1.5) score += 3;

  const localHour = new Date(hour.time).getHours();
  if ((localHour >= 5 && localHour <= 9) || (localHour >= 17 && localHour <= 21)) score += 12;
  else if (localHour >= 12 && localHour <= 15) score -= 7;

  if ([95, 96, 99].includes(hour.weatherCode)) score -= 35;

  return clamp(Math.round(score));
}

export function calculateFishingIndex(weather: WeatherPayload): FishingIndexResult {
  const hours = weather.hourly.slice(0, 12).map((hour, index, list) => ({
    time: hour.time,
    score: hourScore(hour, list[index - 1]),
  }));

  const score = hours.length
    ? Math.round(hours.slice(0, 4).reduce((sum, item) => sum + item.score, 0) / Math.min(4, hours.length))
    : 50;

  const current = weather.current;
  const pressureChange = weather.hourly.length > 3
    ? weather.hourly[3].pressure - current.pressure
    : 0;

  const reasons: string[] = [];
  const warnings: string[] = [];

  if (Math.abs(pressureChange) <= 1.4) reasons.push("Presiunea rămâne stabilă în următoarele ore.");
  else if (pressureChange > 1.4) reasons.push("Presiunea este în creștere moderată.");
  else warnings.push("Presiunea scade rapid, ceea ce poate reduce activitatea.");

  if (current.windSpeed >= 5 && current.windSpeed <= 18) reasons.push("Vântul este moderat și favorabil oxigenării apei.");
  if (current.windSpeed > 28) warnings.push("Vântul puternic poate face partida dificilă.");
  if (current.windGusts > 45) warnings.push("Rafalele sunt periculoase pentru pescuitul de pe mal sau barcă.");

  if (current.cloudCover >= 35 && current.cloudCover <= 85) reasons.push("Nebulozitatea este potrivită pentru perioade mai lungi de activitate.");
  if (current.precipitation > 3) warnings.push("Precipitațiile sunt intense în acest moment.");
  if ([95, 96, 99].includes(current.weatherCode)) warnings.push("Există risc de furtună. Amână deplasarea.");

  const sortedHours = [...hours].sort((a, b) => b.score - a.score).slice(0, 3);

  const label = score >= 85
    ? "Excelent"
    : score >= 70
      ? "Foarte bun"
      : score >= 55
        ? "Bun"
        : score >= 40
          ? "Moderat"
          : "Slab";

  const summary = score >= 70
    ? "Condițiile sunt favorabile pentru o partidă în următoarele ore."
    : score >= 50
      ? "Condițiile sunt acceptabile, dar intervalul ales contează mult."
      : "Condițiile sunt instabile; verifică avertizările înainte de plecare.";

  return {
    score,
    label,
    summary,
    reasons,
    warnings,
    bestHours: sortedHours,
  };
}
