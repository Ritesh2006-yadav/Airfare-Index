import React, { useState, useEffect } from 'react';
import { airfareService, formatCurrency } from '../services/airfareService';
import BookingWindowChart from '../components/BookingWindowChart';
import { CardSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';
import { AIRPORTS } from '../data/airports';
import {
  Clock,
  Calendar,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';

const BookingWindow = () => {
  const [source, setSource] = useState('Delhi');
  const [destination, setDestination] = useState('Mumbai');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windowData, setWindowData] = useState(null);

  const fetchBookingWindow = async (src, dst) => {
    try {
      setLoading(true);
      setError(null);
      const res = await airfareService.getBookingWindow(src, dst);
      setWindowData(res);
    } catch (err) {
      console.error('Error fetching booking window data', err);
      setError('Unable to load booking window analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingWindow(source, destination);
  }, [source, destination]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Route Selector */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Demo / Model Output
              </span>
              <span className="text-xs text-slate-400">Lead-Time Curve</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Booking Window Analysis
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Analyze how airfare dynamic pricing escalates based on days remaining before travel
            </p>
          </div>

          {/* Route Selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {AIRPORTS.map((a) => (
                <option key={`src-${a.code}`} value={a.city}>
                  {a.city}
                </option>
              ))}
            </select>

            <span className="text-slate-400 text-xs">→</span>

            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {AIRPORTS.map((a) => (
                <option key={`dst-${a.code}`} value={a.city}>
                  {a.city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => fetchBookingWindow(source, destination)} />
      ) : loading && !windowData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <ChartSkeleton />
        </div>
      ) : (
        <>
          {/* Milestone Advance Window Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  30 days before
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  -22% Base
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {formatCurrency(windowData?.windowPoints?.find((p) => p.daysNum === 30)?.price || 3800)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Advance discount tier</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  15 days before
                </span>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  Sweet Spot
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {formatCurrency(windowData?.windowPoints?.find((p) => p.daysNum === 15)?.price || 4200)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Optimal price-flexibility window</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  7 days before
                </span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Surge Begins
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {formatCurrency(windowData?.windowPoints?.find((p) => p.daysNum === 7)?.price || 5100)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Inventory buckets tighten</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  2 days before
                </span>
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  +55% Surge
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono text-rose-600">
                {formatCurrency(windowData?.windowPoints?.find((p) => p.daysNum === 2)?.price || 7500)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Last-minute premium pricing</div>
            </div>
          </div>

          {/* Advance Purchase Curve Chart */}
          <BookingWindowChart
            data={windowData?.windowPoints || []}
            title={`Lead-Time Dynamic Fare Trajectory (${source} → ${destination})`}
            subtitle="Demonstration of dynamic pricing yield management curves simulated for API readiness"
          />

          {/* Model Specification Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <h4 className="text-sm font-bold text-slate-900">
                  Model Output Disclosure & API Integration Specification
                </h4>
                <p className="leading-relaxed">
                  The advance booking metric tracks yield management algorithms across Indian airlines. In production, this module receives automated daily scrape batches scheduled across fixed advance horizons (T-30d, T-21d, T-14d, T-7d, T-2d, T-0d) via the <code>/api/booking-window</code> endpoint.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-700 border border-slate-200">
                  GET /api/booking-window?source={source}&destination={destination}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BookingWindow;
