import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  loadFlightData,
  formatCurrency,
} from '../services/flightDataService';

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
} from 'recharts';

import {
  ArrowLeftRight,
} from 'lucide-react';


const RouteAnalysis = () => {
  const [searchParams] = useSearchParams();

  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --------------------------------------------------
  // Available Sources
  // --------------------------------------------------
  const sources = useMemo(() => {
    return Array.from(
      new Set(
        allFlights
          .map((f) => f.Source)
          .filter(Boolean)
      )
    ).sort();
  }, [allFlights]);


  // --------------------------------------------------
  // Available Destinations
  // --------------------------------------------------
  const destinations = useMemo(() => {
    return Array.from(
      new Set(
        allFlights
          .map((f) => f.Destination)
          .filter(Boolean)
      )
    ).sort();
  }, [allFlights]);


  // --------------------------------------------------
  // Default Route
  // --------------------------------------------------
  const requestedSource =
    searchParams.get('source') || 'Delhi';

  const requestedDestination =
    searchParams.get('destination') || 'Mumbai';


  const [selectedSource, setSelectedSource] =
    useState(requestedSource);

  const [selectedDestination, setSelectedDestination] =
    useState(requestedDestination);


  // --------------------------------------------------
  // Load CSV Data
  // --------------------------------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await loadFlightData();

      setAllFlights(data);

      // Check whether requested route exists
      if (data.length > 0) {
        const hasRequestedRoute = data.some(
          (f) =>
            f.Source?.toLowerCase() ===
              requestedSource.toLowerCase() &&
            f.Destination?.toLowerCase() ===
              requestedDestination.toLowerCase()
        );

        // If route doesn't exist, use first available route
        if (!hasRequestedRoute) {
          const first = data[0];

          setSelectedSource(first.Source);
          setSelectedDestination(first.Destination);
        }
      }
    } catch (err) {
      console.error('Error loading route data:', err);
      setError('Unable to load route analysis data.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);


  // --------------------------------------------------
  // Swap Route
  // --------------------------------------------------
  const handleSwap = () => {
    const temp = selectedSource;

    setSelectedSource(selectedDestination);
    setSelectedDestination(temp);
  };


  // --------------------------------------------------
  // Flights for Selected Route
  // --------------------------------------------------
  const routeFlights = useMemo(() => {
    if (!allFlights || allFlights.length === 0) {
      return [];
    }

    return allFlights.filter(
      (f) =>
        f.Source?.toLowerCase() ===
          (selectedSource || '').toLowerCase() &&
        f.Destination?.toLowerCase() ===
          (selectedDestination || '').toLowerCase()
    );
  }, [
    allFlights,
    selectedSource,
    selectedDestination,
  ]);


  // --------------------------------------------------
  // Route Metrics
  // --------------------------------------------------
  const routeMetrics = useMemo(() => {
    if (routeFlights.length === 0) {
      return null;
    }

    const count = routeFlights.length;

    const totalPrice = routeFlights.reduce(
      (sum, f) => sum + (Number(f.Price) || 0),
      0
    );

    const totalIndex = routeFlights.reduce(
      (sum, f) => sum + (Number(f.Airfare_Index) || 0),
      0
    );

    const totalDuration = routeFlights.reduce(
      (sum, f) =>
        sum + (Number(f.Duration_Minutes) || 0),
      0
    );

    const totalStops = routeFlights.reduce(
      (sum, f) =>
        sum + (Number(f.Total_Stops) || 0),
      0
    );

    const avgPrice = Math.round(
      totalPrice / count
    );

    const avgIndex = Number(
      (totalIndex / count).toFixed(2)
    );

    const avgDurationMin = Math.round(
      totalDuration / count
    );

    const avgStops = Number(
      (totalStops / count).toFixed(1)
    );

    const hours = Math.floor(
      avgDurationMin / 60
    );

    const mins = avgDurationMin % 60;

    const durationFormatted =
      hours > 0
        ? `${hours}h ${mins}m`
        : `${mins}m`;

    return {
      count,
      avgPrice,
      avgIndex,
      durationFormatted,
      avgStops,
      minPrice: Math.min(
        ...routeFlights.map(
          (f) => Number(f.Price) || 0
        )
      ),
      maxPrice: Math.max(
        ...routeFlights.map(
          (f) => Number(f.Price) || 0
        )
      ),
    };
  }, [routeFlights]);


  // --------------------------------------------------
  // Booking Window Price Trend
  //
  // New dataset contains:
  // Early booking
  // Normal
  // Last minute
  //
  // Therefore we use Booking Window instead of
  // Journey_Month because the new CSV doesn't contain
  // a usable journey month/date field.
  // --------------------------------------------------
  const bookingWindowData = useMemo(() => {
    if (routeFlights.length === 0) {
      return [];
    }

    const groups = {};

    routeFlights.forEach((flight) => {
      const window =
        String(
          flight.Booking_Window || 'Unknown'
        ).trim();

      if (!groups[window]) {
        groups[window] = {
          bookingWindow: window,
          totalPrice: 0,
          totalIndex: 0,
          count: 0,
        };
      }

      groups[window].totalPrice +=
        Number(flight.Price) || 0;

      groups[window].totalIndex +=
        Number(flight.Airfare_Index) || 0;

      groups[window].count += 1;
    });


    // Logical order
    const order = {
      'Early booking': 1,
      Normal: 2,
      'Last minute': 3,
    };


    return Object.values(groups)
      .sort(
        (a, b) =>
          (order[a.bookingWindow] || 99) -
          (order[b.bookingWindow] || 99)
      )
      .map((group) => ({
        bookingWindow:
          group.bookingWindow,

        avgPrice: Math.round(
          group.totalPrice /
            group.count
        ),

        airfareIndex: Number(
          (
            group.totalIndex /
            group.count
          ).toFixed(2)
        ),

        flights: group.count,
      }));
  }, [routeFlights]);


  // --------------------------------------------------
  // Airlines Operating on Selected Route
  // --------------------------------------------------
  const airlinesOnRoute = useMemo(() => {
    if (routeFlights.length === 0) {
      return [];
    }

    const groups = {};

    routeFlights.forEach((flight) => {
      const airline = flight.Airline;

      if (!groups[airline]) {
        groups[airline] = {
          airline,
          totalPrice: 0,
          count: 0,
        };
      }

      groups[airline].totalPrice +=
        Number(flight.Price) || 0;

      groups[airline].count += 1;
    });


    return Object.values(groups)
      .map((group) => ({
        airline: group.airline,

        avgPrice: Math.round(
          group.totalPrice /
            group.count
        ),

        flights: group.count,
      }))
      .sort(
        (a, b) =>
          a.avgPrice - b.avgPrice
      );
  }, [routeFlights]);


  // --------------------------------------------------
  // Loading
  // --------------------------------------------------
  if (loading) {
    return (
      <Loading message="Loading route analysis data..." />
    );
  }


  // --------------------------------------------------
  // Error
  // --------------------------------------------------
  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchData}
      />
    );
  }


  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------
  return (
    <div className="space-y-6 pb-12">

      {/* ==============================================
          ROUTE HEADER
      ============================================== */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          <div>

            <div className="flex items-center gap-2 mb-1">

              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Route Analysis
              </span>

              <span className="text-xs text-slate-400">
                Route-level airfare intelligence
              </span>

            </div>


            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {selectedSource} → {selectedDestination}
            </h1>


            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Corridor pricing metrics, booking-window
              behavior, flight duration, stops and
              airline competition
            </p>

          </div>


          {/* Route Selectors */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 self-start md:self-auto">

            <select
              value={selectedSource}
              onChange={(e) =>
                setSelectedSource(e.target.value)
              }
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >

              {sources.map((source) => (
                <option
                  key={`src-${source}`}
                  value={source}
                >
                  {source}
                </option>
              ))}

            </select>


            <button
              type="button"
              onClick={handleSwap}
              title="Swap Source & Destination"
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 transition"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>


            <select
              value={selectedDestination}
              onChange={(e) =>
                setSelectedDestination(
                  e.target.value
                )
              }
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >

              {destinations.map((destination) => (
                <option
                  key={`dst-${destination}`}
                  value={destination}
                >
                  {destination}
                </option>
              ))}

            </select>

          </div>

        </div>

      </div>


      {/* ==============================================
          EMPTY STATE
      ============================================== */}
      {routeFlights.length === 0 ? (

        <EmptyState
          title={`No flights found for ${selectedSource} → ${selectedDestination}`}
          description="Try selecting a different origin or destination pair from the available options."
        />

      ) : (

        <>

          {/* ==========================================
              ROUTE STATISTICS
          ========================================== */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">


            {/* Average Price */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">

              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Average Price
              </span>

              <div className="text-2xl font-bold font-mono text-slate-900">
                {formatCurrency(
                  routeMetrics.avgPrice
                )}
              </div>

              <span className="text-[11px] text-slate-400 mt-1 block">
                Mean ticket fare
              </span>

            </div>


            {/* Airfare Index */}
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


            {/* Number of Flights */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">

              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Number of Flights
              </span>

              <div className="text-2xl font-bold font-mono text-emerald-600">
                {routeMetrics.count.toLocaleString()}
              </div>

              <span className="text-[11px] text-slate-400 mt-1 block">
                Records in CSV
              </span>

            </div>


            {/* Average Duration */}
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


            {/* Average Stops */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">

              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Average Stops
              </span>

              <div className="text-2xl font-bold font-mono text-slate-900">
                {routeMetrics.avgStops} stops
              </div>

              <span className="text-[11px] text-slate-400 mt-1 block">
                Average routing stops
              </span>

            </div>

          </div>


          {/* ==========================================
              CHARTS
          ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


            {/* ========================================
                BOOKING WINDOW CHART
            ======================================== */}
            <ChartCard
              title="Route Price by Booking Window"
              subtitle={`Average fare on ${selectedSource} → ${selectedDestination} by booking window`}
              badge="Booking Pattern"
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
                      left: -10,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />

                    <XAxis
                      dataKey="bookingWindow"
                      tickLine={false}
                      axisLine={{
                        stroke: '#e2e8f0',
                      }}
                      tick={{
                        fill: '#64748b',
                        fontSize: 11,
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
                        `₹${(
                          value / 1000
                        ).toFixed(0)}k`
                      }
                    />

                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value),
                        'Average Fare',
                      ]}
                      contentStyle={{
                        backgroundColor:
                          '#0f172a',
                        border: 'none',
                        borderRadius:
                          '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="avgPrice"
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


            {/* ========================================
                AIRLINES CHART
            ======================================== */}
            <ChartCard
              title="Airlines Flying this Route"
              subtitle={`Carrier pricing competition on ${selectedSource} → ${selectedDestination}`}
              badge="Airlines"
              badgeBg="bg-purple-50 text-purple-700 border-purple-200"
            >

              <div className="h-72 w-full">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={airlinesOnRoute}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -10,
                      bottom: 30,
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
                        fontSize: 11,
                      }}
                      interval={0}
                      angle={-20}
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
                        `₹${(
                          value / 1000
                        ).toFixed(0)}k`
                      }
                    />

                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(value),
                        'Average Fare',
                      ]}
                      contentStyle={{
                        backgroundColor:
                          '#0f172a',
                        border: 'none',
                        borderRadius:
                          '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />

                    <Bar
                      dataKey="avgPrice"
                      fill="#6366f1"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </ChartCard>

          </div>


          {/* ==========================================
              FLIGHT TABLE
          ========================================== */}
          <FlightTable
            flights={routeFlights}
            defaultPageSize={10}
          />

        </>

      )}

    </div>
  );
};


export default RouteAnalysis;