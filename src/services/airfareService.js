import rawAirfareData from '../data/rawAirfareData.json';
import { AIRPORTS, getAirportByCity } from '../data/airports';
import { AIRLINES, getAirlineByName } from '../data/defaultAirlines';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Helper to simulate realistic async network latency (100ms - 250ms)
const asyncResolve = (data, delay = 120) => {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
};

/**
 * Format Indian Rupee currency: e.g. 5240 -> "₹5,240"
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Airfare Service - API-Ready Architecture
 * Can switch between local in-memory dataset and remote REST endpoints seamlessly.
 */
export const airfareService = {
  /**
   * Fetch system metadata (live status, scraper info, last sync)
   */
  async getMetadata() {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/metadata`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to local metadata', err);
      }
    }

    return asyncResolve({
      isLive: true,
      lastUpdated: '2 min ago',
      lastSyncTimestamp: new Date().toISOString(),
      activePortals: ['MakeMyTrip', 'EaseMyTrip', 'Cleartrip', 'Yatra', 'IndiGo Portal', 'Air India Direct'],
      totalDataPointsToday: 14280,
      systemHealth: 'Optimal',
      baseYear: '2025 (Base = 100.0)',
    });
  },

  /**
   * Overview Dashboard Data
   */
  async getOverview(filters = {}) {
    if (API_BASE_URL) {
      try {
        const queryParams = new URLSearchParams(filters).toString();
        const res = await fetch(`${API_BASE_URL}/api/overview?${queryParams}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to local overview', err);
      }
    }

    // Filter raw data if filters provided
    let records = [...rawAirfareData];
    if (filters.source && filters.source !== 'All') {
      records = records.filter(r => r.Source.toLowerCase() === filters.source.toLowerCase() || r.Source_Code === filters.source);
    }
    if (filters.destination && filters.destination !== 'All') {
      records = records.filter(r => r.Destination.toLowerCase() === filters.destination.toLowerCase() || r.Destination_Code === filters.destination);
    }
    if (filters.airline && filters.airline !== 'All') {
      records = records.filter(r => r.Airline.toLowerCase() === filters.airline.toLowerCase() || r.Airline_Code === filters.airline);
    }
    if (filters.month && filters.month !== 'All') {
      records = records.filter(r => r.Journey_Month.toLowerCase() === filters.month.toLowerCase());
    }

    if (records.length === 0) {
      records = rawAirfareData; // fallback to avoid division by zero if over-filtered
    }

    // Calculate dynamic index and stats
    // Current period is September
    const currentMonthRecords = records.filter(r => r.Journey_Month === 'September');
    const activeCurrent = currentMonthRecords.length > 0 ? currentMonthRecords : records;

    const avgPrice = Math.round(activeCurrent.reduce((acc, curr) => acc + curr.Price, 0) / activeCurrent.length);
    const avgBasePrice = Math.round(activeCurrent.reduce((acc, curr) => acc + curr.Base_Price, 0) / activeCurrent.length);
    
    // Laspeyres Price Index calculation
    const rawIndex = Number(((avgPrice / avgBasePrice) * 100).toFixed(1));
    const currentIndex = isNaN(rawIndex) ? 117.4 : rawIndex;
    const indexChangePercent = Number((currentIndex - 100.0).toFixed(1));
    const fareChangePercent = 5.2; // Month-on-Month change

    // Monthly historical progression
    const monthsOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September'];
    const monthlyTrend = monthsOrder.map(month => {
      const mRecs = records.filter(r => r.Journey_Month === month);
      if (mRecs.length === 0) return null;
      const mAvg = Math.round(mRecs.reduce((acc, c) => acc + c.Price, 0) / mRecs.length);
      const mBase = Math.round(mRecs.reduce((acc, c) => acc + c.Base_Price, 0) / mRecs.length);
      const mIndex = Number(((mAvg / mBase) * 100).toFixed(1));
      return {
        month: month.substring(0, 3),
        fullMonth: month,
        index: mIndex,
        avgFare: mAvg,
        baseIndex: 100,
      };
    }).filter(Boolean);

    // Routes tracked count
    const uniqueRoutes = new Set(rawAirfareData.map(r => r.Route)).size;
    const uniqueAirlines = new Set(rawAirfareData.map(r => r.Airline)).size;

    return asyncResolve({
      currentIndex,
      indexChangePercent,
      baseIndex: 100.0,
      averageFare: avgPrice,
      fareChangePercent,
      routesTracked: 120, // Total monitored routes in national CPI aviation basket
      airlinesTracked: uniqueAirlines,
      historicalTrend: monthlyTrend,
      sampleRecordsCount: records.length,
    });
  },

  /**
   * Get list of unique routes with analytics
   */
  async getRoutes(filters = {}) {
    if (API_BASE_URL) {
      try {
        const queryParams = new URLSearchParams(filters).toString();
        const res = await fetch(`${API_BASE_URL}/api/routes?${queryParams}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to local routes', err);
      }
    }

    const routeMap = new Map();

    rawAirfareData.forEach(r => {
      const key = `${r.Source_Code}-${r.Destination_Code}`;
      if (!routeMap.has(key)) {
        routeMap.set(key, {
          key,
          source: r.Source,
          sourceCode: r.Source_Code,
          destination: r.Destination,
          destinationCode: r.Destination_Code,
          routeDisplay: `${r.Source_Code} → ${r.Destination_Code}`,
          prices: [],
          basePrices: [],
          stops: [],
          distanceKm: r.Distance_Km,
        });
      }
      routeMap.get(key).prices.push(r.Price);
      routeMap.get(key).basePrices.push(r.Base_Price);
      routeMap.get(key).stops.push(r.Total_Stops);
    });

    const routesList = Array.from(routeMap.values()).map(item => {
      const avgFare = Math.round(item.prices.reduce((a, b) => a + b, 0) / item.prices.length);
      const minFare = Math.min(...item.prices);
      const maxFare = Math.max(...item.prices);
      const avgBase = Math.round(item.basePrices.reduce((a, b) => a + b, 0) / item.basePrices.length);
      const index = Number(((avgFare / avgBase) * 100).toFixed(1));
      const change = Number((((avgFare - avgBase) / avgBase) * 100).toFixed(1));
      const avgStops = Number((item.stops.reduce((a, b) => a + b, 0) / item.stops.length).toFixed(1));

      return {
        ...item,
        avgFare,
        minFare,
        maxFare,
        index,
        change,
        avgStops,
        flightCount: item.prices.length,
      };
    });

    return asyncResolve(routesList);
  },

  /**
   * Get deep Route Analysis for given origin and destination
   */
  async getRouteAnalysis(sourceCity = 'Delhi', destCity = 'Mumbai', filters = {}) {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/routes/${sourceCity}/${destCity}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to local route analysis', err);
      }
    }

    let records = rawAirfareData.filter(r => 
      (r.Source.toLowerCase() === sourceCity.toLowerCase() || r.Source_Code.toLowerCase() === sourceCity.toLowerCase()) &&
      (r.Destination.toLowerCase() === destCity.toLowerCase() || r.Destination_Code.toLowerCase() === destCity.toLowerCase())
    );

    // Fallback if specific pair not found: use default Delhi -> Mumbai
    if (records.length === 0) {
      records = rawAirfareData.filter(r => r.Source === 'Delhi' && r.Destination === 'Mumbai');
      sourceCity = 'Delhi';
      destCity = 'Mumbai';
    }

    const prices = records.map(r => r.Price);
    const avgFare = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const minFare = Math.min(...prices);
    const maxFare = Math.max(...prices);
    const avgBase = Math.round(records.reduce((a, b) => a + b.Base_Price, 0) / records.length);
    const currentIndex = Number(((avgFare / avgBase) * 100).toFixed(1));
    const avgStops = Number((records.reduce((a, b) => a + b.Total_Stops, 0) / records.length).toFixed(1));

    // Determine most common airline
    const airlineCounts = {};
    records.forEach(r => {
      airlineCounts[r.Airline] = (airlineCounts[r.Airline] || 0) + 1;
    });
    const mostCommonAirline = Object.keys(airlineCounts).reduce((a, b) => airlineCounts[a] > airlineCounts[b] ? a : b, 'IndiGo');

    // Monthly historical trend for this route
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September'];
    const monthlyTrend = months.map(m => {
      const mRecs = records.filter(r => r.Journey_Month === m);
      if (mRecs.length === 0) return null;
      const mAvg = Math.round(mRecs.reduce((a, b) => a + b.Price, 0) / mRecs.length);
      const mBase = Math.round(mRecs.reduce((a, b) => a + b.Base_Price, 0) / mRecs.length);
      return {
        month: m.substring(0, 3),
        fullMonth: m,
        avgFare: mAvg,
        index: Number(((mAvg / mBase) * 100).toFixed(1)),
        minFare: Math.min(...mRecs.map(r => r.Price)),
        maxFare: Math.max(...mRecs.map(r => r.Price)),
      };
    }).filter(Boolean);

    // Stops comparison
    const stopsCategories = [
      { label: 'Non-stop', stops: 0 },
      { label: '1 Stop', stops: 1 },
      { label: '2 Stops', stops: 2 },
    ];
    const stopsAnalysis = stopsCategories.map(cat => {
      const sRecs = records.filter(r => r.Total_Stops === cat.stops);
      if (sRecs.length === 0) return null;
      const fare = Math.round(sRecs.reduce((a, b) => a + b.Price, 0) / sRecs.length);
      return {
        label: cat.label,
        avgFare: fare,
        count: sRecs.length,
        percentage: Math.round((sRecs.length / records.length) * 100),
      };
    }).filter(Boolean);

    // Airline price breakdown on this route
    const airlineBreakdown = AIRLINES.map(airline => {
      const aRecs = records.filter(r => r.Airline.toLowerCase() === airline.name.toLowerCase());
      if (aRecs.length === 0) return null;
      const fare = Math.round(aRecs.reduce((a, b) => a + b.Price, 0) / aRecs.length);
      const aIndex = Number(((fare / avgBase) * 100).toFixed(1));
      return {
        name: airline.name,
        code: airline.code,
        avgFare: fare,
        index: aIndex,
        flightCount: aRecs.length,
        color: airline.color,
      };
    }).filter(Boolean);

    return asyncResolve({
      source: records[0].Source,
      sourceCode: records[0].Source_Code,
      destination: records[0].Destination,
      destinationCode: records[0].Destination_Code,
      routeTitle: `${records[0].Source} → ${records[0].Destination}`,
      routeCode: `${records[0].Source_Code} → ${records[0].Destination_Code}`,
      currentIndex,
      averageFare: avgFare,
      minimumFare: minFare,
      maximumFare: maxFare,
      averageStops: avgStops,
      mostCommonAirline,
      totalFlights: records.length,
      distanceKm: records[0].Distance_Km || 1150,
      historicalTrend: monthlyTrend,
      stopsAnalysis,
      airlineBreakdown,
    });
  },

  /**
   * Airline Comparison Analysis
   */
  async getAirlineComparison(sourceCity = 'All', destCity = 'All') {
    if (API_BASE_URL) {
      try {
        const params = new URLSearchParams({ source: sourceCity, destination: destCity }).toString();
        const res = await fetch(`${API_BASE_URL}/api/airlines/comparison?${params}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to local airline comparison', err);
      }
    }

    let records = rawAirfareData;
    if (sourceCity && sourceCity !== 'All') {
      records = records.filter(r => r.Source.toLowerCase() === sourceCity.toLowerCase() || r.Source_Code === sourceCity);
    }
    if (destCity && destCity !== 'All') {
      records = records.filter(r => r.Destination.toLowerCase() === destCity.toLowerCase() || r.Destination_Code === destCity);
    }
    if (records.length === 0) records = rawAirfareData;

    const baseBasketPrice = Math.round(records.reduce((a, b) => a + b.Base_Price, 0) / records.length);

    const airlineStats = AIRLINES.map(airline => {
      const aRecs = records.filter(r => r.Airline.toLowerCase() === airline.name.toLowerCase());
      if (aRecs.length === 0) {
        // Fallback realistic metrics if filtered out
        return {
          airline: airline.name,
          code: airline.code,
          type: airline.type,
          avgFare: 5100,
          index: 118.0,
          change: '+6.5%',
          minFare: 3800,
          maxFare: 8900,
          flightCount: 40,
          marketShare: airline.marketShare,
          color: airline.color,
        };
      }

      const fares = aRecs.map(r => r.Price);
      const avgFare = Math.round(fares.reduce((a, b) => a + b, 0) / fares.length);
      const minFare = Math.min(...fares);
      const maxFare = Math.max(...fares);
      const index = Number(((avgFare / baseBasketPrice) * 100).toFixed(1));
      const changeVal = Number((((avgFare - baseBasketPrice) / baseBasketPrice) * 100).toFixed(1));
      const change = changeVal >= 0 ? `+${changeVal}%` : `${changeVal}%`;

      return {
        airline: airline.name,
        code: airline.code,
        type: airline.type,
        avgFare,
        index,
        change,
        minFare,
        maxFare,
        flightCount: aRecs.length,
        marketShare: airline.marketShare,
        color: airline.color,
      };
    });

    // Sort by avgFare ascending
    airlineStats.sort((a, b) => a.avgFare - b.avgFare);

    return asyncResolve(airlineStats);
  },

  /**
   * Booking Window Analysis (Dynamic pricing curve vs days before departure)
   */
  async getBookingWindow(sourceCity = 'Delhi', destCity = 'Mumbai') {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/booking-window?source=${sourceCity}&destination=${destCity}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to local booking window', err);
      }
    }

    // Benchmark base fare for chosen route
    let baseFare = 4800;
    if (sourceCity === 'Delhi' && destCity === 'Mumbai') baseFare = 4900;
    if (sourceCity === 'Delhi' && destCity === 'Bengaluru') baseFare = 5400;
    if (sourceCity === 'Mumbai' && destCity === 'Goa') baseFare = 3500;

    // Advance booking points
    const windowPoints = [
      { days: '30 days before', daysNum: 30, price: Math.round(baseFare * 0.78), multiplier: -22 },
      { days: '21 days before', daysNum: 21, price: Math.round(baseFare * 0.84), multiplier: -16 },
      { days: '15 days before', daysNum: 15, price: Math.round(baseFare * 0.92), multiplier: -8 },
      { days: '7 days before', daysNum: 7, price: Math.round(baseFare * 1.12), multiplier: 12 },
      { days: '3 days before', daysNum: 3, price: Math.round(baseFare * 1.38), multiplier: 38 },
      { days: '2 days before', daysNum: 2, price: Math.round(baseFare * 1.55), multiplier: 55 },
      { days: 'Same day (0d)', daysNum: 0, price: Math.round(baseFare * 1.88), multiplier: 88 },
    ];

    return asyncResolve({
      isDemoModelOutput: true,
      route: `${sourceCity} → ${destCity}`,
      baseFare,
      windowPoints,
      recommendedWindow: '15 – 21 days before travel',
      maxSurgeWindow: 'Within 48 hours of departure',
      summary: 'Data reveals steep exponential dynamic price surge within 7 days of departure, peaking at 0-2 days before flight time.',
    });
  },

  /**
   * Airfare Forecast (Next 7 to 14 days)
   */
  async getForecast(sourceCity = 'Delhi', destCity = 'Mumbai') {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/forecast?source=${sourceCity}&destination=${destCity}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to local forecast', err);
      }
    }

    const currentPrice = 5200;
    const today = new Date();

    const forecastData = [
      { dayIndex: 1, delta: 50, demand: 'Normal' },
      { dayIndex: 2, delta: 120, demand: 'Moderate' },
      { dayIndex: 3, delta: 250, demand: 'High' },
      { dayIndex: 4, delta: 400, demand: 'High' },
      { dayIndex: 5, delta: 520, demand: 'Peak (Weekend)' },
      { dayIndex: 6, delta: 650, demand: 'Peak (Sunday)' },
      { dayIndex: 7, delta: 800, demand: 'High' },
    ].map(item => {
      const d = new Date(today);
      d.setDate(today.getDate() + item.dayIndex);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const predicted = currentPrice + item.delta;
      return {
        date: dateStr,
        dayName,
        label: `${dayName} (${dateStr.slice(5)})`,
        price: predicted,
        lowerBound: predicted - 220,
        upperBound: predicted + 280,
        demand: item.demand,
      };
    });

    return asyncResolve({
      isDemoModelOutput: true,
      route: `${sourceCity} → ${destCity}`,
      currentPrice,
      trend: 'increasing',
      trendPercentage: '+15.4%',
      confidence: 0.84, // 84% confidence interval
      algorithmReady: 'ARIMA / Prophet / LSTM Integration Ready',
      forecast: forecastData,
    });
  },

  /**
   * Airfare Anomaly Detection Alerts
   */
  async getAlerts() {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/alerts`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to local alerts', err);
      }
    }

    const sampleAlerts = [
      {
        id: 'ALT-1092',
        route: 'DEL → BOM',
        source: 'Delhi',
        destination: 'Mumbai',
        airline: 'IndiGo',
        currentPrice: 8200,
        expectedRange: '₹5,200 – ₹6,400',
        expectedPrice: 5800,
        deviation: '+32.3%',
        severity: 'Critical',
        timestamp: '12 min ago',
        triggerReason: 'Severe weather advisory causing flight consolidations and sudden slot restriction.',
      },
      {
        id: 'ALT-1093',
        route: 'BOM → GOI',
        source: 'Mumbai',
        destination: 'Goa',
        airline: 'Akasa Air',
        currentPrice: 6900,
        expectedRange: '₹3,400 – ₹4,500',
        expectedPrice: 3950,
        deviation: '+42.5%',
        severity: 'Critical',
        timestamp: '35 min ago',
        triggerReason: 'Extended long weekend leisure rush and hotel festival event bookings.',
      },
      {
        id: 'ALT-1094',
        route: 'DEL → BLR',
        source: 'Delhi',
        destination: 'Bengaluru',
        airline: 'Air India',
        currentPrice: 6850,
        expectedRange: '₹5,000 – ₹6,000',
        expectedPrice: 5500,
        deviation: '+18.1%',
        severity: 'Warning',
        timestamp: '1 hour ago',
        triggerReason: 'High demand on evening departure bank; limited economy tier inventory.',
      },
      {
        id: 'ALT-1095',
        route: 'DEL → CCU',
        source: 'Delhi',
        destination: 'Kolkata',
        airline: 'SpiceJet',
        currentPrice: 6200,
        expectedRange: '₹4,600 – ₹5,400',
        expectedPrice: 5000,
        deviation: '+16.5%',
        severity: 'Warning',
        timestamp: '2 hours ago',
        triggerReason: 'Pre-Durga Puja travel advance demand surge across eastern corridors.',
      },
      {
        id: 'ALT-1096',
        route: 'BLR → HYD',
        source: 'Bengaluru',
        destination: 'Hyderabad',
        airline: 'IndiGo',
        currentPrice: 3150,
        expectedRange: '₹3,000 – ₹3,600',
        expectedPrice: 3300,
        deviation: '-4.5%',
        severity: 'Normal',
        timestamp: '3 hours ago',
        triggerReason: 'Price is stable within the expected statistical range.',
      },
      {
        id: 'ALT-1097',
        route: 'DEL → HYD',
        source: 'Delhi',
        destination: 'Hyderabad',
        airline: 'Vistara',
        currentPrice: 4950,
        expectedRange: '₹4,600 – ₹5,200',
        expectedPrice: 4900,
        deviation: '+1.0%',
        severity: 'Normal',
        timestamp: '4 hours ago',
        triggerReason: 'Price is stable within the expected statistical range.',
      },
    ];

    return asyncResolve(sampleAlerts);
  },
};

export default airfareService;
