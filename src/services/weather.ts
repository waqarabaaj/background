import type { WeatherData, WeatherForecastDay } from '../types';

const WEATHER_CACHE_KEY = 'waqar_weather_cache_v1';
const CACHE_TTL_MS = 10 * 60 * 1000;

export function decodeWmoCode(code: number): { label: string; icon: 'sun' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm' } {
  if (code === 0) return { label: 'Clear Sky', icon: 'sun' };
  if (code === 1) return { label: 'Mainly Clear', icon: 'partly' };
  if (code === 2) return { label: 'Partly Cloudy', icon: 'partly' };
  if (code === 3) return { label: 'Overcast', icon: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Foggy', icon: 'fog' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { label: code >= 63 ? 'Rain' : 'Light Rain', icon: 'rain' };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { label: 'Snow', icon: 'snow' };
  }
  if ([95, 96, 99].includes(code)) {
    return { label: 'Thunderstorm', icon: 'storm' };
  }
  return { label: 'Partly Cloudy', icon: 'partly' };
}

export interface CitySearchResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  if (!query.trim()) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query.trim()
  )}&count=6&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('City lookup failed');
  const json = await res.json();
  if (!Array.isArray(json.results)) return [];
  return json.results.map((r: Record<string, unknown>) => ({
    name: String(r.name || ''),
    country: String(r.country || ''),
    admin1: r.admin1 ? String(r.admin1) : undefined,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
  }));
}

export async function fetchWeather(
  lat: number,
  lon: number,
  city: string,
  country: string,
  forceRefresh = false
): Promise<WeatherData> {
  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(WEATHER_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as WeatherData & { lat: number; lon: number };
        if (
          Math.abs(cached.lat - lat) < 0.05 &&
          Math.abs(cached.lon - lon) < 0.05 &&
          Date.now() - cached.updatedAt < CACHE_TTL_MS
        ) {
          return cached;
        }
      }
    } catch {
      // Ignore cache error
    }
  }

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error (${res.status})`);
  const json = await res.json();

  const current = json.current || {};
  const dailyRaw = json.daily || {};
  const weatherCode = Number(current.weather_code ?? 2);
  const { label } = decodeWmoCode(weatherCode);

  const daily: WeatherForecastDay[] = Array.isArray(dailyRaw.time)
    ? dailyRaw.time.map((date: string, i: number) => ({
        date,
        code: Number(dailyRaw.weather_code?.[i] ?? 2),
        tempMaxC: Math.round(Number(dailyRaw.temperature_2m_max?.[i] ?? 15)),
        tempMinC: Math.round(Number(dailyRaw.temperature_2m_min?.[i] ?? 5)),
      }))
    : [];

  const weather: WeatherData = {
    city,
    country,
    tempC: Math.round(Number(current.temperature_2m ?? 12)),
    feelsLikeC: Math.round(Number(current.apparent_temperature ?? current.temperature_2m ?? 12)),
    humidity: Math.round(Number(current.relative_humidity_2m ?? 50)),
    windKmh: Math.round(Number(current.wind_speed_10m ?? 6)),
    weatherCode,
    condition: label,
    isDay: Number(current.is_day ?? 1) === 1,
    daily,
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ ...weather, lat, lon }));
  } catch {
    // Ignore
  }

  return weather;
}

export function formatTemp(tempC: number, unit: 'C' | 'F'): string {
  if (unit === 'F') {
    return `${Math.round((tempC * 9) / 5 + 32)}°F`;
  }
  return `${Math.round(tempC)}°C`;
}
