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

const API_BASE_URL = 'https://dutiful-vindicate-reveler.ngrok-free.dev';

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
   * Forecast (FastAPI ML backend)
   */
  async getForecast(
    source = 'Bangalore',
    destination = 'New Delhi',
    airline = 'Vistara',
    departureTime = 'Morning',
    arrivalTime = 'Evening',
    flightClass = 'Economy',
    daysLeft = 15,
    stopsNumeric = 1,
    durationMinutes = 120,
    bookingWindow = 'Early'
  ) {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'ngrok-skip-browser-warning': '1',
      },
      body: JSON.stringify({
        route: `${source} -> ${destination}`,
        airline,
        departure_time: departureTime,
        arrival_time: arrivalTime,
        flight_class: flightClass,
        days_left: Number(daysLeft),
        stops_numeric: Number(stopsNumeric),
        duration_minutes: Number(durationMinutes),
        booking_window: bookingWindow,
      }),
    });

    if (!response.ok) {
      let errorMessage = `FastAPI request failed: ${response.status}`;

      try {
        const errorBody = await response.json();
        errorMessage =
          errorBody?.detail ||
          errorBody?.message ||
          errorBody?.error ||
          errorMessage;
      } catch (parseError) {
        // Keep the HTTP status-based message when the response body is not JSON.
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    const predictedFare =
      Number(
        data?.predicted_fare ??
        data?.predictedFare ??
        data?.['Fare Prediction']?.['Predicted Fare'] ??
        data?.['Fare Prediction']?.['Predicted Price'] ??
        0
      );

    const benchmarkFare = Number(
      data?.['Fare Prediction']?.['Benchmark Fare'] ??
      data?.['Fare Prediction']?.['benchmark_fare'] ??
      0
    );

    let airfareIndex = Number(
      data?.airfare_index ??
      data?.airfareIndex ??
      data?.['Fare Prediction']?.['Airfare Index'] ??
      data?.['Fare Prediction']?.['airfare_index'] ??
      data?.['Fare Prediction']?.['Index'] ??
      NaN
    );

    if (!Number.isFinite(airfareIndex)) {
      airfareIndex =
        benchmarkFare > 0 && predictedFare > 0
          ? (predictedFare / benchmarkFare) * 100
          : 100;
    }

    const currentPrice = Number.isFinite(predictedFare) ? predictedFare : 0;
    const currentIndex = Number.isFinite(airfareIndex)
      ? Number(airfareIndex.toFixed(2))
      : 100;

    console.log('AirIndex AI mapped forecast response', {
      currentPrice,
      currentIndex,
      predictedFare,
      benchmarkFare,
      airfareIndex,
    });

    const fareStatus =
      data?.fare_status ??
      data?.fareStatus ??
      data?.['ML Analysis']?.['Fare Status'] ??
      '';

    const bookingAdvice =
      data?.booking_advice ??
      data?.bookingAdvice ??
      data?.['Booking Intelligence']?.['Booking Recommendation'] ??
      data?.['Booking Intelligence']?.['Booking Advice'] ??
      '';

    const aiRecommendation =
      data?.ai_recommendation ??
      data?.aiRecommendation ??
      data?.['AI Recommendation']?.['Recommendation'] ??
      '';

    const anomalyDetection =
      data?.anomaly_detection ??
      data?.anomalyDetection ??
      data?.['ML Analysis']?.['Anomaly Status'] ??
      '';

    const forecastSource =
      data?.['Fare Forecast']?.Forecast ??
      data?.forecast_table ??
      data?.forecastTable ??
      data?.forecast ??
      [];

    const forecastTable = Array.isArray(forecastSource)
      ? forecastSource.map((item) => {
          const predictedFareValue = Number(
            item?.['Predicted Fare'] ??
            item?.predicted_fare ??
            item?.predictedFare ??
            item?.price ??
            0
          );

          const forecastIndex =
            benchmarkFare > 0
              ? (predictedFareValue / benchmarkFare) * 100
              : 100;

          return {
            daysLeft:
              item?.['Days Left'] ??
              item?.days_left ??
              item?.daysLeft ??
              item?.dayIndex ??
              item?.day ??
              '',
            predictedFare: predictedFareValue,
            index: Number(forecastIndex.toFixed(2)),
            bookingWindow:
              item?.['Booking Window'] ??
              item?.booking_window ??
              item?.bookingWindow ??
              '',
            fareChange:
              item?.['Fare Change (%)'] ??
              item?.fare_change ??
              item?.fareChange ??
              null,
          };
        })
      : [];

    return {
      currentPrice,
      currentIndex,
      predictedFare,
      benchmarkFare,
      airfareIndex,
      fareStatus,
      bookingAdvice,
      aiRecommendation,
      anomalyDetection,
      forecastTable,
      rawResponse: data,
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
