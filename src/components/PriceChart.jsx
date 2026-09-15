import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../services/airfareService';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs">
        <p className="font-semibold text-slate-300 mb-1.5">{data.fullMonth || label} 2026</p>
        <div className="space-y-1 font-mono">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Average Fare:</span>
            <span className="text-indigo-400 font-bold">{formatCurrency(data.avgFare)}</span>
          </div>
          {data.minFare && (
            <div className="flex items-center justify-between gap-4 text-slate-400">
              <span>Lowest Seen:</span>
              <span className="text-emerald-400">{formatCurrency(data.minFare)}</span>
            </div>
          )}
          {data.maxFare && (
            <div className="flex items-center justify-between gap-4 text-slate-400">
              <span>Peak Recorded:</span>
              <span className="text-rose-400">{formatCurrency(data.maxFare)}</span>
            </div>
          )}
          {data.index && (
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-slate-300">
              <span>Route Index:</span>
              <span className="text-indigo-300 font-bold">{data.index}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const PriceChart = ({
  data = [],
  title = 'Route Historical Trend',
  subtitle = 'Monthly fare range and weighted average trajectory',
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
      <div className="mb-6">
        <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>

      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="routePriceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="avgFare"
              stroke="#4f46e5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#routePriceGradient)"
              dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#4338ca' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
