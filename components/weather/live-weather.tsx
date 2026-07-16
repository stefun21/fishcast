"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateFishingIndex } from "@/lib/fishing-index";
import {
  formatDay,
  formatHour,
  weatherLabel,
  windDirectionLabel,
  type WeatherPayload,
} from "@/lib/weather";

type Props = {
  latitude: number;
  longitude: number;
};

function WeatherSkeleton() {
  return (
    <section className="weather-panel weather-loading" aria-label="Se încarcă vremea">
      <div className="weather-skeleton weather-skeleton-wide" />
      <div className="weather-skeleton-grid">
        {Array.from({ length: 4 }).map((_, index) => <span key={index} className="weather-skeleton" />)}
      </div>
    </section>
  );
}

export function LiveWeather({ latitude, longitude }: Props) {
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setWeather(null);
    setError(null);

    fetch(`/api/weather?lat=${latitude}&lon=${longitude}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Vreme indisponibilă.");
        return payload as WeatherPayload;
      })
      .then(setWeather)
      .catch((requestError: Error) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      });

    return () => controller.abort();
  }, [latitude, longitude]);

  const pressureTrend = useMemo(() => {
    if (!weather || weather.hourly.length < 4) return null;
    const change = weather.hourly[3].pressure - weather.current.pressure;
    if (change > 1.4) return { label: "în creștere", symbol: "↗" };
    if (change < -1.4) return { label: "în scădere", symbol: "↘" };
    return { label: "stabilă", symbol: "→" };
  }, [weather]);

  const fishingIndex = useMemo(
    () => (weather ? calculateFishingIndex(weather) : null),
    [weather],
  );

  if (error) {
    return (
      <section className="weather-panel weather-error">
        <p className="section-kicker">VREME LIVE</p>
        <h2>Nu am putut încărca prognoza</h2>
        <p>{error}</p>
      </section>
    );
  }

  if (!weather || !fishingIndex) return <WeatherSkeleton />;

  const { current } = weather;

  return (
    <>
      <section className="fishing-index-panel">
        <div className="fishing-index-score" aria-label={`Fishing Index ${fishingIndex.score} din 100`}>
          <small>FISHING INDEX</small>
          <strong>{fishingIndex.score}</strong>
          <span>/100</span>
        </div>
        <div className="fishing-index-copy">
          <p className="section-kicker">RECOMANDAREA MOMENTULUI</p>
          <h2>{fishingIndex.label}</h2>
          <p>{fishingIndex.summary}</p>
          <div className="fishing-reasons">
            {fishingIndex.reasons.slice(0, 3).map((reason) => <span key={reason}>✓ {reason}</span>)}
            {fishingIndex.warnings.slice(0, 3).map((warning) => <span className="warning" key={warning}>! {warning}</span>)}
          </div>
        </div>
        <div className="best-hours-card">
          <small>CELE MAI BUNE ORE</small>
          {fishingIndex.bestHours.map((hour) => (
            <div key={hour.time}>
              <strong>{formatHour(hour.time)}</strong>
              <span>{hour.score}/100</span>
            </div>
          ))}
        </div>
      </section>

      <section className="weather-panel">
        <div className="weather-current">
          <div>
            <p className="section-kicker">VREME LIVE · OPEN-METEO</p>
            <h2>{weatherLabel(current.weatherCode)}</h2>
            <p>Actualizat la {formatHour(current.time)} · fus orar local</p>
          </div>
          <div className="weather-temperature">
            <strong>{Math.round(current.temperature)}°</strong>
            <span>resimțite {Math.round(current.apparentTemperature)}°</span>
          </div>
        </div>

        <div className="weather-metric-grid">
          <article><small>Presiune</small><strong>{Math.round(current.pressure)} hPa</strong><span>{pressureTrend?.symbol} {pressureTrend?.label}</span></article>
          <article><small>Vânt</small><strong>{Math.round(current.windSpeed)} km/h</strong><span>{windDirectionLabel(current.windDirection)} · rafale {Math.round(current.windGusts)}</span></article>
          <article><small>Umiditate</small><strong>{Math.round(current.humidity)}%</strong><span>Nebulozitate {Math.round(current.cloudCover)}%</span></article>
          <article><small>Precipitații</small><strong>{current.precipitation.toFixed(1)} mm</strong><span>la momentul actual</span></article>
        </div>

        <div className="weather-section-heading">
          <div><p className="section-kicker">URMĂTOARELE 12 ORE</p><h3>Prognoză orară</h3></div>
          <span>Glisează pentru mai multe ore</span>
        </div>
        <div className="hourly-weather" aria-label="Prognoză meteo orară">
          {weather.hourly.slice(0, 12).map((hour) => (
            <article key={hour.time}>
              <time>{formatHour(hour.time)}</time>
              <strong>{Math.round(hour.temperature)}°</strong>
              <span>{weatherLabel(hour.weatherCode)}</span>
              <small>{hour.precipitationProbability}% ploaie</small>
              <small>{Math.round(hour.windSpeed)} km/h</small>
            </article>
          ))}
        </div>

        <div className="weather-section-heading">
          <div><p className="section-kicker">7 ZILE</p><h3>Privire de ansamblu</h3></div>
        </div>
        <div className="daily-weather">
          {weather.daily.map((day) => (
            <article key={day.date}>
              <div><strong>{formatDay(day.date)}</strong><span>{weatherLabel(day.weatherCode)}</span></div>
              <small>{day.precipitationProbability}% ploaie</small>
              <div className="daily-temperatures"><strong>{Math.round(day.temperatureMax)}°</strong><span>{Math.round(day.temperatureMin)}°</span></div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
