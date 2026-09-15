import Papa from 'papaparse';
import rawCsvContent from '../data/Flight_Data_Final_Index.csv?raw';

export const MONTH_NAMES = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
};

// Cached parsed flights in memory
let cachedFlights = null;

/**
 * Parses numeric total stops string/number
 * e.g., 'non-stop' -> 0, '1 stop' -> 1, 2 -> 2
 */
const parseStops = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const s = String(val).toLowerCase().trim();
  if (s.includes('non') || s === '0') return 0;
  const match = s.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

/**
 * Loads and parses src/data/Flight_Data_Final_Index.csv using PapaParse.
 * Converts numeric fields and handles empty/corrupted rows.
 */
export const loadFlightData = async () => {
  if (cachedFlights && cachedFlights.length > 0) {
    return cachedFlights;
  }

  return new Promise((resolve, reject) => {
    try {
      let csvString = rawCsvContent;

      if (!csvString || typeof csvString !== 'string') {
        // Fallback to fetch if ?raw wasn't available
        fetch('/Flight_Data_Final_Index.csv')
          .then((res) => {
            if (!res.ok) throw new Error('Failed to fetch CSV file');
            return res.text();
          })
          .then((text) => parseText(text, resolve, reject))
          .catch((err) => reject(err));
        return;
      }

      parseText(csvString, resolve, reject);
    } catch (err) {
      reject(err);
    }
  });
};

function parseText(csvText, resolve, reject) {
  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // We will manually and safely convert types
    complete: (results) => {
      try {
        if (!results.data || results.data.length === 0) {
          return resolve([]);
        }

        const cleaned = results.data
          .filter((row) => row.Airline && row.Source && row.Destination && row.Price)
          .map((row, idx) => {
            const price = parseFloat(row.Price) || 0;
            const airfareIndex = parseFloat(row.Airfare_Index) || 100.0;
            const durationMinutes = parseFloat(row.Duration_Minutes) || 0;
            const depHour = parseInt(row.Dep_Hour, 10) || 0;
            const arrivalHour = parseInt(row.Arrival_Hour, 10) || 0;
            const journeyMonth = parseInt(row.Journey_Month, 10) || 0;
            const routeMonthMedian = parseFloat(row.Route_Month_Median) || price;
            const totalStops = parseStops(row.Total_Stops);

            // Clean date format
            let dateClean = row.Date_of_Journey || '';
            if (dateClean.includes(' ')) {
              dateClean = dateClean.split(' ')[0];
            }

            return {
              id: `CSV-${idx + 1}`,
              Airline: String(row.Airline).trim(),
              Date_of_Journey: dateClean,
              Source: String(row.Source).trim(),
              Destination: String(row.Destination).trim(),
              Route: String(row.Route || `${row.Source} → ${row.Destination}`).trim(),
              Dep_Time: String(row.Dep_Time || '').trim(),
              Arrival_Time: String(row.Arrival_Time || '').trim(),
              Duration: String(row.Duration || '').trim(),
              Total_Stops: totalStops,
              Additional_Info: String(row.Additional_Info || 'No info').trim(),
              Price: price,
              Duration_Minutes: durationMinutes,
              Dep_Hour: depHour,
              Arrival_Hour: arrivalHour,
              Journey_Month: journeyMonth,
              Month_Name: MONTH_NAMES[journeyMonth] || `Month ${journeyMonth}`,
              Route_Month_Median: routeMonthMedian,
              Airfare_Index: Number(airfareIndex.toFixed(2)),
            };
          });

        cachedFlights = cleaned;
        resolve(cleaned);
      } catch (parseErr) {
        reject(parseErr);
      }
    },
    error: (error) => {
      reject(error);
    },
  });
}

/**
 * Generates unique dropdown filter options from the dataset
 */
export const getFilterOptions = (flights = []) => {
  const airlines = Array.from(new Set(flights.map((f) => f.Airline).filter(Boolean))).sort();
  const sources = Array.from(new Set(flights.map((f) => f.Source).filter(Boolean))).sort();
  const destinations = Array.from(new Set(flights.map((f) => f.Destination).filter(Boolean))).sort();
  
  const monthNums = Array.from(new Set(flights.map((f) => f.Journey_Month).filter(Boolean))).sort(
    (a, b) => a - b
  );
  const months = monthNums.map((m) => ({
    num: m,
    name: MONTH_NAMES[m] || `Month ${m}`,
  }));

  return { airlines, sources, destinations, months };
};

/**
 * Filter flights in-memory based on selected filter criteria
 */
export const filterFlights = (flights = [], filters = {}) => {
  if (!flights || flights.length === 0) return [];

  return flights.filter((flight) => {
    if (filters.airline && filters.airline !== 'All' && flight.Airline !== filters.airline) {
      return false;
    }
    if (filters.source && filters.source !== 'All' && flight.Source !== filters.source) {
      return false;
    }
    if (filters.destination && filters.destination !== 'All' && flight.Destination !== filters.destination) {
      return false;
    }
    if (filters.month && filters.month !== 'All') {
      const targetMonth = parseInt(filters.month, 10);
      if (flight.Journey_Month !== targetMonth) return false;
    }
    return true;
  });
};

/**
 * Calculate the 4 primary statistic cards for the dashboard
 */
export const calculateOverviewStats = (flights = []) => {
  if (!flights || flights.length === 0) {
    return {
      currentAirfareIndex: 0,
      averagePrice: 0,
      airlineCount: 0,
      routeCount: 0,
      totalFlights: 0,
    };
  }

  const totalFlights = flights.length;
  const totalPrice = flights.reduce((sum, f) => sum + f.Price, 0);
  const totalIndex = flights.reduce((sum, f) => sum + f.Airfare_Index, 0);

  const averagePrice = Math.round(totalPrice / totalFlights);
  const currentAirfareIndex = Number((totalIndex / totalFlights).toFixed(2));

  const uniqueAirlines = new Set(flights.map((f) => f.Airline)).size;
  const uniqueRoutes = new Set(flights.map((f) => `${f.Source} → ${f.Destination}`)).size;

  return {
    currentAirfareIndex,
    averagePrice,
    airlineCount: uniqueAirlines,
    routeCount: uniqueRoutes,
    totalFlights,
  };
};

/**
 * Aggregate Airfare Index by Month for line chart
 */
export const getMonthlyIndexData = (flights = []) => {
  if (!flights || flights.length === 0) return [];

  const groups = {};
  flights.forEach((f) => {
    const m = f.Journey_Month;
    if (!groups[m]) {
      groups[m] = {
        monthNum: m,
        monthName: MONTH_NAMES[m] || `M${m}`,
        totalIndex: 0,
        totalPrice: 0,
        count: 0,
      };
    }
    groups[m].totalIndex += f.Airfare_Index;
    groups[m].totalPrice += f.Price;
    groups[m].count += 1;
  });

  return Object.values(groups)
    .sort((a, b) => a.monthNum - b.monthNum)
    .map((g) => ({
      month: g.monthName,
      monthNum: g.monthNum,
      Airfare_Index: Number((g.totalIndex / g.count).toFixed(2)),
      Average_Price: Math.round(g.totalPrice / g.count),
      Flight_Count: g.count,
    }));
};

/**
 * Aggregate Average Price by Airline for bar chart
 */
export const getAirlinePriceData = (flights = []) => {
  if (!flights || flights.length === 0) return [];

  const groups = {};
  flights.forEach((f) => {
    const a = f.Airline;
    if (!groups[a]) {
      groups[a] = {
        airline: a,
        totalPrice: 0,
        totalIndex: 0,
        totalDuration: 0,
        count: 0,
      };
    }
    groups[a].totalPrice += f.Price;
    groups[a].totalIndex += f.Airfare_Index;
    groups[a].totalDuration += f.Duration_Minutes;
    groups[a].count += 1;
  });

  return Object.values(groups)
    .map((g) => ({
      airline: g.airline,
      avgPrice: Math.round(g.totalPrice / g.count),
      avgIndex: Number((g.totalIndex / g.count).toFixed(2)),
      avgDuration: Math.round(g.totalDuration / g.count),
      flightCount: g.count,
    }))
    .sort((a, b) => a.avgPrice - b.avgPrice);
};

/**
 * Aggregate Average Price by Route for route chart
 */
export const getRoutePriceData = (flights = [], limit = 12) => {
  if (!flights || flights.length === 0) return [];

  const groups = {};
  flights.forEach((f) => {
    const key = `${f.Source} → ${f.Destination}`;
    if (!groups[key]) {
      groups[key] = {
        route: key,
        source: f.Source,
        destination: f.Destination,
        totalPrice: 0,
        totalIndex: 0,
        totalDuration: 0,
        count: 0,
      };
    }
    groups[key].totalPrice += f.Price;
    groups[key].totalIndex += f.Airfare_Index;
    groups[key].totalDuration += f.Duration_Minutes;
    groups[key].count += 1;
  });

  return Object.values(groups)
    .map((g) => ({
      route: g.route,
      source: g.source,
      destination: g.destination,
      avgPrice: Math.round(g.totalPrice / g.count),
      avgIndex: Number((g.totalIndex / g.count).toFixed(2)),
      avgDuration: Math.round(g.totalDuration / g.count),
      flightCount: g.count,
    }))
    .sort((a, b) => b.flightCount - a.flightCount)
    .slice(0, limit);
};

/**
 * Aggregate Price by Total Stops for distribution chart
 */
export const getStopsPriceData = (flights = []) => {
  if (!flights || flights.length === 0) return [];

  const groups = {
    0: { stopsLabel: 'Non-stop (0)', totalPrice: 0, totalIndex: 0, count: 0 },
    1: { stopsLabel: '1 Stop', totalPrice: 0, totalIndex: 0, count: 0 },
    2: { stopsLabel: '2 Stops', totalPrice: 0, totalIndex: 0, count: 0 },
    3: { stopsLabel: '3+ Stops', totalPrice: 0, totalIndex: 0, count: 0 },
  };

  flights.forEach((f) => {
    const s = f.Total_Stops >= 3 ? 3 : f.Total_Stops;
    if (groups[s]) {
      groups[s].totalPrice += f.Price;
      groups[s].totalIndex += f.Airfare_Index;
      groups[s].count += 1;
    }
  });

  return Object.values(groups)
    .filter((g) => g.count > 0)
    .map((g) => ({
      stops: g.stopsLabel,
      avgPrice: Math.round(g.totalPrice / g.count),
      avgIndex: Number((g.totalIndex / g.count).toFixed(2)),
      flightCount: g.count,
    }));
};

/**
 * Format Indian Rupee currency: 5240 -> "₹5,240"
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};
