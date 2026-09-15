import React, { useState, useEffect, useMemo } from 'react';

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
  FileSpreadsheet,
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

          <div className="flex items-center gap-2 mb-1">

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">

              <FileSpreadsheet className="w-3.5 h-3.5" />

              <span>
                CSV Data Ingested (
                {allFlights.length.toLocaleString()}
                {' '}Records)
              </span>

            </span>

          </div>

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
          subtitle="Calculated from Airfare_Index column"
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