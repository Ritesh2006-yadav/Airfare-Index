import React from 'react';
import { formatCurrency } from '../services/airfareService';
import { AlertTriangle, AlertCircle, CheckCircle2, Clock, Plane, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AlertCard = ({ alert }) => {
  const {
    id,
    route,
    source,
    destination,
    airline,
    currentPrice,
    expectedRange,
    expectedPrice,
    deviation,
    severity,
    timestamp,
    triggerReason,
  } = alert;

  const isCritical = severity === 'Critical';
  const isWarning = severity === 'Warning';
  const isNormal = severity === 'Normal';

  return (
    <div
      className={`rounded-2xl p-5 border transition-all ${
        isCritical
          ? 'bg-rose-50/40 border-rose-200/90 hover:border-rose-300 hover:shadow-md'
          : isWarning
          ? 'bg-amber-50/40 border-amber-200/90 hover:border-amber-300 hover:shadow-md'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {isCritical && (
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}
          {isWarning && (
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          {isNormal && (
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          <div>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isCritical
                  ? 'text-rose-700'
                  : isWarning
                  ? 'text-amber-800'
                  : 'text-emerald-700'
              }`}
            >
              {isNormal ? 'Normal Route Pricing' : 'Price Anomaly Detected'}
            </span>
            <div className="text-[11px] text-slate-400 font-mono">{id}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isCritical
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : isWarning
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {severity}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timestamp}
          </span>
        </div>
      </div>

      {/* Route & Carrier Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-slate-900 font-mono tracking-tight">
            {route}
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            ({source} → {destination})
          </span>
        </div>
        <div className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {airline}
        </div>
      </div>

      {/* Metrics comparison */}
      <div className="grid grid-cols-3 gap-3 my-3">
        <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/70">
          <div className="text-[11px] text-slate-500 font-medium">Current Price</div>
          <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
            {formatCurrency(currentPrice)}
          </div>
        </div>

        <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/70">
          <div className="text-[11px] text-slate-500 font-medium">Expected Range</div>
          <div className="text-xs font-bold font-mono text-slate-700 mt-1">
            {expectedRange}
          </div>
        </div>

        <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/70">
          <div className="text-[11px] text-slate-500 font-medium">Deviation</div>
          <div
            className={`text-base font-bold font-mono mt-0.5 ${
              isCritical
                ? 'text-rose-600'
                : isWarning
                ? 'text-amber-700'
                : 'text-emerald-600'
            }`}
          >
            {deviation}
          </div>
        </div>
      </div>

      {/* Anomaly trigger narrative */}
      <p className="text-xs text-slate-600 leading-relaxed mt-2 mb-3 bg-white/60 p-2.5 rounded-xl border border-slate-200/40">
        <strong className="text-slate-800 font-semibold">Diagnostic: </strong>
        {triggerReason}
      </p>

      {/* Action link */}
      <div className="flex justify-end pt-1">
        <Link
          to={`/route-analysis?source=${source}&destination=${destination}`}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center gap-1"
        >
          <span>Deep-dive Route Analysis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default AlertCard;
