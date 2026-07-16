export type WeatherPayload = {
  timezone: string;
  current: {
    time: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    pressure: number;
    precipitation: number;
    cloudCover: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    weatherCode: number;
  };
  hourly: Array<{
    time: string;
    temperature: number;
    pressure: number;
    precipitationProbability: number;
    precipitation: number;
    cloudCover: number;
    windSpeed: number;
    windGusts: number;
    weatherCode: number;
  }>;
  daily: Array<{
    date: string;
    weatherCode: number;
    temperatureMax: number;
    temperatureMin: number;
    precipitationProbability: number;
    sunrise: string;
    sunset: string;
  }>;
};

export function weatherLabel(code: number) {
  if (code === 0) return "Senin";
  if ([1, 2].includes(code)) return "Mai mult senin";
  if (code === 3) return "Înnorat";
  if ([45, 48].includes(code)) return "Ceață";
  if ([51, 53, 55, 56, 57].includes(code)) return "Burniță";
  if ([61, 63, 65, 66, 67].includes(code)) return "Ploaie";
  if ([71, 73, 75, 77].includes(code)) return "Ninsoare";
  if ([80, 81, 82].includes(code)) return "Averse";
  if ([85, 86].includes(code)) return "Averse de zăpadă";
  if ([95, 96, 99].includes(code)) return "Furtună";
  return "Variabil";
}

export function windDirectionLabel(degrees: number) {
  const directions = ["N", "NE", "E", "SE", "S", "SV", "V", "NV"];
  return directions[Math.round(degrees / 45) % 8];
}

export function formatHour(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDay(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}
