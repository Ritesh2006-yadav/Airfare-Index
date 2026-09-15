import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { formatCurrency } from '../services/airfareService';
import { TrendingUp, BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label, mode }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs">
        <p className="font-semibold text-slate-300 mb-1">{data.fullMonth || label} 2026</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Airfare Index:</span>
            <span className="font-mono font-bold text-indigo-400">{data.index}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Avg Ticket Fare:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatCurrency(data.avgFare)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[11px] pt-1 border-t border-slate-800">
            <span className="text-slate-500">Base Reference:</span>
            <span className="text-slate-400 font-mono">100.0</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const IndexChart = ({
  data = [],
  title = 'Historical Airfare Trend',
  subtitle = 'Tracking monthly index variation against the base period index (100.0)',
}) => {
  const [metricMode, setMetricMode] = useState('index'); // 'index' | 'fare'

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Base = 100
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>

        {/* Toggle between Airfare Index and Average Fare */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricMode('index')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              metricMode === 'index'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Airfare Index
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('fare')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              metricMode === 'fare'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Average Fare (₹)
          </button>
        </div>
      </div>

      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="indexGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fareGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
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
              domain={metricMode === 'index' ? [90, 135] : ['auto', 'auto']}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(v) => (metricMode === 'index' ? v : `₹${(v / 1000).toFixed(0)}k`)}
            />
            <Tooltip content={<CustomTooltip mode={metricMode} />} />

            {/* Base Reference Line at 100 */}
            {metricMode === 'index' && (
              <ReferenceLine
                y={100}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: 'Base 100.0',
                  position: 'insideBottomRight',
                  fill: '#94a3b8',
                  fontSize: 10,
                }}
              />
            )}

            {metricMode === 'index' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="index"
                  stroke="none"
                  fill="url(#indexGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="index"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#4338ca' }}
                />
              </>
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="avgFare"
                  stroke="none"
                  fill="url(#fareGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="avgFare"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#047857' }}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span>Airfare Index</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-slate-400 border border-dashed border-slate-400" />
            <span>Base Line (100.0)</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400">
          Source: Automated Web Scraping aggregation algorithm
        </span>
      </div>
    </div>
  );
};

export default IndexChart;
