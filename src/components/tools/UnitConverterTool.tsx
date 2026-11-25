import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Copy, Check, RefreshCw } from 'lucide-react';

type CategoryId = 'length' | 'weight' | 'temperature' | 'data' | 'speed' | 'time' | 'currency';

interface UnitDef {
  id: string;
  label: string;
  factor: number; // relative to base unit
}

const LINEAR_UNITS: Record<Exclude<CategoryId, 'temperature' | 'currency'>, UnitDef[]> = {
  length: [
    { id: 'm', label: 'Meters (m)', factor: 1 },
    { id: 'km', label: 'Kilometers (km)', factor: 1000 },
    { id: 'cm', label: 'Centimeters (cm)', factor: 0.01 },
    { id: 'mm', label: 'Millimeters (mm)', factor: 0.001 },
    { id: 'mi', label: 'Miles (mi)', factor: 1609.344 },
    { id: 'ft', label: 'Feet (ft)', factor: 0.3048 },
    { id: 'in', label: 'Inches (in)', factor: 0.0254 },
  ],
  weight: [
    { id: 'kg', label: 'Kilograms (kg)', factor: 1 },
    { id: 'g', label: 'Grams (g)', factor: 0.001 },
    { id: 'mg', label: 'Milligrams (mg)', factor: 0.000001 },
    { id: 'lb', label: 'Pounds (lb)', factor: 0.45359237 },
    { id: 'oz', label: 'Ounces (oz)', factor: 0.0283495231 },
    { id: 't', label: 'Metric Tons (t)', factor: 1000 },
  ],
  data: [
    { id: 'B', label: 'Bytes (B)', factor: 1 },
    { id: 'KB', label: 'Kilobytes (KB)', factor: 1024 },
    { id: 'MB', label: 'Megabytes (MB)', factor: 1024 ** 2 },
    { id: 'GB', label: 'Gigabytes (GB)', factor: 1024 ** 3 },
    { id: 'TB', label: 'Terabytes (TB)', factor: 1024 ** 4 },
    { id: 'Mb', label: 'Megabits (Mb)', factor: (1000 ** 2) / 8 },
  ],
  speed: [
    { id: 'kmh', label: 'km/h', factor: 1 / 3.6 },
    { id: 'ms', label: 'm/s', factor: 1 },
    { id: 'mph', label: 'mph', factor: 0.44704 },
    { id: 'kt', label: 'Knots', factor: 0.514444 },
  ],
  time: [
    { id: 's', label: 'Seconds', factor: 1 },
    { id: 'min', label: 'Minutes', factor: 60 },
    { id: 'hr', label: 'Hours', factor: 3600 },
    { id: 'day', label: 'Days', factor: 86400 },
    { id: 'wk', label: 'Weeks', factor: 604800 },
  ],
};

const TEMP_UNITS = [
  { id: 'C', label: 'Celsius (°C)' },
  { id: 'F', label: 'Fahrenheit (°F)' },
  { id: 'K', label: 'Kelvin (K)' },
];

const CURRENCY_CODES = ['USD', 'PKR', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'TRY'];

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  PKR: 278.5,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  SAR: 3.75,
  CAD: 1.39,
  AUD: 1.53,
  JPY: 154,
  CNY: 7.24,
  INR: 84.4,
  TRY: 34.5,
};

function convertTemp(val: number, from: string, to: string): number {
  let c = val;
  if (from === 'F') c = ((val - 32) * 5) / 9;
  else if (from === 'K') c = val - 273.15;
  if (to === 'F') return (c * 9) / 5 + 32;
  if (to === 'K') return c + 273.15;
  return c;
}

export const UnitConverterTool: React.FC = () => {
  const [category, setCategory] = useState<CategoryId>('length');
  const [inputVal, setInputVal] = useState('1');
  const [fromUnit, setFromUnit] = useState('km');
  const [toUnit, setToUnit] = useState('mi');
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [ratesLive, setRatesLive] = useState(false);
  const [loadingFx, setLoadingFx] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadRates = async () => {
    setLoadingFx(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (res.ok) {
        const json = await res.json();
        if (json?.rates) {
          setRates(json.rates);
          setRatesLive(true);
        }
      }
    } catch {
      // Keep fallback rates
    } finally {
      setLoadingFx(false);
    }
  };

  useEffect(() => {
    if (category === 'currency' && !ratesLive) {
      loadRates();
    }
  }, [category, ratesLive]);

  const handleCategoryChange = (cat: CategoryId) => {
    setCategory(cat);
    if (cat === 'temperature') {
      setFromUnit('C');
      setToUnit('F');
    } else if (cat === 'currency') {
      setFromUnit('USD');
      setToUnit('PKR');
    } else {
      const list = LINEAR_UNITS[cat];
      setFromUnit(list[0].id);
      setToUnit(list[1]?.id || list[0].id);
    }
  };

  const num = Number(inputVal);
  let result = 0;

  if (!Number.isNaN(num)) {
    if (category === 'temperature') {
      result = convertTemp(num, fromUnit, toUnit);
    } else if (category === 'currency') {
      const inUsd = num / (rates[fromUnit] || 1);
      result = inUsd * (rates[toUnit] || 1);
    } else {
      const list = LINEAR_UNITS[category];
      const f = list.find((u) => u.id === fromUnit)?.factor ?? 1;
      const t = list.find((u) => u.id === toUnit)?.factor ?? 1;
      result = (num * f) / t;
    }
  }

  const formattedResult = Number.isFinite(result)
    ? Math.abs(result) >= 1000
      ? result.toLocaleString(undefined, { maximumFractionDigits: 4 })
      : Number(result.toPrecision(6)).toString()
    : '0';

  const unitsList =
    category === 'temperature'
      ? TEMP_UNITS
      : category === 'currency'
      ? CURRENCY_CODES.map((c) => ({ id: c, label: c }))
      : LINEAR_UNITS[category];

  const swap = () => {
    const tmp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tmp);
  };

  const copyAnswer = async () => {
    await navigator.clipboard.writeText(`${inputVal} ${fromUnit} = ${formattedResult} ${toUnit}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ['length', 'Length'],
            ['weight', 'Weight'],
            ['temperature', 'Temperature'],
            ['data', 'Data'],
            ['speed', 'Speed'],
            ['time', 'Time'],
            ['currency', 'Currency (Live)'],
          ] as Array<[CategoryId, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => handleCategoryChange(id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
              category === id
                ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.6)]'
                : 'bg-white/7 text-slate-300 hover:bg-white/12 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <div className="space-y-2">
          <label className="block text-xs text-slate-400">From</label>
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#161231] border border-purple-500/30 text-xs text-white"
          >
            {unitsList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="any"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/8 border border-purple-400/40 text-lg font-semibold text-white tabular-nums focus:outline-none focus:border-purple-400"
          />
        </div>

        <button
          type="button"
          onClick={swap}
          title="Swap units"
          className="h-11 w-11 mx-auto rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-100 flex items-center justify-center cursor-pointer"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        <div className="space-y-2">
          <label className="block text-xs text-slate-400">To</label>
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#161231] border border-purple-500/30 text-xs text-white"
          >
            {unitsList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
          <div className="w-full px-3.5 py-2.5 rounded-xl bg-purple-950/50 border border-purple-400/35 text-lg font-bold text-purple-100 tabular-nums truncate">
            {formattedResult}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-purple-500/15 text-xs text-slate-400">
        <div>
          {category === 'currency' && (
            <button
              type="button"
              onClick={loadRates}
              className="flex items-center gap-1.5 text-purple-300 hover:text-purple-200 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingFx ? 'animate-spin' : ''}`} />
              <span>{ratesLive ? 'Live FX rates synced' : 'Refresh live FX rates'}</span>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={copyAnswer}
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium flex items-center gap-1.5 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Result'}</span>
        </button>
      </div>
    </div>
  );
};
