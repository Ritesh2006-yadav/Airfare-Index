import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

import {
  loadFlightData,
  formatCurrency,
} from '../services/flightDataService';

import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const Alerts = () => {
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    data: flights,
    isLoading,
    error,
  } = useFlightData(refreshKey);

  /*
   * ---------------------------------------------------------
   * CREATE ALERTS DIRECTLY FROM CSV DATA
   * ---------------------------------------------------------
   *
   * Critical:
   *   Price >= Route Median + 35%
   *
   * Warning:
   *   Price >= Route Median + 15%
   *
   * Normal:
   *   Price is close to route median
   */

  const alertsData = useMemo(() => {
    if (!flights || flights.length === 0) {
      return {
        alerts: [],
        critical: 0,
        warning: 0,
        normal: 0,
        total: 0,
      };
    }

    const generatedAlerts = [];

    flights.forEach((flight, index) => {
      const price = Number(flight.Price) || 0;

      const median =
        Number(flight.Route_Month_Median) ||
        Number(flight.Route_Class_Median) ||
        price;

      const airfareIndex = Number(flight.Airfare_Index) || 100;

      if (!price || !median) return;

      const deviation = ((price - median) / median) * 100;

      let severity = 'Normal';

      if (deviation >= 35) {
        severity = 'Critical';
      } else if (deviation >= 15) {
        severity = 'Warning';
      }

      /*
       * Keep all normal records available for statistics,
       * but only show a small number of normal alerts in the UI.
       */
      generatedAlerts.push({
        id: `ALT-${String(index + 1).padStart(4, '0')}`,
        flightId: flight.id || `CSV-${index + 1}`,

        route:
          flight.Route ||
          `${flight.Source || ''} → ${flight.Destination || ''}`,

        airline: flight.Airline || 'Unknown Airline',

        currentPrice: price,
        medianPrice: median,

        deviation,

        severity,

        airfareIndex,

        date:
          flight.Date_of_Journey ||
          flight.date ||
          'Not available',

        bookingWindow:
          flight.Booking_Window ||
          'Not available',

        daysLeft:
          flight.Days_Left !== undefined
            ? flight.Days_Left
            : null,

        flight:
          flight.Flight ||
          'Flight record',

        reason:
          severity === 'Critical'
            ? `High surge fare exceeding the route benchmark by ${deviation.toFixed(
                1
              )}%.`
            : severity === 'Warning'
            ? `Fare is ${deviation.toFixed(
                1
              )}% above the route benchmark.`
            : `Fare is within the normal range of the route benchmark.`,
      });
    });

    /*
     * Sort:
     * Critical first
     * Warning second
     * Normal last
     *
     * Within each category, highest deviation first.
     */
    generatedAlerts.sort((a, b) => {
      const severityRank = {
        Critical: 3,
        Warning: 2,
        Normal: 1,
      };

      if (severityRank[b.severity] !== severityRank[a.severity]) {
        return (
          severityRank[b.severity] -
          severityRank[a.severity]
        );
      }

      return b.deviation - a.deviation;
    });

    return {
      alerts: generatedAlerts,
      critical: generatedAlerts.filter(
        (item) => item.severity === 'Critical'
      ).length,

      warning: generatedAlerts.filter(
        (item) => item.severity === 'Warning'
      ).length,

      normal: generatedAlerts.filter(
        (item) => item.severity === 'Normal'
      ).length,

      total: generatedAlerts.length,
    };
  }, [flights]);

  /*
   * Filter alerts according to selected tab.
   *
   * To keep the browser fast with 300,153 records,
   * only the most relevant alerts are rendered.
   */
  const filteredAlerts = useMemo(() => {
    let result = alertsData.alerts;

    if (selectedSeverity !== 'All') {
      result = result.filter(
        (item) =>
          item.severity.toLowerCase() ===
          selectedSeverity.toLowerCase()
      );
    }

    /*
     * Show maximum 40 cards.
     * The statistics above still use the complete dataset.
     */
    return result.slice(0, 40);
  }, [alertsData.alerts, selectedSeverity]);

  const handleRefresh = () => {
    setRefreshKey((value) => value + 1);
  };

  if (isLoading) {
    return (
      <Loading message="Analyzing 300,153 airfare records for anomalies..." />
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message="Unable to analyze the airfare dataset."
        onRetry={handleRefresh}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div>

            <div className="flex items-center gap-2 mb-1">

              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                CSV-Based Anomaly Detection
              </span>

              <span className="text-xs text-slate-400">
                300,153 Records
              </span>

            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Airfare Alerts & Anomaly Detection
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Identifies unusual airfare surges by comparing
              individual flight prices with their route benchmark.
            </p>

          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition shadow-2xs self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Re-evaluate CSV</span>
          </button>

        </div>

      </div>


      {/* =====================================================
          INFORMATION CARD
      ====================================================== */}

      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 text-blue-900 shadow-2xs">

        <div className="flex items-start gap-3">

          <div className="p-1.5 rounded-xl bg-blue-100 text-blue-800 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>

          <div>

            <h3 className="text-sm font-bold text-blue-950">
              How anomaly detection works
            </h3>

            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
              Each flight record is compared with its
              route-level benchmark from the CSV dataset.
              A fare above 35% of the benchmark is classified
              as Critical, while a fare 15%–35% above the
              benchmark is classified as Warning.
              Prices close to the benchmark are classified
              as Normal.
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">

        {/* TOTAL */}

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">

          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Flight Records Evaluated
          </span>

          <div className="text-2xl font-bold font-mono text-slate-900">
            {alertsData.total.toLocaleString()}
          </div>

          <span className="text-[11px] text-slate-400 mt-1 block">
            Complete CSV dataset
          </span>

        </div>


        {/* CRITICAL */}

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">

          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block mb-1">
            Critical Surges
          </span>

          <div className="text-2xl font-bold font-mono text-rose-600">
            {alertsData.critical.toLocaleString()}
          </div>

          <span className="text-[11px] text-rose-500 mt-1 block">
            ≥35% above route benchmark
          </span>

        </div>


        {/* WARNING */}

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">

          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block mb-1">
            Warning Alerts
          </span>

          <div className="text-2xl font-bold font-mono text-amber-700">
            {alertsData.warning.toLocaleString()}
          </div>

          <span className="text-[11px] text-amber-600 mt-1 block">
            15%–35% above benchmark
          </span>

        </div>


        {/* NORMAL */}

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">

          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
            Normal Benchmarks
          </span>

          <div className="text-2xl font-bold font-mono text-emerald-700">
            {alertsData.normal.toLocaleString()}
          </div>

          <span className="text-[11px] text-emerald-600 mt-1 block">
            Close to route benchmark
          </span>

        </div>

      </div>


      {/* =====================================================
          SEVERITY FILTER
      ====================================================== */}

      <div className="flex flex-wrap items-center gap-2">

        {['All', 'Critical', 'Warning', 'Normal'].map(
          (severity) => {

            const isSelected =
              selectedSeverity.toLowerCase() ===
              severity.toLowerCase();

            return (
              <button
                key={severity}
                type="button"
                onClick={() =>
                  setSelectedSeverity(severity)
                }
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {severity === 'All'
                  ? 'All Alerts'
                  : `${severity} Severity`}
              </button>
            );
          }
        )}

      </div>


      {/* =====================================================
          RESULT INFORMATION
      ====================================================== */}

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-lg font-bold text-slate-900">
            Detected Airfare Patterns
          </h2>

          <p className="text-xs text-slate-500 mt-0.5">
            Showing the highest-priority records from the
            complete dataset.
          </p>

        </div>

        <span className="text-xs font-semibold text-slate-500">
          {filteredAlerts.length} shown
        </span>

      </div>


      {/* =====================================================
          ALERT CARDS
      ====================================================== */}

      {filteredAlerts.length === 0 ? (

        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">

          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />

          <h3 className="font-bold text-slate-900">
            No alerts found
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            No records match the selected severity.
          </p>

        </div>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {filteredAlerts.map((item) => {

            const isCritical =
              item.severity === 'Critical';

            const isWarning =
              item.severity === 'Warning';

            const isNormal =
              item.severity === 'Normal';

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

                {/* TOP */}

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
                        {isCritical
                          ? 'Price Surge Detected'
                          : isWarning
                          ? 'Price Warning'
                          : 'Normal Route Pricing'}
                      </span>

                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.id} ({item.flightId})
                      </div>

                    </div>

                  </div>


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


                {/* ROUTE */}

                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">

                  <div className="text-lg font-extrabold text-slate-900 font-mono tracking-tight">
                    {item.route}
                  </div>

                  <div className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800">
                    {item.airline}
                  </div>

                </div>


                {/* PRICE DETAILS */}

                <div className="grid grid-cols-3 gap-2 my-3">

                  <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/70">

                    <div className="text-[11px] text-slate-500 font-medium">
                      Flight Price
                    </div>

                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                      {formatCurrency(item.currentPrice)}
                    </div>

                  </div>


                  <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/70">

                    <div className="text-[11px] text-slate-500 font-medium">
                      Route Benchmark
                    </div>

                    <div className="text-base font-bold font-mono text-slate-700 mt-0.5">
                      {formatCurrency(item.medianPrice)}
                    </div>

                  </div>


                  <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/70">

                    <div className="text-[11px] text-slate-500 font-medium">
                      Deviation
                    </div>

                    <div
                      className={`text-base font-bold font-mono mt-0.5 ${
                        isCritical
                          ? 'text-rose-600'
                          : isWarning
                          ? 'text-amber-700'
                          : 'text-emerald-600'
                      }`}
                    >
                      {item.deviation >= 0
                        ? '+'
                        : ''}
                      {item.deviation.toFixed(1)}%
                    </div>

                  </div>

                </div>


                {/* DIAGNOSTIC */}

                <p className="text-xs text-slate-600 leading-relaxed bg-white/60 p-2.5 rounded-xl border border-slate-200/50">

                  <strong className="text-slate-800 font-semibold">
                    Diagnostic:{' '}
                  </strong>

                  {item.reason}

                </p>


                {/* FOOTER */}

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">

                  <span>
                    Journey Date: {item.date}
                  </span>

                  <span>
                    Booking Window:{' '}
                    <strong className="font-mono text-slate-700">
                      {item.bookingWindow}
                    </strong>
                  </span>

                  <span>
                    Airfare Index:{' '}
                    <strong className="font-mono text-slate-700">
                      {item.airfareIndex.toFixed(2)}
                    </strong>
                  </span>

                </div>

              </div>

            );
          })}

        </div>

      )}

    </div>
  );
};


/*
 * ============================================================
 * DATA LOADER
 * ============================================================
 *
 * This loads the SAME CSV already being used by the dashboard.
 * No fake alert API is used.
 */

function useFlightData(refreshKey) {
  const [state, setState] = useState({
    data: [],
    isLoading: true,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setState({
          data: [],
          isLoading: true,
          error: null,
        });

        const data = await loadFlightData();

        if (!cancelled) {
          setState({
            data: Array.isArray(data) ? data : [],
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        console.error(
          'Failed to load airfare dataset:',
          err
        );

        if (!cancelled) {
          setState({
            data: [],
            isLoading: false,
            error: err,
          });
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return state;
}

export default Alerts;