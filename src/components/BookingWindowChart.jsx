import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { formatCurrency } from '../services/airfareService';
import { Clock, AlertCircle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs">
        <p className="font-semibold text-slate-300 mb-1">{data.days}</p>
        <div className="space-y-1 font-mono">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Average Fare:</span>
            <span className="text-emerald-400 font-bold">{formatCurrency(data.price)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-400">
            <span>Variance vs Base:</span>
            <span className={data.multiplier >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
              {data.multiplier >= 0 ? `+${data.multiplier}%` : `${data.multiplier}%`}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const BookingWindowChart = ({
  data = [],
  title = 'Advance Purchase Dynamic Pricing Curve',
  subtitle = 'Airfare surge trajectory plotted against lead time before departure',
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              Demo / Model Output
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="windowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="days"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
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
              dataKey="price"
              stroke="none"
              fill="url(#windowGradient)"
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#d97706"
              strokeWidth={3}
              dot={{ r: 5, fill: '#d97706', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 7, fill: '#b45309' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Notice: Analytical lead-time model simulation ready for automated API linkage</span>
        </div>
        <span className="font-medium text-slate-700">Sweet Spot: 15–21 Days Advance</span>
      </div>
    </div>
  );
};

export default BookingWindowChart;
