import React, { useState, useEffect, useMemo } from 'react';
import { loadFlightData, formatCurrency } from '../services/flightDataService';
import ChartCard from '../components/ChartCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  PlaneTakeoff,
  ArrowUpDown,
  TrendingUp,
  CreditCard,
  Clock,
  Layers,
  Award,
} from 'lucide-react';

const COLORS = [
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
  '#84cc16',
  '#6366f1',
];

const AirlineComparison = () => {
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sorting state: 'avgPrice' | 'avgIndex' | 'flightCount'
  const [sortBy, setSortBy] = useState('avgPrice');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Metric to show on comparison chart: 'avgPrice' | 'avgIndex' | 'flightCount'
  const [chartMetric, setChartMetric] = useState('avgPrice');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadFlightData();
      setAllFlights(data);
    } catch (err) {
      console.error('Error loading airline data', err);
      setError('Unable to load airline comparison data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate stats for each airline found in CSV
  const airlineStats = useMemo(() => {
    if (!allFlights || allFlights.length === 0) return [];

    const groups = {};
    allFlights.forEach((f) => {
      const a = f.Airline;
      if (!groups[a]) {
        groups[a] = {
          airline: a,
          totalPrice: 0,
          totalIndex: 0,
          totalDuration: 0,
          count: 0,
          minPrice: Infinity,
          maxPrice: -Infinity,
        };
      }
      groups[a].totalPrice += f.Price;
      groups[a].totalIndex += f.Airfare_Index;
      groups[a].totalDuration += f.Duration_Minutes;
      groups[a].count += 1;
      if (f.Price < groups[a].minPrice) groups[a].minPrice = f.Price;
      if (f.Price > groups[a].maxPrice) groups[a].maxPrice = f.Price;
    });

    return Object.values(groups).map((g) => {
      const avgPrice = Math.round(g.totalPrice / g.count);
      const avgIndex = Number((g.totalIndex / g.count).toFixed(2));
      const avgDurationMin = Math.round(g.totalDuration / g.count);
      const hours = Math.floor(avgDurationMin / 60);
      const mins = avgDurationMin % 60;
      const durationFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      return {
        airline: g.airline,
        avgPrice,
        avgIndex,
        flightCount: g.count,
        avgDurationMin,
        durationFormatted,
        minPrice: g.minPrice,
        maxPrice: g.maxPrice,
      };
    });
  }, [allFlights]);

  // Sorted list based on active sort criteria
  const sortedAirlines = useMemo(() => {
    return [...airlineStats].sort((a, b) => {
      let diff = 0;
      if (sortBy === 'avgPrice') diff = a.avgPrice - b.avgPrice;
      else if (sortBy === 'avgIndex') diff = a.avgIndex - b.avgIndex;
      else if (sortBy === 'flightCount') diff = a.flightCount - b.flightCount;

      return sortOrder === 'asc' ? diff : -diff;
    });
  }, [airlineStats, sortBy, sortOrder]);

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortOrder(newSortBy === 'avgPrice' ? 'asc' : 'desc');
    }
  };

  if (loading) {
    return <Loading message="Loading airline comparison data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                Step 8 Requirements
              </span>
              <span className="text-xs text-slate-400">
                {airlineStats.length} Carriers in CSV
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Airline Comparison
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Average Price, Number of Flights, Airfare Index, and Average Duration
            </p>
          </div>

          {/* Quick Sort Selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 self-start md:self-auto">
            <span className="text-xs font-semibold text-slate-500 pl-1">Sort by:</span>
            <button
              type="button"
              onClick={() => handleSortChange('avgPrice')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                sortBy === 'avgPrice'
                  ? 'bg-white text-indigo-600 shadow-2xs border border-indigo-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Average Price {sortBy === 'avgPrice' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              type="button"
              onClick={() => handleSortChange('avgIndex')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                sortBy === 'avgIndex'
                  ? 'bg-white text-indigo-600 shadow-2xs border border-indigo-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Airfare Index {sortBy === 'avgIndex' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              type="button"
              onClick={() => handleSortChange('flightCount')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                sortBy === 'flightCount'
                  ? 'bg-white text-indigo-600 shadow-2xs border border-indigo-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Flights {sortBy === 'flightCount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <ChartCard
        title={`Airline Comparison (${
          chartMetric === 'avgPrice'
            ? 'Average Price'
            : chartMetric === 'avgIndex'
            ? 'Average Airfare Index'
            : 'Number of Flights'
        })`}
        subtitle="Visualizing carrier performance from Flight_Data_Final_Index.csv"
        badge="Comparison Chart"
        badgeBg="bg-indigo-50 text-indigo-700 border-indigo-200"
        action={
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setChartMetric('avgPrice')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                chartMetric === 'avgPrice'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Avg Price
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('avgIndex')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                chartMetric === 'avgIndex'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Airfare Index
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('flightCount')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                chartMetric === 'flightCount'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Flights Count
            </button>
          </div>
        }
      >
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedAirlines}
              margin={{ top: 10, right: 10, left: -10, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="airline"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 10 }}
                interval={0}
                angle={-30}
                textAnchor="end"
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) =>
                  chartMetric === 'avgPrice'
                    ? `₹${(v / 1000).toFixed(0)}k`
                    : chartMetric === 'flightCount'
                    ? v.toLocaleString()
                    : v
                }
              />
              <Tooltip
                formatter={(val) => [
                  chartMetric === 'avgPrice'
                    ? formatCurrency(val)
                    : chartMetric === 'flightCount'
                    ? `${val} flights`
                    : val,
                  chartMetric === 'avgPrice'
                    ? 'Avg Price'
                    : chartMetric === 'flightCount'
                    ? 'Total Flights'
                    : 'Airfare Index',
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
                dataKey={chartMetric}
                radius={[6, 6, 0, 0]}
              >
                {sortedAirlines.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Detailed Airlines Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Airlines Performance Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click headers to sort by Average Price, Airfare Index, or Number of Flights
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {sortedAirlines.length} Carriers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Airline</th>
                <th
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 transition"
                  onClick={() => handleSortChange('avgPrice')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Average Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 transition"
                  onClick={() => handleSortChange('avgIndex')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Airfare Index</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 transition"
                  onClick={() => handleSortChange('flightCount')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Flights Count</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Average Duration</th>
                <th className="py-3.5 px-4 text-right">Fare Range (Min – Max)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sortedAirlines.map((item, idx) => (
                <tr key={item.airline} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-semibold text-slate-900">{item.airline}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.avgPrice)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-700">
                    {item.avgIndex}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                    {item.flightCount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600">
                    {item.durationFormatted}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                    {formatCurrency(item.minPrice)} – {formatCurrency(item.maxPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AirlineComparison;
