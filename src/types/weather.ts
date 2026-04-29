/**
 * weather.ts
 *
 * Types for the `/weather` API surface (read-only forecast lookup).
 */

export interface WeatherSnapshot {
  /** Temperature in Celsius. */
  temperatureC: number;
  /** "Feels like" temperature in Celsius. */
  feelsLikeC: number;
  /** Relative humidity, 0–100. */
  humidityPct: number;
  /** ISO date string of the day this snapshot describes. */
  date: string;
}

export interface WeatherForecastResponse {
  region: string;
  fetchedAt: string;
  today:    WeatherSnapshot | null;
  tomorrow: WeatherSnapshot | null;
}
