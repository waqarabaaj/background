import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Droplets,
  Wind,
  RefreshCw,
  MapPin,
  Search,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
} from 'lucide-react';
import type { UserSettings, WeatherData } from '../../types';
import {
  fetchWeather,
  formatTemp,
  decodeWmoCode,
  searchCities,
  type CitySearchResult,
} from '../../services/weather';

interface TopBannerProps {
  settings: UserSettings;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
}

function WeatherGlyph({ code, className = 'w-9 h-9' }: { code: number; className?: string }) {
  const { icon } = decodeWmoCode(code);
  switch (icon) {
    case 'sun':
      return <Sun className={`${className} text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]`} />;
    case 'partly':
      return <CloudSun className={`${className} text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]`} />;
    case 'cloud':
      return <Cloud className={`${className} text-slate-200`} />;
    case 'fog':
      return <CloudFog className={`${className} text-slate-300`} />;
    case 'rain':
      return <CloudRain className={`${className} text-sky-300`} />;
    case 'snow':
      return <CloudSnow className={`${className} text-cyan-200`} />;
    case 'storm':
      return <CloudLightning className={`${className} text-amber-300`} />;
  }
}

export const TopBanner: React.FC<TopBannerProps> = ({ settings, onUpdateSettings }) => {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<CitySearchResult[]>([]);
  const [searchingCity, setSearchingCity] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const loadWeather = async (force = false) => {
    setLoadingWeather(true);
    try {
      const w = await fetchWeather(
        settings.weatherLat,
        settings.weatherLon,
        settings.weatherCity,
        settings.weatherCountry,
        force
      );
      setWeather(w);
    } catch {
      // Keep last known weather if offline
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    loadWeather(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.weatherLat, settings.weatherLon, settings.weatherCity]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityQuery.trim()) return;
    setSearchingCity(true);
    try {
      const res = await searchCities(cityQuery);
      setCityResults(res);
    } catch {
      setCityResults([]);
    } finally {
      setSearchingCity(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = Math.round(pos.coords.latitude * 10000) / 10000;
      const lon = Math.round(pos.coords.longitude * 10000) / 10000;
      onUpdateSettings({
        weatherLat: lat,
        weatherLon: lon,
        weatherCity: 'Current Location',
        weatherCountry: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      });
      setDropdownOpen(false);
    });
  };

  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const hours24 = now.getHours();
  const displayHour =
    settings.timeFormat === '24h'
      ? String(hours24).padStart(2, '0')
      : String(hours24 % 12 || 12);
  const displayMin = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours24 >= 12 ? 'PM' : 'AM';

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="relative z-20 flex flex-wrap items-start justify-between gap-4 pt-1 pb-2">
      {/* Left: Dynamic Greeting */}
      <div className="min-w-[230px] pt-1">
        <h1 className="text-[24px] xl:text-[27px] font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
          {greeting}, {settings.userName}{' '}
          <span className="inline-block animate-pulse">👋</span>
        </h1>
        <p className="text-[13px] text-purple-100/75 mt-0.5 drop-shadow-[0_1px_6px_rgba(0,0,0,0.75)]">
          {settings.tagline}
        </p>
      </div>

      {/* Center: Hero Digital Clock */}
      <div className="flex flex-col items-center text-center mx-auto">
        <div className="flex items-baseline gap-1.5 drop-shadow-[0_4px_20px_rgba(0,0,0,0.65)]">
          <span className="text-[42px] xl:text-[48px] font-semibold leading-none tracking-tight text-white tabular-nums">
            {displayHour}:{displayMin}
          </span>
          {settings.timeFormat === '12h' && (
            <span className="text-[20px] xl:text-[22px] font-medium text-purple-100/90">
              {ampm}
            </span>
          )}
        </div>
        <div className="text-[13px] text-purple-100/80 mt-1 font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]">
          {formattedDate}
        </div>
      </div>

      {/* Right: Real Live Weather Pill + Forecast Dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="glass-card rounded-2xl px-4 py-2.5 flex items-center gap-3.5 min-w-[215px] text-left cursor-pointer"
          title="Click for 5-day forecast & city switcher"
        >
          <WeatherGlyph code={weather?.weatherCode ?? 2} className="w-9 h-9 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[20px] font-semibold leading-tight text-white">
              {weather ? formatTemp(weather.tempC, settings.tempUnit) : '--°'}
            </div>
            <div className="text-[12px] text-slate-200/90 truncate">
              {settings.weatherCity}, {settings.weatherCountry}
            </div>
            <div className="text-[11px] text-purple-200/70">
              {weather?.condition ?? (loadingWeather ? 'Updating...' : 'Partly Cloudy')}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-purple-200/70 transition-transform ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#131029]/96 backdrop-blur-2xl border border-purple-500/35 shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-white">
                  {settings.weatherCity}, {settings.weatherCountry}
                </div>
                <div className="text-[11px] text-purple-200/65">
                  Live Open-Meteo Forecast
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    onUpdateSettings({ tempUnit: settings.tempUnit === 'C' ? 'F' : 'C' })
                  }
                  className="px-2 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/35 text-xs font-medium text-purple-100 cursor-pointer"
                >
                  °{settings.tempUnit}
                </button>
                <button
                  onClick={() => loadWeather(true)}
                  className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/35 text-purple-100 cursor-pointer"
                  title="Refresh weather"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingWeather ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {weather && (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="rounded-xl bg-white/5 p-2">
                    <div className="text-[10px] text-slate-400">Feels Like</div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {formatTemp(weather.feelsLikeC, settings.tempUnit)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 p-2">
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Droplets className="w-3 h-3 text-sky-400" /> Humidity
                    </div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {weather.humidity}%
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 p-2">
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Wind className="w-3 h-3 text-purple-300" /> Wind
                    </div>
                    <div className="text-xs font-semibold text-white mt-0.5">
                      {weather.windKmh} km/h
                    </div>
                  </div>
                </div>

                {/* 5-day forecast */}
                <div className="space-y-1.5 mb-3">
                  {weather.daily.map((day) => {
                    const d = new Date(day.date + 'T00:00:00');
                    const dayLabel = d.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    });
                    return (
                      <div
                        key={day.date}
                        className="flex items-center justify-between text-xs px-2 py-1 rounded-lg bg-white/[0.03]"
                      >
                        <span className="text-slate-300 w-24">{dayLabel}</span>
                        <WeatherGlyph code={day.code} className="w-4 h-4" />
                        <span className="text-white font-medium tabular-nums">
                          {formatTemp(day.tempMaxC, settings.tempUnit)}{' '}
                          <span className="text-slate-400">
                            / {formatTemp(day.tempMinC, settings.tempUnit)}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* City Switcher */}
            <form onSubmit={handleCitySearch} className="flex gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder="Change city (e.g. Gilgit, Lahore)..."
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-white/7 border border-purple-500/25 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-400"
                />
              </div>
              <button
                type="submit"
                disabled={searchingCity}
                className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white cursor-pointer"
              >
                {searchingCity ? '...' : 'Go'}
              </button>
              <button
                type="button"
                onClick={handleUseMyLocation}
                title="Use GPS location"
                className="p-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-purple-200 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
              </button>
            </form>

            {cityResults.length > 0 && (
              <div className="mt-2 max-h-36 overflow-y-auto space-y-1">
                {cityResults.map((c, idx) => (
                  <button
                    key={`${c.name}-${idx}`}
                    onClick={() => {
                      onUpdateSettings({
                        weatherCity: c.name,
                        weatherCountry: c.country,
                        weatherLat: c.latitude,
                        weatherLon: c.longitude,
                      });
                      setCityResults([]);
                      setCityQuery('');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-500/20 text-xs text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>
                      {c.name}
                      {c.admin1 ? `, ${c.admin1}` : ''}
                    </span>
                    <span className="text-slate-400">{c.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
