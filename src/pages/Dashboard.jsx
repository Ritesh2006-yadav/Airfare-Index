import React, { useState, useEffect, useMemo } from 'react';

import api from '../services/api';

import {
  loadFlightData,
  filterFlights,
  getFilterOptions,
  calculateOverviewStats,
  getMonthlyIndexData,
  getAirlinePriceData,
  getRoutePriceData,
  getStopsPriceData,
  formatCurrency,
} from '../services/flightDataService';

import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import ChartCard from '../components/ChartCard';
import FlightTable from '../components/FlightTable';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

import {
  TrendingUp,
  CreditCard,
  Building2,
  Route as RouteIcon,
  RefreshCw,
  Sparkles,
  Search,
  Plane,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';

const AIRLINE_COLORS = [
  '#4f46e5',
  '#dc2626',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#0284c7',
  '#db2777',
  '#ea580c',
  '#475569',
  '#0d9488',
];

const Dashboard = () => {
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    airline: 'All',
    source: 'All',
    destination: 'All',
    bookingWindow: 'All',
  });

  // Smart Fare Checker
  const [smartFareInput, setSmartFareInput] = useState({
    source: '',
    destination: '',
    airline: '',
    flightClass: 'Economy',
    daysLeft: 7,
  });
  const [smartFareResult, setSmartFareResult] = useState(null);
  const [smartFareLoading, setSmartFareLoading] = useState(false);
  const [smartFareError, setSmartFareError] = useState('');

  // Load CSV data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await loadFlightData();

      setAllFlights(data);
    } catch (err) {
      console.error('Error loading CSV flight data:', err);
      setError('Unable to load airfare data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter dropdown options
  const filterOptions = useMemo(() => {
    return getFilterOptions(allFlights);
  }, [allFlights]);

  // Apply selected filters
  const filteredFlights = useMemo(() => {
    return filterFlights(allFlights, filters);
  }, [allFlights, filters]);

  // Dashboard statistics
  const stats = useMemo(() => {
    return calculateOverviewStats(filteredFlights);
  }, [filteredFlights]);

  // Booking Window chart
  const bookingWindowData = useMemo(() => {
    return getMonthlyIndexData(filteredFlights);
  }, [filteredFlights]);

  // Airline chart
  const airlinePriceData = useMemo(() => {
    return getAirlinePriceData(filteredFlights);
  }, [filteredFlights]);

  // Route chart
  const routePriceData = useMemo(() => {
    return getRoutePriceData(filteredFlights, 10);
  }, [filteredFlights]);

  // Stops chart
  const stopsPriceData = useMemo(() => {
    return getStopsPriceData(filteredFlights);
  }, [filteredFlights]);

  // Smart Fare Checker options
  const smartSourceOptions = useMemo(() => {
    return Array.from(
      new Set(allFlights.map((f) => f.Source).filter(Boolean))
    ).sort();
  }, [allFlights]);

  const smartDestinationOptions = useMemo(() => {
    return Array.from(
      new Set(allFlights.map((f) => f.Destination).filter(Boolean))
    ).sort();
  }, [allFlights]);

  const smartAirlineOptions = useMemo(() => {
    return Array.from(
      new Set(allFlights.map((f) => f.Airline).filter(Boolean))
    ).sort();
  }, [allFlights]);

  useEffect(() => {
    if (allFlights.length === 0) return;

    setSmartFareInput((prev) => ({
      ...prev,
      source: prev.source || allFlights[0].Source || '',
      destination: prev.destination || allFlights[0].Destination || '',
      airline: prev.airline || allFlights[0].Airline || '',
    }));
  }, [allFlights]);

  const handleSmartFareCheck = async () => {
    const { source, destination, airline, flightClass, daysLeft } = smartFareInput;

    if (!source || !destination || !airline || !flightClass || !daysLeft) {
      setSmartFareError('Please select all flight details first.');
      return;
    }

    setSmartFareLoading(true);
    setSmartFareError('');
    setSmartFareResult(null);

    try {
      // Use a matching historical record only to fill flight characteristics
      // that the trained model expects (time, stops, duration).
      const matchingFlight =
        allFlights.find(
          (f) =>
            f.Source === source &&
            f.Destination === destination &&
            f.Airline === airline &&
            f.Class === flightClass
        ) ||
        allFlights.find(
          (f) =>
            f.Source === source &&
            f.Destination === destination &&
            f.Airline === airline
        ) ||
        allFlights.find(
          (f) =>
            f.Source === source &&
            f.Destination === destination
        );

      if (!matchingFlight) {
        throw new Error('No matching flight pattern was found for this route.');
      }

      const departureTime = matchingFlight.Departure_Time || 'Morning';
      const arrivalTime = matchingFlight.Arrival_Time || 'Evening';
      const stopsNumeric = Number(
        matchingFlight.Total_Stops ?? matchingFlight.Stops_Numeric ?? 0
      );
      const durationMinutes = Number(
        matchingFlight.Duration_Minutes ?? 120
      );

      const bookingWindow =
        Number(daysLeft) >= 15
          ? 'Early'
          : Number(daysLeft) >= 8
          ? 'Normal'
          : 'Last minute';

      const result = await api.getForecast(
        source,
        destination,
        airline,
        departureTime,
        arrivalTime,
        flightClass,
        Number(daysLeft),
        stopsNumeric,
        durationMinutes,
        bookingWindow
      );

      if (result.isDemoModelOutput) {
        throw new Error(
          'AI backend is unavailable. Please make sure FastAPI and ngrok are running.'
        );
      }

      setSmartFareResult(result);
    } catch (err) {
      console.error('Smart Fare Checker error:', err);
      setSmartFareError(
        err.message || 'Unable to generate an AI fare estimate.'
      );
    } finally {
      setSmartFareLoading(false);
    }
  };

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((value) => value !== 'All').length;
  }, [filters]);

  const indexDifference = stats.currentAirfareIndex - 100;

  // Filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      airline: 'All',
      source: 'All',
      destination: 'All',
      bookingWindow: 'All',
    });
  };

  // Loading screen
  if (loading) {
    return <Loading message="Loading airfare data..." />;
  }

  // Error screen
  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* =========================================================
          HEADER
      ========================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            India Airfare Price Index
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time analysis of domestic airfare prices across India
          </p>

        </div>

        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition shadow-2xs self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />

          <span>
            Reload Dataset
          </span>
        </button>

      </div>


      {/* =========================================================
          STATISTICS CARDS
      ========================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* 1. Current Airfare Index */}
        <StatCard
          title="Current Airfare Index"
          value={stats.currentAirfareIndex.toFixed(1)}
          subtitle="Base value = 100"
          icon={TrendingUp}
          iconBg="bg-indigo-50 text-indigo-600"
          change={`${stats.currentAirfareIndex >= 100 ? '+' : ''}${(
            stats.currentAirfareIndex - 100
          ).toFixed(1)}%`}
          changeType={
            stats.currentAirfareIndex >= 100
              ? 'increase'
              : 'decrease'
          }
        />

        {/* 2. Average Flight Price */}
        <StatCard
          title="Average Flight Price"
          value={formatCurrency(stats.averagePrice)}
          subtitle={`Average price / ${stats.totalFlights.toLocaleString()} flights`}
          icon={CreditCard}
          iconBg="bg-emerald-50 text-emerald-600"
        />

        {/* 3. Number of Airlines */}
        <StatCard
          title="Number of Airlines"
          value={stats.airlineCount}
          subtitle="Unique carriers in filtered records"
          icon={Building2}
          iconBg="bg-purple-50 text-purple-600"
        />

        {/* 4. Number of Routes */}
        <StatCard
          title="Number of Routes"
          value={stats.routeCount}
          subtitle="Unique Source → Destination pairs"
          icon={RouteIcon}
          iconBg="bg-sky-50 text-sky-600"
        />

      </div>


      {/* =========================================================
          QUICK AI INSIGHT
      ========================================================== */}
      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/60 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-xl bg-indigo-100 p-2.5 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Quick AI Insight</h2>
                <span className="rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  Data-driven
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {stats.currentAirfareIndex >= 110
                  ? `Airfare levels are ${Math.abs(indexDifference).toFixed(1)}% above the base benchmark.`
                  : stats.currentAirfareIndex <= 90
                  ? `Airfare levels are ${Math.abs(indexDifference).toFixed(1)}% below the base benchmark.`
                  : 'Airfare levels are currently close to the base benchmark.'}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Base index = 100. This insight updates automatically with your current filters.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:min-w-[520px]">
            <div className="rounded-xl border border-white bg-white/90 px-3 py-2.5 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Index</p>
              <p className="mt-0.5 text-sm font-bold text-indigo-600">
                {stats.currentAirfareIndex.toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl border border-white bg-white/90 px-3 py-2.5 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Average fare</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {formatCurrency(stats.averagePrice)}
              </p>
            </div>
            <div className="rounded-xl border border-white bg-white/90 px-3 py-2.5 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Records</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {filteredFlights.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SMART FARE CHECKER
      ========================================================== */}
      <section className="rounded-2xl border border-indigo-100 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Check a Flight Fare
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Get an AI-based fare estimate for a route in a few clicks.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full lg:w-auto lg:min-w-[760px]">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">From</span>
              <select
                value={smartFareInput.source}
                onChange={(e) =>
                  setSmartFareInput((prev) => ({ ...prev, source: e.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {smartSourceOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">To</span>
              <select
                value={smartFareInput.destination}
                onChange={(e) =>
                  setSmartFareInput((prev) => ({ ...prev, destination: e.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {smartDestinationOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Airline</span>
              <select
                value={smartFareInput.airline}
                onChange={(e) =>
                  setSmartFareInput((prev) => ({ ...prev, airline: e.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {smartAirlineOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Class</span>
              <select
                value={smartFareInput.flightClass}
                onChange={(e) =>
                  setSmartFareInput((prev) => ({ ...prev, flightClass: e.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="Economy">Economy</option>
                <option value="Business">Business</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Days left</span>
              <select
                value={smartFareInput.daysLeft}
                onChange={(e) =>
                  setSmartFareInput((prev) => ({
                    ...prev,
                    daysLeft: Number(e.target.value),
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                {[1, 2, 3, 5, 7, 10, 15, 20, 30].map((day) => (
                  <option key={day} value={day}>
                    {day} days
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            onClick={handleSmartFareCheck}
            disabled={smartFareLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {smartFareLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {smartFareLoading ? 'Checking fare...' : 'Check with AI'}
          </button>

          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Prediction uses the selected booking horizon and flight characteristics.
          </div>
        </div>

        {smartFareError && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {smartFareError}
          </div>
        )}

        {smartFareResult && (
          <div className="mt-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-white to-purple-50/50 p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  AI estimate
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
                  <span>{smartFareResult.route}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <span>{smartFareInput.airline}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
                <div className="rounded-xl bg-white border border-slate-200 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Predicted fare</p>
                  <p className="mt-0.5 text-sm font-bold text-indigo-600">
                    {formatCurrency(smartFareResult.currentPrice)}
                  </p>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Index</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {Number(smartFareResult.currentIndex).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Fare status</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {smartFareResult.fareStatus || 'Normal'}
                  </p>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Booking advice</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {smartFareResult.trend || 'Monitor'}
                  </p>
                </div>
              </div>
            </div>

            {smartFareResult.aiRecommendation && (
              <div className="mt-3 rounded-xl bg-white/90 border border-white px-4 py-3 text-sm text-slate-700">
                <strong className="text-slate-900">AI insight:</strong>{' '}
                {smartFareResult.aiRecommendation}
              </div>
            )}
          </div>
        )}
      </section>

      {/* =========================================================
          FILTER BAR
      ========================================================== */}
      <FilterBar
        filters={filters}
        options={filterOptions}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />


      {/* =========================================================
          EMPTY STATE
      ========================================================== */}
      {filteredFlights.length === 0 ? (

        <EmptyState
          onReset={handleResetFilters}
        />

      ) : (

        <>

          {/* =====================================================
              CHART GRID
          ====================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


            {/* =================================================
                CHART 1
            ================================================== */}
            <ChartCard
              title="1. Airfare Index by Booking Window"
              subtitle="X-axis: Booking Window, Y-axis: Airfare Index"
              badge="Booking Pattern"
              badgeBg="bg-indigo-50 text-indigo-700 border-indigo-200"
            >

              <div className="h-72 w-full">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart
                    data={bookingWindowData}
                    margin={{
                      top: 10,
                      right: 15,
                      left: -20,
                      bottom: 0,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />

                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={{
                        stroke: '#e2e8f0',
                      }}
                      tick={{
                        fill: '#64748b',
                        fontSize: 12,
                      }}
                    />

                    <YAxis
                      domain={['auto', 'auto']}
                      tickLine={false}
                      axisLine={{
                        stroke: '#e2e8f0',
                      }}
                      tick={{
                        fill: '#64748b',
                        fontSize: 12,
                      }}
                    />

                    <Tooltip
                      formatter={(value) => [
                        value,
                        'Airfare Index',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />

                    <ReferenceLine
                      y={100}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Base 100',
                        fill: '#94a3b8',
                        fontSize: 10,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="Airfare_Index"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{
                        r: 5,
                        fill: '#4f46e5',
                        strokeWidth: 2,
                        stroke: '#ffffff',
                      }}
                      activeDot={{
                        r: 7,
                      }}
                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>

            </ChartCard>


            {/* =================================================
                CHART 2
            ================================================== */}
            <ChartCard
              title="2. Average Price by Airline"
              subtitle="X-axis: Airline, Y-axis: Average Price"
              badge="Carrier Benchmark"
              badgeBg="bg-purple-50 text-purple-700 border-purple-200"
            >

              <div className="h-72 w-full">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={airlinePriceData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -10,
                      bottom: 40,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />

                    <XAxis
                      dataKey="airline"
                      tickLine={false}
                      axisLine={{
                        stroke: '#e2e8f0',
                      }}
                      tick={{
                        fill: '#64748b',
                        fontSize: 10,
                      }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                    />

                    <YAxis
                      tickLine={false}
                      axisLine={{
                        stroke: '#e2e8f0',
                      }}
                      tick={{
                        fill: '#64748b',
                        fontSize: 12,
                      }}
                      tickFormatter={(value) =>
                        `₹${(value / 1000).toFixed(0)}k`
                      }
                    />

                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value),
                        'Avg Price',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />

                    <Bar
                      dataKey="avgPrice"
                      radius={[6, 6, 0, 0]}
                    >

                      {airlinePriceData.map(
                        (_, index) => (
                          <Cell
                            key={`airline-cell-${index}`}
                            fill={
                              AIRLINE_COLORS[
                                index %
                                  AIRLINE_COLORS.length
                              ]
                            }
                          />
                        )
                      )}

                    </Bar>

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </ChartCard>


            {/* =================================================
                CHART 3
            ================================================== */}
            <ChartCard
              title="3. Average Price by Route"
              subtitle="Source → Destination against average Price"
              badge="Top Corridors"
              badgeBg="bg-sky-50 text-sky-700 border-sky-200"
            >

              <div className="h-72 w-full">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={routePriceData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -10,
                      bottom: 45,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />

                    <XAxis
                      dataKey="route"
                      tickLine={false}
                      axisLine={{
                        stroke: '#e2e8f0',
                      }}
                      tick={{
                        fill: '#64748b',
                        fontSize: 10,
                      }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                    />

                    <YAxis
                      tickLine={false}
                      axisLine={{
                        stroke: '#e2e8f0',
                      }}
                      tick={{
                        fill: '#64748b',
                        fontSize: 12,
                      }}
                      tickFormatter={(value) =>
                        `₹${(value / 1000).toFixed(0)}k`
                      }
                    />

                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value),
                        'Avg Price',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />

                    <Bar
                      dataKey="avgPrice"
                      fill="#0284c7"
                      radius={[6, 6, 0, 0]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </ChartCard>


            {/* =================================================
                CHART 4
            ================================================== */}
            <ChartCard
              title="4. Price Distribution by Stops"
              subtitle="Average flight price grouped by number of stops"
              badge="Stops Impact"
              badgeBg="bg-amber-50 text-amber-800 border-amber-200"
            >

              <div className="h-72 w-full">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={stopsPriceData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -10,
                      bottom: 0,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />

                    <XAxis
                      dataKey="stops"
                      tickLine={false}
                      axisLine={{
                        stroke: '#e2e8f0',
                      }}
                      tick={{
                        fill: '#64748b',
                        fontSize: 12,
                      }}
                    />

                    <YAxis
                      tickLine={false}
                      axisLine={{
                        stroke: '#e2e8f0',
                      }}
                      tick={{
                        fill: '#64748b',
                        fontSize: 12,
                      }}
                      tickFormatter={(value) =>
                        `₹${(value / 1000).toFixed(0)}k`
                      }
                    />

                    <Tooltip
                      formatter={(value, name) => [
                        name === 'avgPrice'
                          ? formatCurrency(value)
                          : value,
                        name === 'avgPrice'
                          ? 'Avg Price'
                          : 'Flights',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />

                    <Bar
                      dataKey="avgPrice"
                      fill="#d97706"
                      radius={[6, 6, 0, 0]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </ChartCard>

          </div>


          {/* =====================================================
              FLIGHT DATA TABLE
          ====================================================== */}
          <FlightTable
            flights={filteredFlights}
            defaultPageSize={10}
          />

        </>

      )}

    </div>
  );
};

export default Dashboard;