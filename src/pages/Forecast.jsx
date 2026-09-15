import React, { useState, useEffect, useMemo } from 'react';
import { loadFlightData, formatCurrency } from '../services/flightDataService';
import api from '../services/api';
import ChartCard from '../components/ChartCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  Sparkles,
  Info,
  TrendingUp,
  AlertCircle,
  Code2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

const Forecast = () => {
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSource, setSelectedSource] = useState('Bangalore');
  const [selectedDestination, setSelectedDestination] = useState('New Delhi');
  const [forecastData, setForecastData] = useState(null);

  const sources = useMemo(() => {
    return Array.from(new Set(allFlights.map((f) => f.Source).filter(Boolean))).sort();
  }, [allFlights]);

  const destinations = useMemo(() => {
    return Array.from(new Set(allFlights.map((f) => f.Destination).filter(Boolean))).sort();
  }, [allFlights]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadFlightData();
      setAllFlights(data);

      const fData = await api.getForecast(selectedSource, selectedDestination);
      setForecastData(fData);
    } catch (err) {
      console.error('Error loading forecast', err);
      setError('Unable to load forecast module.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSource, selectedDestination]);

  if (loading && !forecastData) {
    return <Loading message="Loading airfare forecast structure..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Forecast / Model Output
              </span>
              <span className="text-xs text-slate-400">Step 9 Specification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Airfare Forecast
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Forward projection structure ready for machine learning model linkage
            </p>
          </div>

          {/* Route selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 self-start md:self-auto">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {sources.map((s) => (
                <option key={`fsrc-${s}`} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <span className="text-slate-400 text-xs">→</span>

            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {destinations.map((d) => (
                <option key={`fdst-${d}`} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Prominent Demo / Placeholder Notice (Step 9 Requirement) */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-900 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">
              Model Output Notice
            </h3>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              <strong>Forecast will be connected to the backend ML model.</strong> The current historical CSV dataset contains historical observations. This UI structure is fully prepared to consume predictions from an ML backend microservice (e.g. ARIMA / Prophet / LSTM) via <code>GET /api/forecast</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Forecast Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            CSV Baseline Fare
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatCurrency(forecastData?.currentPrice || 6500)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Actual mean from CSV for {selectedSource} → {selectedDestination}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Predicted Airfare Index
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-600">
            {forecastData?.currentIndex || '104.2'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Expected 7-day weighted index
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Expected Price Trend
          </span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-rose-600" />
            <span className="text-xl font-bold font-mono text-rose-600">
              {forecastData?.trend || 'Increasing'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Projected upward demand trajectory
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Confidence Information
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {((forecastData?.confidence || 0.86) * 100).toFixed(0)}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Forecast Horizon: 7 Days (± ₹300)
          </span>
        </div>
      </div>

      {/* Forecast Chart */}
      <ChartCard
        title={`7-Day Predicted Airfare Trend (${selectedSource} → ${selectedDestination})`}
        subtitle="UI demonstration chart ready for live ML endpoint response"
        badge="Forecast / Model Output"
        badgeBg="bg-amber-50 text-amber-800 border-amber-200"
      >
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={forecastData?.forecast || []}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                formatter={(val, name) => [
                  name === 'price'
                    ? formatCurrency(val)
                    : name === 'index'
                    ? `${val}`
                    : formatCurrency(val),
                  name === 'price'
                    ? 'Predicted Fare'
                    : name === 'index'
                    ? 'Airfare Index'
                    : name,
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="url(#forecastArea)"
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Backend API Integration Contract (Step 9 & 11) */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="w-5 h-5 text-indigo-400" />
          <h4 className="text-sm font-bold text-white">
            Backend REST API Specification (GET /api/forecast)
          </h4>
        </div>
        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
          The frontend service <code>src/services/api.js</code> is already configured to seamlessly proxy to your Python / Node forecasting service when <code>VITE_API_BASE_URL</code> is set. Expected response format:
        </p>
        <pre className="bg-slate-950 p-4 rounded-xl text-xs text-emerald-400 font-mono overflow-x-auto border border-slate-800">
{`GET /api/forecast?source=${selectedSource}&destination=${selectedDestination}

Response 200 OK:
{
  "route": "${selectedSource} → ${selectedDestination}",
  "currentPrice": ${forecastData?.currentPrice || 6500},
  "predictedAirfareIndex": 108.5,
  "trend": "increasing",
  "confidence": 0.86,
  "forecast": [
    { "day": "Day 1", "price": 6630, "lowerBound": 6330, "upperBound": 6980 },
    { "day": "Day 2", "price": 6760, "lowerBound": 6460, "upperBound": 7110 }
  ]
}`}
        </pre>
      </div>
    </div>
  );
};

export default Forecast;
