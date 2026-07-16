import { NextRequest, NextResponse } from "next/server";
import type { WeatherPayload } from "@/lib/weather";

export const revalidate = 900;

function toNumber(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: NextRequest) {
  const latitude = toNumber(request.nextUrl.searchParams.get("lat"));
  const longitude = toNumber(request.nextUrl.searchParams.get("lon"));

  if (latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return NextResponse.json({ error: "Coordonate invalide." }, { status: 400 });
  }

  const parameters = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    timezone: "auto",
    forecast_days: "7",
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "surface_pressure",
      "precipitation",
      "cloud_cover",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "weather_code",
    ].join(","),
    hourly: [
      "temperature_2m",
      "surface_pressure",
      "precipitation_probability",
      "precipitation",
      "cloud_cover",
      "wind_speed_10m",
      "wind_gusts_10m",
      "weather_code",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "sunrise",
      "sunset",
    ].join(","),
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${parameters}`, {
      next: { revalidate: 900 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo status ${response.status}`);
    }

    const data = await response.json();
    const currentIndex = Math.max(
      0,
      data.hourly.time.findIndex((time: string) => time >= data.current.time),
    );
    const hourlyEnd = Math.min(currentIndex + 24, data.hourly.time.length);

    const payload: WeatherPayload = {
      timezone: data.timezone,
      current: {
        time: data.current.time,
        temperature: data.current.temperature_2m,
        apparentTemperature: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        pressure: data.current.surface_pressure,
        precipitation: data.current.precipitation,
        cloudCover: data.current.cloud_cover,
        windSpeed: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m,
        windGusts: data.current.wind_gusts_10m,
        weatherCode: data.current.weather_code,
      },
      hourly: data.hourly.time.slice(currentIndex, hourlyEnd).map((time: string, offset: number) => {
        const index = currentIndex + offset;
        return {
          time,
          temperature: data.hourly.temperature_2m[index],
          pressure: data.hourly.surface_pressure[index],
          precipitationProbability: data.hourly.precipitation_probability[index],
          precipitation: data.hourly.precipitation[index],
          cloudCover: data.hourly.cloud_cover[index],
          windSpeed: data.hourly.wind_speed_10m[index],
          windGusts: data.hourly.wind_gusts_10m[index],
          weatherCode: data.hourly.weather_code[index],
        };
      }),
      daily: data.daily.time.map((date: string, index: number) => ({
        date,
        weatherCode: data.daily.weather_code[index],
        temperatureMax: data.daily.temperature_2m_max[index],
        temperatureMin: data.daily.temperature_2m_min[index],
        precipitationProbability: data.daily.precipitation_probability_max[index],
        sunrise: data.daily.sunrise[index],
        sunset: data.daily.sunset[index],
      })),
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" },
    });
  } catch (error) {
    console.error("Weather request failed", error);
    return NextResponse.json(
      { error: "Datele meteo nu sunt disponibile momentan." },
      { status: 502 },
    );
  }
}
