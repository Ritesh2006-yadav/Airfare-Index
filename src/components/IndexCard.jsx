import React from 'react';
import { TrendingUp, TrendingDown, HelpCircle, ArrowUpRight, BarChart2 } from 'lucide-react';

const IndexCard = ({
  index = 117.4,
  changePercent = 7.4,
  basePeriod = 'Base Year 2025 = 100.0',
  currentPeriod = 'September 2026',
  subtitle = 'Compared with base period',
}) => {
  const isPositive = changePercent >= 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-indigo-900/50">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              National Benchmark Indicator
            </span>
            <span className="text-xs text-slate-400 font-medium">{currentPeriod}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
            India Airfare Price Index
          </h2>
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            Composite Laspeyres-weighted price metric synthesized from real-time fare scrapers across domestic airline direct portals and online travel agencies (OTAs).
          </p>
        </div>

        {/* Index Metric Display */}
        <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-4 sm:gap-6 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 backdrop-blur-sm self-start md:self-center">
          <div>
            <div className="text-xs uppercase font-medium text-slate-400 tracking-wider mb-1">
              Current Airfare Index
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
                {Number(index).toFixed(1)}
              </span>
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isPositive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {isPositive ? '↑' : '↓'} {Math.abs(changePercent)}%
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <span>{subtitle}</span>
              <span className="text-indigo-300 font-medium">({basePeriod})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexCard;
