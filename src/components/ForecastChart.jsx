import React from 'react';
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
import { formatCurrency } from '../services/airfareService';
import { TrendingUp, Sparkles, ShieldAlert } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs">
        <p className="font-semibold text-slate-300 mb-1">{data.label} (Day {data.dayName})</p>
        <div className="space-y-1 font-mono">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Predicted Fare:</span>
            <span className="text-indigo-400 font-bold">{formatCurrency(data.price)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-400 text-[11px]">
            <span>Expected Range:</span>
            <span>
              {formatCurrency(data.lowerBound)} – {formatCurrency(data.upperBound)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-slate-300 text-[11px]">
            <span>Demand Pressure:</span>
            <span className="text-amber-400 font-medium">{data.demand}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ForecastChart = ({
  forecast = [],
  currentPrice = 5200,
  trend = 'increasing',
  confidence = 0.84,
  routeTitle = 'Delhi → Mumbai',
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              7-Day Airfare Projection ({routeTitle})
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              Demo / Model Output
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Predictive time-series model (Confidence Band: {(confidence * 100).toFixed(0)}%)
          </p>
        </div>

        {/* Confidence & Trend Pill */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 font-medium text-slate-700 flex items-center gap-1.5 border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Confidence: <strong className="font-semibold text-slate-900">{(confidence * 100).toFixed(0)}%</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 font-semibold text-rose-700 border border-rose-200 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="capitalize">{trend}</span>
          </div>
        </div>
      </div>

      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={forecast}
            margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="dayName"
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
            <Tooltip content={<CustomTooltip />} />
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
              dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#3730a3' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/70">
          ⚠️ Machine learning model output: ARIMA / Facebook Prophet / LSTM backend schema compatible.
        </span>
        <span className="font-mono text-slate-700">Baseline Fare: {formatCurrency(currentPrice)}</span>
      </div>
    </div>
  );
};

export default ForecastChart;
