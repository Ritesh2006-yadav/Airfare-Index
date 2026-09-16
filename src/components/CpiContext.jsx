import React from 'react';
import { BookOpen, ShieldCheck, Scale, Sparkles } from 'lucide-react';

const CpiContext = () => {
  return (
    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 border border-indigo-900/60 shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Scale className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
              Why Airfare Index Matters
            </h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            "Airfare prices can change significantly across routes, airlines and travel periods. This continuously updated index provides a market signal that can complement CPI-related airfare monitoring."
          </p>
          <p className="text-xs text-slate-400">
            * Note: This analytical platform synthesizes real-time high-frequency automated web scraping data to track dynamic aviation fare volatility and market trends. It serves as an experimental decision-support model to augment official statistical survey methods conducted by national statistical agencies.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 shrink-0 lg:w-72">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Index Model</div>
            <div className="text-sm font-bold text-indigo-300 mt-0.5">Laspeyres Aggregation</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Data Frequency</div>
            <div className="text-sm font-bold text-emerald-300 mt-0.5">High-Frequency Real-Time</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Sub-Index Basket</div>
            <div className="text-sm font-bold text-sky-300 mt-0.5">Transport & Comm.</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Target Use Case</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5">Inflation Surveillance</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CpiContext;
