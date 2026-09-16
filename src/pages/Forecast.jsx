import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Plane,
  CalendarDays,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Brain,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

import {
  loadFlightData,
  formatCurrency,
} from '../services/flightDataService';

import { api } from '../services/api';

import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';


/* =========================================================
   AIRFARE FORECAST / HISTORICAL OUTLOOK

   IMPORTANT:
   This page uses actual observations from the CSV.

   The dataset contains:
   - days_left
   - price
   - Airfare_Index
   - booking_window

   It does NOT contain a timestamp showing when each
   observation was collected.

   Therefore this page shows a HISTORICAL BOOKING-WINDOW
   PATTERN and does not claim to predict future calendar prices.
========================================================= */


const Forecast = () => {
  /* =======================================================
     STATE
  ======================================================= */

  const [allFlights, setAllFlights] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [selectedSource, setSelectedSource] =
    useState('Delhi');

  const [selectedDestination, setSelectedDestination] =
    useState('Mumbai');

  const [aiForecast, setAiForecast] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);

  const [aiError, setAiError] = useState(null);


  /* =======================================================
     LOAD CSV DATA
  ======================================================= */

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await loadFlightData();

      setAllFlights(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading forecast data:', err);

      setError(
        'Unable to load airfare outlook data from the CSV dataset.'
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);


  /* =======================================================
     SOURCE OPTIONS
  ======================================================= */

  const sources = useMemo(() => {
    return Array.from(
      new Set(
        allFlights
          .map((flight) => flight.Source)
          .filter(Boolean)
      )
    ).sort();
  }, [allFlights]);


  /* =======================================================
     DESTINATION OPTIONS

     Only destinations available from the selected source
     are shown.
  ======================================================= */

  const destinations = useMemo(() => {
    const filteredDestinations = allFlights
      .filter(
        (flight) =>
          flight.Source === selectedSource &&
          flight.Destination
      )
      .map((flight) => flight.Destination);

    return Array.from(
      new Set(filteredDestinations)
    ).sort();
  }, [allFlights, selectedSource]);


  /* =======================================================
     VALIDATE SOURCE
  ======================================================= */

  useEffect(() => {
    if (!allFlights.length) return;

    const sourceExists = sources.includes(
      selectedSource
    );

    if (!sourceExists && sources.length > 0) {
      setSelectedSource(sources[0]);
    }
  }, [
    allFlights,
    sources,
    selectedSource,
  ]);


  /* =======================================================
     VALIDATE DESTINATION

     If selected source changes and the old destination
     is unavailable, automatically select a valid route.
  ======================================================= */

  useEffect(() => {
    if (!destinations.length) return;

    if (!destinations.includes(selectedDestination)) {
      setSelectedDestination(destinations[0]);
    }
  }, [
    destinations,
    selectedDestination,
  ]);


  /* =======================================================
     SELECTED ROUTE DATA
  ======================================================= */

  const routeFlights = useMemo(() => {
    if (!allFlights.length) return [];

    return allFlights.filter(
      (flight) =>
        flight.Source === selectedSource &&
        flight.Destination === selectedDestination
    );
  }, [
    allFlights,
    selectedSource,
    selectedDestination,
  ]);


  const representativeFlight =
    routeFlights[0] || null;


  const loadAIForecast = async (
    sampleFlight = representativeFlight
  ) => {
    if (!sampleFlight) {
      setAiForecast(null);
      setAiError('No flight data available for this route.');
      return;
    }

    try {
      setAiLoading(true);
      setAiError(null);

      const airline = sampleFlight.Airline || 'Vistara';
      const departureTime = sampleFlight.Departure_Time || 'Morning';
      const arrivalTime = sampleFlight.Arrival_Time || 'Evening';
      const flightClass = sampleFlight.Class || 'Economy';
      const daysLeft = Number(sampleFlight.Days_Left) || 15;
      const stopsNumeric = Number(sampleFlight.Total_Stops) || 0;
      const durationMinutes = Number(sampleFlight.Duration_Minutes) || 120;

      let bookingWindow = sampleFlight.Booking_Window || 'Normal';

      if (bookingWindow === 'Early booking') {
        bookingWindow = 'Early';
      }

      const result = await api.getForecast(
        selectedSource,
        selectedDestination,
        airline,
        departureTime,
        arrivalTime,
        flightClass,
        daysLeft,
        stopsNumeric,
        durationMinutes,
        bookingWindow
      );

      setAiForecast(result);
    } catch (err) {
      console.error('AI forecast error:', err);
      setAiForecast(null);
      setAiError(err?.message || 'Backend ML API unavailable');
    } finally {
      setAiLoading(false);
    }
  };


  useEffect(() => {
    if (!representativeFlight) {
      setAiForecast(null);
      return;
    }

    loadAIForecast(representativeFlight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [representativeFlight, selectedSource, selectedDestination]);


  /* =======================================================
     MEDIAN FUNCTION
  ======================================================= */

  const calculateMedian = (values) => {
    if (!values || values.length === 0) {
      return 0;
    }

    const sorted = [...values]
      .filter(Number.isFinite)
      .sort((a, b) => a - b);

    if (!sorted.length) {
      return 0;
    }

    const middle = Math.floor(
      sorted.length / 2
    );

    if (sorted.length % 2 === 0) {
      return (
        (sorted[middle - 1] +
          sorted[middle]) /
        2
      );
    }

    return sorted[middle];
  };


  /* =======================================================
     15-DAY HISTORICAL BOOKING-WINDOW DATA

     Days left:
     1 → 15

     Price:
     Median observed fare

     Index:
     Average observed Airfare Index
  ======================================================= */

  const forecastData = useMemo(() => {
    if (!routeFlights.length) {
      return [];
    }

    const groups = {};

    routeFlights.forEach((flight) => {
      const daysLeft = Number(
        flight.Days_Left
      );

      const price = Number(
        flight.Price
      );

      const airfareIndex = Number(
        flight.Airfare_Index
      );

      if (
        !Number.isFinite(daysLeft) ||
        !Number.isFinite(price)
      ) {
        return;
      }

      if (
        daysLeft < 1 ||
        daysLeft > 15
      ) {
        return;
      }

      if (!groups[daysLeft]) {
        groups[daysLeft] = {
          daysLeft,
          prices: [],
          indexes: [],
          count: 0,
        };
      }

      groups[daysLeft].prices.push(price);

      if (
        Number.isFinite(airfareIndex)
      ) {
        groups[daysLeft].indexes.push(
          airfareIndex
        );
      }

      groups[daysLeft].count += 1;
    });


    return Object.values(groups)
      .sort(
        (a, b) =>
          a.daysLeft - b.daysLeft
      )
      .map((group) => {
        const medianFare =
          calculateMedian(
            group.prices
          );

        const averageIndex =
          group.indexes.length > 0
            ? group.indexes.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) /
              group.indexes.length
            : 100;

        return {
          daysLeft: group.daysLeft,

          dayLabel:
            `${group.daysLeft} day${
              group.daysLeft === 1
                ? ''
                : 's'
            }`,

          price:
            Math.round(medianFare),

          index:
            Number(
              averageIndex.toFixed(2)
            ),

          flightCount:
            group.count,
        };
      });
  }, [routeFlights]);


  /* =======================================================
     ROUTE SUMMARY
  ======================================================= */

  const summary = useMemo(() => {
    if (!routeFlights.length) {
      return {
        averagePrice: 0,
        averageIndex: 100,
        totalFlights: 0,
        minPrice: 0,
        maxPrice: 0,
        trend: 'stable',
        trendPercentage: 0,
      };
    }

    const prices = routeFlights
      .map((flight) =>
        Number(flight.Price)
      )
      .filter(Number.isFinite);

    const indexes = routeFlights
      .map((flight) =>
        Number(flight.Airfare_Index)
      )
      .filter(Number.isFinite);


    const averagePrice =
      prices.length > 0
        ? prices.reduce(
            (sum, price) =>
              sum + price,
            0
          ) / prices.length
        : 0;


    const averageIndex =
      indexes.length > 0
        ? indexes.reduce(
            (sum, index) =>
              sum + index,
            0
          ) / indexes.length
        : 100;


    /* -------------------------------------------------------
       EARLY VS LAST-MINUTE
    ------------------------------------------------------- */

    const earlyFlights =
      routeFlights.filter(
        (flight) =>
          flight.Booking_Window ===
          'Early booking'
      );


    const normalFlights =
      routeFlights.filter(
        (flight) =>
          flight.Booking_Window ===
          'Normal'
      );


    const lastMinuteFlights =
      routeFlights.filter(
        (flight) =>
          flight.Booking_Window ===
          'Last minute'
      );


    const calculateAverage = (
      flights
    ) => {
      if (!flights.length) {
        return 0;
      }

      const total = flights.reduce(
        (sum, flight) =>
          sum +
          (Number(flight.Price) || 0),
        0
      );

      return total / flights.length;
    };


    const earlyAverage =
      calculateAverage(
        earlyFlights
      );

    const normalAverage =
      calculateAverage(
        normalFlights
      );

    const lastMinuteAverage =
      calculateAverage(
        lastMinuteFlights
      );


    let trend = 'stable';

    let trendPercentage = 0;


    if (
      earlyAverage > 0 &&
      lastMinuteAverage > 0
    ) {
      trendPercentage =
        ((lastMinuteAverage -
          earlyAverage) /
          earlyAverage) *
        100;


      if (trendPercentage > 3) {
        trend = 'increasing';
      } else if (
        trendPercentage < -3
      ) {
        trend = 'decreasing';
      }
    }


    return {
      averagePrice:
        Math.round(averagePrice),

      averageIndex:
        Number(
          averageIndex.toFixed(2)
        ),

      totalFlights:
        routeFlights.length,

      minPrice:
        prices.length > 0
          ? Math.min(...prices)
          : 0,

      maxPrice:
        prices.length > 0
          ? Math.max(...prices)
          : 0,

      trend,

      trendPercentage:
        Number(
          trendPercentage.toFixed(1)
        ),
    };
  }, [routeFlights]);


  /* =======================================================
     BOOKING WINDOW SUMMARY
  ======================================================= */

  const bookingSummary = useMemo(() => {
    const result = {
      early: {
        total: 0,
        count: 0,
      },

      normal: {
        total: 0,
        count: 0,
      },

      lastMinute: {
        total: 0,
        count: 0,
      },
    };


    routeFlights.forEach((flight) => {
      const price =
        Number(flight.Price) || 0;


      if (
        flight.Booking_Window ===
        'Early booking'
      ) {
        result.early.total += price;
        result.early.count += 1;
      }


      if (
        flight.Booking_Window ===
        'Normal'
      ) {
        result.normal.total += price;
        result.normal.count += 1;
      }


      if (
        flight.Booking_Window ===
        'Last minute'
      ) {
        result.lastMinute.total +=
          price;

        result.lastMinute.count += 1;
      }
    });


    const average = (item) => {
      if (!item.count) {
        return 0;
      }

      return Math.round(
        item.total / item.count
      );
    };


    return {
      early: average(
        result.early
      ),

      normal: average(
        result.normal
      ),

      lastMinute: average(
        result.lastMinute
      ),
    };
  }, [routeFlights]);


  /* =======================================================
     BOOKING INSIGHT
  ======================================================= */

  const bookingInsight = useMemo(() => {
    const {
      early,
      normal,
      lastMinute,
    } = bookingSummary;


    if (!early && !normal && !lastMinute) {
      return {
        title: 'Insufficient booking-window data',
        text: 'There is not enough historical booking-window data for this route.',
      };
    }


    const values = [
      {
        name: 'Early booking',
        price: early,
      },
      {
        name: 'Normal',
        price: normal,
      },
      {
        name: 'Last minute',
        price: lastMinute,
      },
    ].filter(
      (item) => item.price > 0
    );


    if (!values.length) {
      return {
        title: 'Historical pattern available',
        text: 'Booking-window prices are available for this route.',
      };
    }


    const lowest = [...values].sort(
      (a, b) =>
        a.price - b.price
    )[0];


    const highest = [...values].sort(
      (a, b) =>
        b.price - a.price
    )[0];


    return {
      title:
        `${lowest.name} has the lowest historical fare`,

      text:
        `${lowest.name} shows an average historical fare of ${formatCurrency(
          lowest.price
        )}, while ${highest.name} averages ${formatCurrency(
          highest.price
        )}. This describes observed historical behaviour, not a guaranteed future price.`,
    };
  }, [bookingSummary]);


  /* =======================================================
     TREND ICON
  ======================================================= */

  const TrendIcon = () => {
    if (
      summary.trend ===
      'increasing'
    ) {
      return (
        <TrendingUp className="w-5 h-5" />
      );
    }


    if (
      summary.trend ===
      'decreasing'
    ) {
      return (
        <TrendingDown className="w-5 h-5" />
      );
    }


    return (
      <Minus className="w-5 h-5" />
    );
  };


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <Loading
        message="Loading airfare outlook from CSV data..."
      />
    );
  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchData}
      />
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6 pb-12">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

          <div>

            <div className="flex items-center gap-2 mb-2">

              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Data-Driven Outlook
              </span>

              <span className="text-xs text-slate-400">
                Booking Window Analysis
              </span>

            </div>


            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Airfare Forecast
            </h1>


              <p className="text-sm text-slate-500 mt-1">
    Historical booking patterns + AI/ML fare prediction

            </p>

          </div>


          {/* ROUTE SELECTOR */}

          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">

            <select
              value={selectedSource}
              onChange={(event) =>
                setSelectedSource(
                  event.target.value
                )
              }
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >

              {sources.map(
                (source) => (
                  <option
                    key={source}
                    value={source}
                  >
                    {source}
                  </option>
                )
              )}

            </select>


            <span className="text-slate-400">
              →
            </span>


            <select
              value={selectedDestination}
              onChange={(event) =>
                setSelectedDestination(
                  event.target.value
                )
              }
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >

              {destinations.map(
                (destination) => (
                  <option
                    key={destination}
                    value={destination}
                  >
                    {destination}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

      </div>


      {/* =====================================================
          AI FORECAST
      ===================================================== */}

      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl p-5 sm:p-6 border border-indigo-200 shadow-sm">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">

          <div>

            <div className="flex items-center gap-2">

              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">

                <Brain className="w-5 h-5" />

              </div>

              <div>

                <h2 className="text-base sm:text-lg font-bold text-slate-900">

                  AI Fare Prediction

                </h2>

                <p className="text-xs text-slate-500">

                  Powered by the FastAPI ML backend

                </p>

              </div>

            </div>

          </div>


          <button

            type="button"

            onClick={loadAIForecast}

            disabled={aiLoading || !representativeFlight}

            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"

          >

            <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />

            {aiLoading ? 'Running ML...' : 'Refresh AI Forecast'}

          </button>

        </div>


        {aiLoading && (

          <div className="flex items-center justify-center py-10">

            <div className="text-center">

              <Brain className="w-8 h-8 text-indigo-500 mx-auto mb-3 animate-pulse" />

              <p className="text-sm font-semibold text-slate-700">

                AI model is analysing this route...

              </p>

              <p className="text-xs text-slate-400 mt-1">

                Sending flight features to FastAPI

              </p>

            </div>

          </div>

        )}


        {!aiLoading && aiError && (

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">

            <div className="flex items-start gap-3">

              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />

              <div>

                <p className="text-sm font-semibold text-amber-800">

                  Backend ML API unavailable

                </p>

                <p className="text-xs text-amber-700 mt-1">

                  {aiError}

                </p>

              </div>

            </div>

          </div>

        )}


        {!aiLoading && aiForecast && (

          <div className="space-y-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              <div className="bg-white rounded-2xl p-4 border border-indigo-100">

                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">

                  Predicted Fare

                </span>

                <div className="text-2xl font-bold font-mono text-indigo-600 mt-2">

                  {formatCurrency(aiForecast.predictedFare || 0)}

                </div>

                <span className="text-[11px] text-slate-400">

                  ML prediction

                </span>

              </div>


              <div className="bg-white rounded-2xl p-4 border border-indigo-100">

                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">

                  Airfare Index

                </span>

                <div className="text-2xl font-bold font-mono text-slate-900 mt-2">

                  {Number(aiForecast.airfareIndex || 100).toFixed(2)}

                </div>

                <span className="text-[11px] text-slate-400">

                  100 = benchmark

                </span>

              </div>


              <div className="bg-white rounded-2xl p-4 border border-indigo-100">

                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">

                  Fare Status

                </span>

                <div className="text-xl font-bold text-slate-900 mt-2">

                  {aiForecast.fareStatus || 'Normal'}

                </div>

                <span className="text-[11px] text-slate-400">

                  Relative to benchmark

                </span>

              </div>


              <div className="bg-white rounded-2xl p-4 border border-indigo-100">

                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">

                  Booking Advice

                </span>

                <div className="text-xl font-bold text-indigo-600 mt-2">

                  {aiForecast.bookingAdvice || 'Monitor'}

                </div>

                <span className="text-[11px] text-slate-400">

                  ML booking intelligence

                </span>

              </div>

            </div>


            <div className="bg-white rounded-2xl p-5 border border-indigo-100">

              <div className="flex items-start gap-3">

                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">

                  <Sparkles className="w-5 h-5" />

                </div>

                <div>

                  <h3 className="text-sm font-bold text-slate-900">

                    AI Recommendation

                  </h3>

                  <p className="text-sm text-indigo-700 font-semibold mt-1">

                    {aiForecast.aiRecommendation || 'Monitor fare movement before booking.'}

                  </p>

                </div>

              </div>

            </div>


            <div className="bg-white rounded-2xl p-5 border border-indigo-100">

              <div className="flex items-center gap-3">

                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">

                  <ShieldAlert className="w-5 h-5" />

                </div>

                <div>

                  <h3 className="text-sm font-bold text-slate-900">

                    Anomaly Detection

                  </h3>

                  <p className="text-xs text-slate-500 mt-1">

                    Current ML classification: {' '}

                    <strong className="text-slate-700">

                      {aiForecast.anomalyDetection || 'Normal'}

                    </strong>

                  </p>

                </div>

              </div>

            </div>


            {Array.isArray(aiForecast.forecastTable) && aiForecast.forecastTable.length > 0 && (

              <div className="bg-white rounded-2xl p-5 border border-indigo-100">

                <div className="mb-4">

                  <h3 className="text-sm font-bold text-slate-900">

                    ML Fare Forecast

                  </h3>

                  <p className="text-xs text-slate-500 mt-1">

                    Conditional fare estimates as travel date approaches

                  </p>

                </div>


                <div className="overflow-x-auto">

                  <table className="w-full text-sm">

                    <thead>

                      <tr className="border-b border-slate-100">

                        <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500">

                          Days Left

                        </th>

                        <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500">

                          Predicted Fare

                        </th>

                        <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500">

                          Airfare Index

                        </th>

                        <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500">

                          Booking Window

                        </th>

                        <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500">

                          Fare Change

                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {aiForecast.forecastTable.map((item, index) => (

                        <tr key={`${item.daysLeft || index}-${index}`} className="border-b border-slate-50">

                          <td className="py-3 px-3 font-semibold text-slate-700">

                            {item.daysLeft}

                          </td>

                          <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600">

                            {formatCurrency(item.predictedFare || 0)}

                          </td>

                          <td className="py-3 px-3 text-right font-mono text-slate-700">

                            {Number(item.index || 100).toFixed(2)}

                          </td>

                          <td className="py-3 px-3 text-right">

                            <span
                              className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                                item.bookingWindow === 'Early'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : item.bookingWindow === 'Normal'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : item.bookingWindow === 'Last minute'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >

                              {item.bookingWindow || '—'}

                            </span>

                          </td>

                          <td className="py-3 px-3 text-right font-mono text-slate-700">

                            {item.fareChange === null || item.fareChange === undefined || item.fareChange === ''
                              ? '—'
                              : `${Number(item.fareChange).toFixed(2)}%`}

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

            )}

          </div>

        )}


      </div>


      {/* =====================================================
          DATA EXPLANATION
      ===================================================== */}

      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4">

        <div className="flex items-start gap-3">

          <div className="p-1.5 rounded-xl bg-blue-100 text-blue-700 shrink-0">

            <Info className="w-5 h-5" />

          </div>


          <div>

            <h3 className="text-sm font-bold text-blue-900">
              How this outlook works
            </h3>


            <p className="text-xs text-blue-800 mt-1 leading-relaxed">

              This analysis uses actual historical observations
              from the CSV dataset. Fares are grouped according
              to the number of days left before travel and the
              median fare is calculated for each position.
              Therefore, the chart represents a historical
              booking-window pattern rather than a guaranteed
              future calendar prediction.

            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          METRIC CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">


        {/* AVERAGE PRICE */}

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">

          <div className="flex items-center justify-between">

            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Route Average Fare
            </span>


            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">

              <Plane className="w-4 h-4" />

            </div>

          </div>


          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">

            {formatCurrency(
              summary.averagePrice
            )}

          </div>


          <span className="text-[11px] text-slate-400">

            {summary.totalFlights.toLocaleString(
              'en-IN'
            )}{' '}
            historical observations

          </span>

        </div>


        {/* AIRFARE INDEX */}

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">

          <div className="flex items-center justify-between">

            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Airfare Index
            </span>


            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">

              <BarChart3 className="w-4 h-4" />

            </div>

          </div>


          <div className="text-2xl font-bold font-mono text-indigo-600 mt-2">

            {summary.averageIndex}

          </div>


          <span className="text-[11px] text-slate-400">
            Route historical average
          </span>

        </div>


        {/* BOOKING TREND */}

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">

          <div className="flex items-center justify-between">

            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Booking Trend
            </span>


            <div
              className={`p-2 rounded-xl ${
                summary.trend ===
                'increasing'
                  ? 'bg-rose-50 text-rose-600'
                  : summary.trend ===
                    'decreasing'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >

              <TrendIcon />

            </div>

          </div>


          <div
            className={`flex items-center gap-2 mt-2 text-xl font-bold ${
              summary.trend ===
              'increasing'
                ? 'text-rose-600'
                : summary.trend ===
                  'decreasing'
                ? 'text-emerald-600'
                : 'text-slate-600'
            }`}
          >

            <span className="capitalize">
              {summary.trend}
            </span>

          </div>


          <span className="text-[11px] text-slate-400">

            {summary.trendPercentage !== 0
              ? `${summary.trendPercentage > 0 ? '+' : ''}${summary.trendPercentage}% early vs last minute`
              : 'Early booking vs last minute'}

          </span>

        </div>


        {/* PRICE RANGE */}

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">

          <div className="flex items-center justify-between">

            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Historical Price Range
            </span>


            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">

              <CalendarDays className="w-4 h-4" />

            </div>

          </div>


          <div className="text-lg font-bold font-mono text-slate-900 mt-2">

            {formatCurrency(
              summary.minPrice
            )}

            {' – '}

            {formatCurrency(
              summary.maxPrice
            )}

          </div>


          <span className="text-[11px] text-slate-400">
            Observed on selected route
          </span>

        </div>

      </div>


      {/* =====================================================
          MAIN HISTORICAL PATTERN CHART
      ===================================================== */}

      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">

          <div>

            <div className="flex items-center gap-2">

              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                15-Day Fare Outlook
              </h2>


              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Historical Pattern
              </span>

            </div>


            <p className="text-xs text-slate-500 mt-1">

              Median fare observed at each days-left
              position for{' '}
              {selectedSource} → {selectedDestination}

            </p>

          </div>


          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">

            Days left: <strong>1–15</strong>

          </div>

        </div>


        <div className="h-80 w-full">

          {forecastData.length > 0 ? (

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <ComposedChart
                data={forecastData}
                margin={{
                  top: 10,
                  right: 15,
                  left: -10,
                  bottom: 5,
                }}
              >

                <defs>

                  <linearGradient
                    id="fareGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="5%"
                      stopColor="#6366f1"
                      stopOpacity={0.22}
                    />

                    <stop
                      offset="95%"
                      stopColor="#6366f1"
                      stopOpacity={0}
                    />

                  </linearGradient>

                </defs>


                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />


                <XAxis
                  dataKey="daysLeft"
                  tickLine={false}
                  axisLine={{
                    stroke: '#e2e8f0',
                  }}
                  tick={{
                    fill: '#64748b',
                    fontSize: 12,
                  }}
                  label={{
                    value:
                      'Days Left Before Travel',
                    position:
                      'insideBottom',
                    offset: -2,
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
                  content={({
                    active,
                    payload,
                  }) => {

                    if (
                      !active ||
                      !payload ||
                      !payload.length
                    ) {
                      return null;
                    }


                    const data =
                      payload[0].payload;


                    return (

                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs">

                        <div className="font-semibold text-slate-200 mb-2">

                          {data.daysLeft}{' '}

                          {data.daysLeft === 1
                            ? 'day'
                            : 'days'}{' '}

                          before travel

                        </div>


                        <div className="space-y-1">

                          <div className="flex justify-between gap-5">

                            <span className="text-slate-400">
                              Median Fare
                            </span>

                            <strong className="text-indigo-300">

                              {formatCurrency(
                                data.price
                              )}

                            </strong>

                          </div>


                          <div className="flex justify-between gap-5">

                            <span className="text-slate-400">
                              Airfare Index
                            </span>

                            <strong>
                              {data.index}
                            </strong>

                          </div>


                          <div className="flex justify-between gap-5">

                            <span className="text-slate-400">
                              Observations
                            </span>

                            <strong>

                              {data.flightCount.toLocaleString(
                                'en-IN'
                              )}

                            </strong>

                          </div>

                        </div>

                      </div>

                    );
                  }}
                />


                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="none"
                  fill="url(#fareGradient)"
                />


                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: '#4f46e5',
                    strokeWidth: 2,
                    stroke: '#ffffff',
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#3730a3',
                  }}
                />

              </ComposedChart>

            </ResponsiveContainer>

          ) : (

            <div className="h-full flex items-center justify-center">

              <div className="text-center">

                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />

                <p className="text-sm font-semibold text-slate-700">
                  Not enough route data
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Try another source or destination.
                </p>

              </div>

            </div>

          )}

        </div>


        <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500">

          <strong className="text-slate-700">
            Interpretation:
          </strong>{' '}

          A point represents the median fare historically
          observed when that many days were left before travel.
          The pattern should not be interpreted as a guaranteed
          future ticket price.

        </div>

      </div>


      {/* =====================================================
          BOOKING WINDOW COMPARISON
      ===================================================== */}

      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">

        <div className="mb-5">

          <div className="flex items-center gap-2">

            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Booking Window Price Comparison
            </h2>


            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Actual CSV Data
            </span>

          </div>


          <p className="text-xs text-slate-500 mt-1">
            Historical average fare by booking category
          </p>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


          {/* EARLY */}

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">

            <div className="text-xs font-semibold text-emerald-700">
              Early Booking
            </div>


            <div className="text-2xl font-bold font-mono text-slate-900 mt-2">

              {bookingSummary.early
                ? formatCurrency(
                    bookingSummary.early
                  )
                : 'No data'}

            </div>


            <p className="text-[11px] text-slate-500 mt-1">
              Historical average fare
            </p>

          </div>


          {/* NORMAL */}

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">

            <div className="text-xs font-semibold text-indigo-700">
              Normal
            </div>


            <div className="text-2xl font-bold font-mono text-slate-900 mt-2">

              {bookingSummary.normal
                ? formatCurrency(
                    bookingSummary.normal
                  )
                : 'No data'}

            </div>


            <p className="text-[11px] text-slate-500 mt-1">
              Historical average fare
            </p>

          </div>


          {/* LAST MINUTE */}

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">

            <div className="text-xs font-semibold text-rose-700">
              Last Minute
            </div>


            <div className="text-2xl font-bold font-mono text-slate-900 mt-2">

              {bookingSummary.lastMinute
                ? formatCurrency(
                    bookingSummary.lastMinute
                  )
                : 'No data'}

            </div>


            <p className="text-[11px] text-slate-500 mt-1">
              Historical average fare
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          DATA INSIGHT
      ===================================================== */}

      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">

        <div className="flex items-start gap-3">

          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">

            <BarChart3 className="w-5 h-5" />

          </div>


          <div>

            <h3 className="text-sm font-bold text-slate-900">
              Booking Window Insight
            </h3>


            <p className="text-sm font-semibold text-indigo-700 mt-1">
              {bookingInsight.title}
            </p>


            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {bookingInsight.text}
            </p>

          </div>

        </div>

      </div>


      {/* =====================================================
          ROUTE DATA SUMMARY
      ===================================================== */}

      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          <div>

            <div className="flex items-center gap-2">

              <span className="text-xs font-semibold text-slate-700">
                Selected Route
              </span>


              <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-indigo-600">
                {selectedSource} → {selectedDestination}
              </span>

            </div>


            <p className="text-[11px] text-slate-400 mt-1">

              {summary.totalFlights.toLocaleString(
                'en-IN'
              )}{' '}
              records available for this route

            </p>

          </div>


          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition"
          >

            <RefreshCw className="w-3.5 h-3.5" />

            Reload CSV Data

          </button>

        </div>

      </div>


      {/* =====================================================
          FOOTNOTE
      ===================================================== */}

      <div className="flex items-start gap-2 text-[11px] text-slate-400 px-1">

        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />

        <p>

          Source: SIH_AirIndex_Final_Index.csv.
          The outlook is calculated from observed historical
          fares using the Price, Days_Left, Airfare_Index and
          Booking_Window fields. No hard-coded fare values are
          used in the analysis.

        </p>

      </div>

    </div>
  );
};


export default Forecast;