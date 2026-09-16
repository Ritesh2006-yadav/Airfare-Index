import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({
  title,
  value,
  change,
  changeType = 'neutral', // 'increase' | 'decrease' | 'neutral'
  subtitle,
  icon: Icon,
  iconBg = 'bg-indigo-50 text-indigo-600',
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-xl ${iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">
          {value}
        </div>

        {change !== undefined && change !== null && (
          <div
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              changeType === 'increase'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : changeType === 'decrease'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {changeType === 'increase' && <TrendingUp className="w-3 h-3" />}
            {changeType === 'decrease' && <TrendingDown className="w-3 h-3" />}
            {changeType === 'neutral' && <Minus className="w-3 h-3" />}
            <span>{change}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatCard;
