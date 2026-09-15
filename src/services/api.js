import {
  loadFlightData,
  filterFlights,
  calculateOverviewStats,
  getMonthlyIndexData,
  getAirlinePriceData,
  getRoutePriceData,
  getStopsPriceData,
  formatCurrency,
} from './flightDataService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Central API Service Layer (Step 11)
 * Decouples UI from the underlying data layer.
 * Currently uses PapaParse CSV records from src/data/Flight_Data_Final_Index.csv.
 * Ready for drop-in backend REST microservices when VITE_API_BASE_URL is specified.
 */
export const api = {
  /**
   * Get Overview metrics, summary cards, and monthly index data
   */
  async getOverview(filters = {}) {
    if (API_BASE_URL) {
      try {
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`${API_BASE_URL}/api/overview?${query}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to CSV service', err);
      }
    }

    const allFlights = await loadFlightData();
    const filtered = filterFlights(allFlights, filters);
    const stats = calculateOverviewStats(filtered);
    const monthlyIndex = getMonthlyIndexData(filtered);
    const airlinePrices = getAirlinePriceData(filtered);
    const routePrices = getRoutePriceData(filtered, 10);
    const stopsDistribution = getStopsPriceData(filtered);

    return {
      stats,
      monthlyIndex,
      airlinePrices,
      routePrices,
      stopsDistribution,
      filteredFlights: filtered,
    };
  },

  /**
   * Get unique routes list with average metrics
   */
  async getRoutes() {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/routes`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to CSV service', err);
      }
    }

    const allFlights = await loadFlightData();
    return getRoutePriceData(allFlights, 50);
  },

  /**
   * Get Route-level deep dive analysis
   */
  async getRouteAnalysis(source, destination) {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/routes/${source}/${destination}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to CSV service', err);
      }
    }

    const allFlights = await loadFlightData();
    const routeFlights = allFlights.filter(
      (f) =>
        f.Source.toLowerCase() === (source || '').toLowerCase() &&
        f.Destination.toLowerCase() === (destination || '').toLowerCase()
    );

    if (routeFlights.length === 0) {
      return null;
    }

    const totalFlights = routeFlights.length;
    const avgPrice = Math.round(routeFlights.reduce((a, b) => a + b.Price, 0) / totalFlights);
    const avgIndex = Number(
      (routeFlights.reduce((a, b) => a + b.Airfare_Index, 0) / totalFlights).toFixed(2)
    );
    const avgDuration = Math.round(
      routeFlights.reduce((a, b) => a + b.Duration_Minutes, 0) / totalFlights
    );
    const avgStops = Number(
      (routeFlights.reduce((a, b) => a + b.Total_Stops, 0) / totalFlights).toFixed(1)
    );
    const minPrice = Math.min(...routeFlights.map((f) => f.Price));
    const maxPrice = Math.max(...routeFlights.map((f) => f.Price));

    const monthlyTrend = getMonthlyIndexData(routeFlights);
    const airlinesOnRoute = getAirlinePriceData(routeFlights);

    return {
      source,
      destination,
      route: `${source} → ${destination}`,
      totalFlights,
      avgPrice,
      avgIndex,
      avgDuration,
      avgStops,
      minPrice,
      maxPrice,
      monthlyTrend,
      airlinesOnRoute,
      sampleFlights: routeFlights.slice(0, 50),
    };
  },

  /**
   * Get list of all airlines
   */
  async getAirlines() {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/airlines`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to CSV service', err);
      }
    }

    const allFlights = await loadFlightData();
    return Array.from(new Set(allFlights.map((f) => f.Airline))).sort();
  },

  /**
   * Get airline comparative performance data
   */
  async getAirlineComparison() {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/airlines/comparison`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to CSV service', err);
      }
    }

    const allFlights = await loadFlightData();
    return getAirlinePriceData(allFlights);
  },

  /**
   * Forecast (Step 9)
   * Future ML predictive integration ready.
   */
  async getForecast(source = 'Bangalore', destination = 'New Delhi') {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/forecast?source=${source}&destination=${destination}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to model structure', err);
      }
    }

    const allFlights = await loadFlightData();
    const routeFlights = allFlights.filter(
      (f) =>
        f.Source.toLowerCase() === source.toLowerCase() &&
        f.Destination.toLowerCase() === destination.toLowerCase()
    );

    const baseFare =
      routeFlights.length > 0
        ? Math.round(routeFlights.reduce((a, b) => a + b.Price, 0) / routeFlights.length)
        : 6500;

    const baseIndex =
      routeFlights.length > 0
        ? Number((routeFlights.reduce((a, b) => a + b.Airfare_Index, 0) / routeFlights.length).toFixed(1))
        : 100.0;

    // Projected 7-day model structure
    const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    const forecast = days.map((day, idx) => {
      const delta = Math.round(baseFare * (0.02 * (idx + 1) + (Math.sin(idx) * 0.01)));
      const price = baseFare + delta;
      return {
        day,
        dayIndex: idx + 1,
        price,
        lowerBound: price - 300,
        upperBound: price + 350,
        index: Number((baseIndex + (idx * 1.5)).toFixed(1)),
      };
    });

    return {
      isDemoModelOutput: true,
      route: `${source} → ${destination}`,
      currentPrice: baseFare,
      currentIndex: baseIndex,
      trend: 'Increasing (+8.5%)',
      confidence: 0.86,
      forecast,
      message: 'Forecast will be connected to the backend ML model.',
    };
  },

  /**
   * Alerts (Step 10)
   * Identifies real price anomalies from the CSV dataset.
   */
  async getAlerts() {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/alerts`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API error, falling back to CSV anomaly detector', err);
      }
    }

    const allFlights = await loadFlightData();

    // Find actual price spikes in CSV:
    // Flights where Price > 1.4 * Route_Month_Median or Airfare_Index > 130
    const anomalies = allFlights
      .filter((f) => f.Airfare_Index > 130 || f.Price > (f.Route_Month_Median * 1.35))
      .slice(0, 15)
      .map((f, idx) => {
        const deviationPercent = Number(
          (((f.Price - f.Route_Month_Median) / f.Route_Month_Median) * 100).toFixed(1)
        );
        const severity = deviationPercent > 35 ? 'Critical' : 'Warning';

        return {
          id: `ALT-${idx + 101}`,
          flightId: f.id,
          route: `${f.Source} → ${f.Destination}`,
          source: f.Source,
          destination: f.Destination,
          airline: f.Airline,
          currentPrice: f.Price,
          medianPrice: f.Route_Month_Median,
          airfareIndex: f.Airfare_Index,
          deviation: deviationPercent > 0 ? `+${deviationPercent}%` : `${deviationPercent}%`,
          severity,
          date: f.Date_of_Journey,
          stops: f.Total_Stops,
          reason:
            deviationPercent > 35
              ? `High surge fare exceeding median baseline by ${deviationPercent}% for this route period.`
              : `Elevated fare detected above regular route median pricing.`,
        };
      });

    // Also include a few normal benchmark alerts for balance
    const normalFlights = allFlights
      .filter((f) => f.Airfare_Index >= 95 && f.Airfare_Index <= 105)
      .slice(0, 5)
      .map((f, idx) => ({
        id: `NORM-${idx + 201}`,
        flightId: f.id,
        route: `${f.Source} → ${f.Destination}`,
        source: f.Source,
        destination: f.Destination,
        airline: f.Airline,
        currentPrice: f.Price,
        medianPrice: f.Route_Month_Median,
        airfareIndex: f.Airfare_Index,
        deviation: `${(f.Airfare_Index - 100).toFixed(1)}%`,
        severity: 'Normal',
        date: f.Date_of_Journey,
        stops: f.Total_Stops,
        reason: 'Price is stable within the expected statistical range.',
      }));

    return {
      isDemoAlerts: true,
      alerts: [...anomalies, ...normalFlights],
      totalMonitored: allFlights.length,
      notice: 'Demo alerts calculated from current CSV dataset anomalies.',
    };
  },
};

export default api;
