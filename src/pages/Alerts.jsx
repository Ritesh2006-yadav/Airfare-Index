import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency } from '../services/flightDataService';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Info,
  Calendar,
} from 'lucide-react';

const Alerts = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [selectedSeverity, setSelectedSeverity] = useState('All');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAlerts();
      setAlertsData(res);
    } catch (err) {
      console.error('Error loading alerts', err);
      setError('Unable to load airfare alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const alerts = alertsData?.alerts || [];
  const filteredAlerts = alerts.filter((item) => {
    if (selectedSeverity === 'All') return true;
    return item.severity.toLowerCase() === selectedSeverity.toLowerCase();
  });

  const criticalCount = alerts.filter((a) => a.severity === 'Critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'Warning').length;
  const normalCount = alerts.filter((a) => a.severity === 'Normal').length;

  if (loading && !alertsData) {
    return <Loading message="Analyzing dataset for airfare anomalies..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchAlerts} />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                Demo alerts based on current dataset
              </span>
              <span className="text-xs text-slate-400">Step 10 Requirements</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Airfare Alerts & Anomaly Detection
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Identifies unusual price surges and high airfares directly from the CSV flight records
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAlerts}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition shadow-2xs self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Re-evaluate CSV</span>
          </button>
        </div>
      </div>

      {/* Prominent Demo Disclaimer (Step 10 Requirement) */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 text-blue-900 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-xl bg-blue-100 text-blue-800 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-950">
              Demo alerts based on current dataset
            </h3>
            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
              These alerts are computed by evaluating individual flight records in <code>Flight_Data_Final_Index.csv</code> against their respective <code>Route_Month_Median</code> baseline and <code>Airfare_Index</code>. They are labeled as demo anomaly triggers and do not represent real-time live flight scrape feeds.
            </p>
          </div>
        </div>
      </div>

      {/* Anomaly Counts Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Flight Records Evaluated
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {alertsData?.totalMonitored?.toLocaleString() || '10,462'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Full dataset scan</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block mb-1">
            Critical Surges
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600">
            {criticalCount} Spikes
          </div>
          <span className="text-[11px] text-rose-500 mt-1 block">&gt;35% above route median</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block mb-1">
            Warning Alerts
          </span>
          <div className="text-2xl font-bold font-mono text-amber-700">
            {warningCount} Corridors
          </div>
          <span className="text-[11px] text-amber-600 mt-1 block">Unusual fare elevation</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
            Normal Benchmarks
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {normalCount} Flights
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block">Close to route median</span>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['All', 'Critical', 'Warning', 'Normal'].map((sev) => {
          const isSelected = selectedSeverity.toLowerCase() === sev.toLowerCase();
          return (
            <button
              key={sev}
              type="button"
              onClick={() => setSelectedSeverity(sev)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {sev === 'All' ? 'All Alerts' : `${sev} Severity`}
            </button>
          );
        })}
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAlerts.map((item) => {
          const isCritical = item.severity === 'Critical';
          const isWarning = item.severity === 'Warning';
          const isNormal = item.severity === 'Normal';

          return (
            <div
              key={item.id}
              className={`rounded-2xl p-5 border transition-all ${
                isCritical
                  ? 'bg-rose-50/40 border-rose-200/90 hover:border-rose-300 shadow-2xs'
                  : isWarning
                  ? 'bg-amber-50/40 border-amber-200/90 hover:border-amber-300 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
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
                    <div className="text-[11px] text-slate-400 font-mono">
                      {item.id} ({item.flightId})
                    </div>
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
                    {item.severity}
                  </span>
                </div>
              </div>

              {/* Route & Airline */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-slate-900 font-mono tracking-tight">
                    {item.route}
                  </span>
                </div>
                <div className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800">
                  {item.airline}
                </div>
              </div>

              {/* Price Details */}
              <div className="grid grid-cols-3 gap-2 my-3">
                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/70">
                  <div className="text-[11px] text-slate-500 font-medium">Flight Price</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {formatCurrency(item.currentPrice)}
                  </div>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/70">
                  <div className="text-[11px] text-slate-500 font-medium">Route Median</div>
                  <div className="text-base font-bold font-mono text-slate-700 mt-0.5">
                    {formatCurrency(item.medianPrice)}
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
                    {item.deviation}
                  </div>
                </div>
              </div>

              {/* Diagnostic Description */}
              <p className="text-xs text-slate-600 leading-relaxed bg-white/60 p-2.5 rounded-xl border border-slate-200/50">
                <strong className="text-slate-800 font-semibold">Diagnostic: </strong>
                {item.reason}
              </p>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Journey Date: {item.date}</span>
                <span>Airfare Index: <strong className="font-mono text-slate-700">{item.airfareIndex}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Alerts;
