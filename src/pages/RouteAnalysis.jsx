import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  loadFlightData,
  formatCurrency,
  MONTH_NAMES,
} from '../services/flightDataService';
import StatCard from '../components/StatCard';
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
} from 'recharts';
import {
  Route as RouteIcon,
  ArrowLeftRight,
  CreditCard,
  TrendingUp,
  Clock,
  Layers,
  Plane,
} from 'lucide-react';

const RouteAnalysis = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Available sources & destinations from CSV
  const sources = useMemo(() => {
    return Array.from(new Set(allFlights.map((f) => f.Source).filter(Boolean))).sort();
  }, [allFlights]);

  const destinations = useMemo(() => {
    return Array.from(new Set(allFlights.map((f) => f.Destination).filter(Boolean))).sort();
  }, [allFlights]);

  // Selected route state
  const initialSource = searchParams.get('source') || 'Bangalore';
  const initialDest = searchParams.get('destination') || 'New Delhi';

  const [selectedSource, setSelectedSource] = useState(initialSource);
  const [selectedDestination, setSelectedDestination] = useState(initialDest);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadFlightData();
      setAllFlights(data);

      // Verify if default selection exists, otherwise set to first available
      if (data.length > 0) {
        const hasPair = data.some(
          (f) => f.Source === initialSource && f.Destination === initialDest
        );
        if (!hasPair) {
          const first = data[0];
          setSelectedSource(first.Source);
          setSelectedDestination(first.Destination);
        }
      }
    } catch (err) {
      console.error('Error loading route data', err);
      setError('Unable to load route analysis data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSwap = () => {
    const temp = selectedSource;
    setSelectedSource(selectedDestination);
    setSelectedDestination(temp);
  };

  // Filter flights for chosen route
  const routeFlights = useMemo(() => {
    if (!allFlights || allFlights.length === 0) return [];
    return allFlights.filter(
      (f) =>
        f.Source.toLowerCase() === (selectedSource || '').toLowerCase() &&
        f.Destination.toLowerCase() === (selectedDestination || '').toLowerCase()
    );
  }, [allFlights, selectedSource, selectedDestination]);

  // Calculations from route flights
  const routeMetrics = useMemo(() => {
    if (routeFlights.length === 0) return null;

    const count = routeFlights.length;
    const totalPrice = routeFlights.reduce((sum, f) => sum + f.Price, 0);
    const totalIndex = routeFlights.reduce((sum, f) => sum + f.Airfare_Index, 0);
    const totalDuration = routeFlights.reduce((sum, f) => sum + f.Duration_Minutes, 0);
    const totalStops = routeFlights.reduce((sum, f) => sum + f.Total_Stops, 0);

    const avgPrice = Math.round(totalPrice / count);
    const avgIndex = Number((totalIndex / count).toFixed(2));
    const avgDurationMin = Math.round(totalDuration / count);
    const avgStops = Number((totalStops / count).toFixed(1));

    const hours = Math.floor(avgDurationMin / 60);
    const mins = avgDurationMin % 60;
    const durationFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return {
      count,
      avgPrice,
      avgIndex,
      durationFormatted,
      avgStops,
      minPrice: Math.min(...routeFlights.map((f) => f.Price)),
      maxPrice: Math.max(...routeFlights.map((f) => f.Price)),
    };
  }, [routeFlights]);

  // Monthly route progression for chart
  const monthlyRouteData = useMemo(() => {
    if (routeFlights.length === 0) return [];

    const groups = {};
    routeFlights.forEach((f) => {
      const m = f.Journey_Month;
      if (!groups[m]) {
        groups[m] = {
          monthNum: m,
          monthName: MONTH_NAMES[m] || `M${m}`,
          totalPrice: 0,
          totalIndex: 0,
          count: 0,
        };
      }
      groups[m].totalPrice += f.Price;
      groups[m].totalIndex += f.Airfare_Index;
      groups[m].count += 1;
    });

    return Object.values(groups)
      .sort((a, b) => a.monthNum - b.monthNum)
      .map((g) => ({
        month: g.monthName,
        monthNum: g.monthNum,
        avgPrice: Math.round(g.totalPrice / g.count),
        airfareIndex: Number((g.totalIndex / g.count).toFixed(1)),
        flights: g.count,
      }));
  }, [routeFlights]);

  // Airline breakdown on this route
  const airlinesOnRoute = useMemo(() => {
    if (routeFlights.length === 0) return [];
    const groups = {};
    routeFlights.forEach((f) => {
      const a = f.Airline;
      if (!groups[a]) {
        groups[a] = { airline: a, totalPrice: 0, count: 0 };
      }
      groups[a].totalPrice += f.Price;
      groups[a].count += 1;
    });
    return Object.values(groups)
      .map((g) => ({
        airline: g.airline,
        avgPrice: Math.round(g.totalPrice / g.count),
        flights: g.count,
      }))
      .sort((a, b) => a.avgPrice - b.avgPrice);
  }, [routeFlights]);

  if (loading) {
    return <Loading message="Loading route analysis data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Route Selector Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Route Analysis
              </span>
              <span className="text-xs text-slate-400">Step 7 Requirements</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {selectedSource} → {selectedDestination}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Corridor pricing metrics, flight duration, stops, and monthly index
            </p>
          </div>

          {/* Interactive Origin & Destination Pickers */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 self-start md:self-auto">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {sources.map((s) => (
                <option key={`src-${s}`} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleSwap}
              title="Swap"
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 transition"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {destinations.map((d) => (
                <option key={`dst-${d}`} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {routeFlights.length === 0 ? (
        <EmptyState
          title={`No flights found for ${selectedSource} → ${selectedDestination}`}
          description="Try selecting a different origin or destination pair from the available options."
        />
      ) : (
        <>
          {/* Key Route Statistics Cards (Step 7) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* 1. Average Price */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Average Price
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {formatCurrency(routeMetrics.avgPrice)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Mean ticket fare
              </span>
            </div>

            {/* 2. Airfare Index */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Airfare Index
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-600">
                {routeMetrics.avgIndex}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Route index average
              </span>
            </div>

            {/* 3. Number of Flights */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Number of Flights
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-600">
                {routeMetrics.count.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Departures in CSV
              </span>
            </div>

            {/* 4. Average Duration */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Average Duration
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {routeMetrics.durationFormatted}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Mean journey time
              </span>
            </div>

            {/* 5. Average Stops */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Average Stops
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {routeMetrics.avgStops} stops
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Routing layover index
              </span>
            </div>
          </div>

          {/* Route Price Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend Chart */}
            <ChartCard
              title="Route Price Trend by Month"
              subtitle={`Monthly average fare on ${selectedSource} → ${selectedDestination}`}
              badge="Time Series"
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyRouteData}
                    margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val) => [formatCurrency(val), 'Avg Fare']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgPrice"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Operating Airlines on this Route */}
            <ChartCard
              title="Airlines Flying this Route"
              subtitle={`Carrier pricing competition on ${selectedSource} → ${selectedDestination}`}
              badge="Airlines"
              badgeBg="bg-purple-50 text-purple-700 border-purple-200"
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={airlinesOnRoute}
                    margin={{ top: 10, right: 10, left: -10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="airline"
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val, name) => [
                        name === 'avgPrice' ? formatCurrency(val) : val,
                        name === 'avgPrice' ? 'Avg Fare' : 'Flights',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="avgPrice" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Route Flights Table */}
          <FlightTable flights={routeFlights} defaultPageSize={10} />
        </>
      )}
    </div>
  );
};

export default RouteAnalysis;
