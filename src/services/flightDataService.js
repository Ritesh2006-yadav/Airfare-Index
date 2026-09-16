import Papa from 'papaparse';
import rawCsvContent from '../data/SIH_AirIndex_Final_Index.csv?raw';

/* =========================================================
   MONTH NAMES
========================================================= */

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

/* =========================================================
   CACHE
========================================================= */

let cachedFlights = null;

/* =========================================================
   HELPER: SAFE NUMBER
========================================================= */

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

/* =========================================================
   HELPER: PARSE STOPS
========================================================= */

/**
 * Converts different stop formats into a number.
 *
 * Examples:
 * "non-stop" -> 0
 * "Non Stop" -> 0
 * "1 stop"   -> 1
 * "2 stops"  -> 2
 * 0          -> 0
 * 1          -> 1
 */
const parseStops = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  // Already a number
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const text = String(value).toLowerCase().trim();

  // Non-stop
  if (
    text.includes('non-stop') ||
    text.includes('non stop') ||
    text.includes('nonstop') ||
    text === '0'
  ) {
    return 0;
  }

  // Extract first number
  const match = text.match(/\d+/);

  if (match) {
    return parseInt(match[0], 10);
  }

  return 0;
};

/* =========================================================
   HELPER: BOOKING WINDOW
========================================================= */

const normalizeBookingWindow = (value) => {
  if (!value) return 'Unknown';

  const text = String(value).trim().toLowerCase();

  if (text === 'early booking') {
    return 'Early booking';
  }

  if (text === 'normal') {
    return 'Normal';
  }

  if (text === 'last minute') {
    return 'Last minute';
  }

  return String(value).trim();
};

/* =========================================================
   LOAD FLIGHT DATA
========================================================= */

export const loadFlightData = async () => {
  // Return cached data if already loaded
  if (cachedFlights && cachedFlights.length > 0) {
    return cachedFlights;
  }

  return new Promise((resolve, reject) => {
    try {
      const csvString = rawCsvContent;

      // If raw import is unavailable, try public folder
      if (!csvString || typeof csvString !== 'string') {
        fetch('/SIH_AirIndex_Final_Index.csv')
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                'Failed to fetch SIH_AirIndex_Final_Index.csv'
              );
            }

            return response.text();
          })
          .then((text) => {
            parseText(text, resolve, reject);
          })
          .catch((error) => {
            reject(error);
          });

        return;
      }

      parseText(csvString, resolve, reject);
    } catch (error) {
      reject(error);
    }
  });
};

/* =========================================================
   PARSE CSV
========================================================= */

function parseText(csvText, resolve, reject) {
  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,

    complete: (results) => {
      try {
        if (!results.data || results.data.length === 0) {
          resolve([]);
          return;
        }

        const cleaned = results.data
          .filter((row) => {
            return (
              row.airline &&
              row.source_city &&
              row.destination_city &&
              row.price !== undefined &&
              row.price !== ''
            );
          })

          .map((row, index) => {
            /* ---------------------------------------------
               BASIC VALUES
            --------------------------------------------- */

            const price = toNumber(row.price, 0);

            const airfareIndex = toNumber(
              row.Airfare_Index,
              100
            );

            const durationMinutes = toNumber(
              row.duration_minutes,
              0
            );

            const daysLeft = toNumber(
              row.days_left,
              0
            );

            /* ---------------------------------------------
               STOPS

               IMPORTANT:
               New CSV has both:
               stops
               stops_numeric

               We prefer stops_numeric when available.
            --------------------------------------------- */

            const parsedStops = parseStops(row.stops);

            const numericStops =
              row.stops_numeric !== undefined &&
              row.stops_numeric !== ''
                ? toNumber(
                    row.stops_numeric,
                    parsedStops
                  )
                : parsedStops;

            const totalStops = numericStops;

            /* ---------------------------------------------
               BOOKING WINDOW
            --------------------------------------------- */

            const bookingWindow =
              normalizeBookingWindow(
                row.booking_window
              );

            /* ---------------------------------------------
               ROUTE CLASS MEDIAN
            --------------------------------------------- */

            const routeClassMedian = toNumber(
              row.Route_Class_Median,
              price
            );

            /* ---------------------------------------------
               JOURNEY MONTH

               Current SIH CSV does not contain a proper
               Date_of_Journey column.

               Therefore we keep month as 0 / Unknown
               instead of inventing a month.
            --------------------------------------------- */

            const journeyMonth = 0;

            /* ---------------------------------------------
               RETURN NORMALIZED FLIGHT OBJECT
            --------------------------------------------- */

            return {
              id: `CSV-${index + 1}`,

              /* Airline */
              Airline: String(
                row.airline || ''
              ).trim(),

              /* Flight number/name */
              Flight: String(
                row.flight || ''
              ).trim(),

              /* Journey date is not available in current CSV */
              Date_of_Journey: '',

              /* Source */
              Source: String(
                row.source_city || ''
              ).trim(),

              /* Destination */
              Destination: String(
                row.destination_city || ''
              ).trim(),

              /* Route */
              Route: String(
                row.route ||
                  `${row.source_city} → ${row.destination_city}`
              ).trim(),

              /* Departure */
              Dep_Time: String(
                row.departure_time || ''
              ).trim(),

              /* Arrival */
              Arrival_Time: String(
                row.arrival_time || ''
              ).trim(),

              /* Duration */
              Duration: String(
                row.duration || ''
              ).trim(),

              /* -----------------------------------------
                 STOPS
              ----------------------------------------- */

              Total_Stops: totalStops,

              Stops_Numeric: numericStops,

              /* -----------------------------------------
                 CLASS
              ----------------------------------------- */

              Additional_Info: String(
                row.class || 'Economy'
              ).trim(),

              Class: String(
                row.class || 'Economy'
              ).trim(),

              /* -----------------------------------------
                 PRICE
              ----------------------------------------- */

              Price: price,

              /* -----------------------------------------
                 DURATION
              ----------------------------------------- */

              Duration_Minutes: durationMinutes,

              /* -----------------------------------------
                 TIME FIELDS

                 Current CSV contains categorical time
                 labels, not exact hours.
              ----------------------------------------- */

              Dep_Hour: 0,

              Arrival_Hour: 0,

              /* -----------------------------------------
                 MONTH
              ----------------------------------------- */

              Journey_Month: journeyMonth,

              Month_Name:
                MONTH_NAMES[journeyMonth] ||
                'Unknown',

              /* -----------------------------------------
                 ROUTE MEDIAN
              ----------------------------------------- */

              Route_Month_Median:
                routeClassMedian,

              /* -----------------------------------------
                 AIRFARE INDEX
              ----------------------------------------- */

              Airfare_Index: Number(
                airfareIndex.toFixed(2)
              ),

              /* -----------------------------------------
                 BOOKING WINDOW
              ----------------------------------------- */

              Days_Left: daysLeft,

              Booking_Window: bookingWindow,
            };
          });

        cachedFlights = cleaned;

        resolve(cleaned);
      } catch (error) {
        reject(error);
      }
    },

    error: (error) => {
      reject(error);
    },
  });
}

/* =========================================================
   FILTER OPTIONS
========================================================= */

export const getFilterOptions = (
  flights = []
) => {
  if (!flights || flights.length === 0) {
    return {
      airlines: [],
      sources: [],
      destinations: [],
      months: [],
      bookingWindows: [],
    };
  }

  /* ---------------------------------------------
     AIRLINES
  --------------------------------------------- */

  const airlines = Array.from(
    new Set(
      flights
        .map((flight) => flight.Airline)
        .filter(Boolean)
    )
  ).sort();

  /* ---------------------------------------------
     SOURCES
  --------------------------------------------- */

  const sources = Array.from(
    new Set(
      flights
        .map((flight) => flight.Source)
        .filter(Boolean)
    )
  ).sort();

  /* ---------------------------------------------
     DESTINATIONS
  --------------------------------------------- */

  const destinations = Array.from(
    new Set(
      flights
        .map((flight) => flight.Destination)
        .filter(Boolean)
    )
  ).sort();

  /* ---------------------------------------------
     BOOKING WINDOWS
  --------------------------------------------- */

  const bookingOrder = {
    'Early booking': 1,
    Normal: 2,
    'Last minute': 3,
  };

  const bookingWindows = Array.from(
    new Set(
      flights
        .map((flight) => flight.Booking_Window)
        .filter(Boolean)
    )
  ).sort((a, b) => {
    return (
      (bookingOrder[a] || 99) -
      (bookingOrder[b] || 99)
    );
  });

  /* ---------------------------------------------
     MONTHS

     Current dataset does not contain journey date.
     So only add months if valid month data exists.
  --------------------------------------------- */

  const monthNumbers = Array.from(
    new Set(
      flights
        .map((flight) => flight.Journey_Month)
        .filter(
          (month) =>
            Number.isInteger(month) &&
            month >= 1 &&
            month <= 12
        )
    )
  ).sort((a, b) => a - b);

  const months = monthNumbers.map((num) => ({
    num,
    name: MONTH_NAMES[num],
  }));

  return {
    airlines,
    sources,
    destinations,
    months,
    bookingWindows,
  };
};

/* =========================================================
   FILTER FLIGHTS
========================================================= */

export const filterFlights = (
  flights = [],
  filters = {}
) => {
  if (!flights || flights.length === 0) {
    return [];
  }

  return flights.filter((flight) => {
    /* ---------------------------------------------
       AIRLINE
    --------------------------------------------- */

    if (
      filters.airline &&
      filters.airline !== 'All' &&
      flight.Airline !== filters.airline
    ) {
      return false;
    }

    /* ---------------------------------------------
       SOURCE
    --------------------------------------------- */

    if (
      filters.source &&
      filters.source !== 'All' &&
      flight.Source !== filters.source
    ) {
      return false;
    }

    /* ---------------------------------------------
       DESTINATION
    --------------------------------------------- */

    if (
      filters.destination &&
      filters.destination !== 'All' &&
      flight.Destination !== filters.destination
    ) {
      return false;
    }

    /* ---------------------------------------------
       BOOKING WINDOW
    --------------------------------------------- */

    if (
      filters.bookingWindow &&
      filters.bookingWindow !== 'All' &&
      flight.Booking_Window !==
        filters.bookingWindow
    ) {
      return false;
    }

    /* ---------------------------------------------
       MONTH

       Kept for compatibility with existing dashboard.
    --------------------------------------------- */

    if (
      filters.month &&
      filters.month !== 'All' &&
      Number(flight.Journey_Month) !==
        Number(filters.month)
    ) {
      return false;
    }

    return true;
  });
};

/* =========================================================
   DASHBOARD OVERVIEW STATS
========================================================= */

export const calculateOverviewStats = (
  flights = []
) => {
  if (!flights || flights.length === 0) {
    return {
      currentAirfareIndex: 0,
      averagePrice: 0,
      airlineCount: 0,
      routeCount: 0,
      totalFlights: 0,
    };
  }

  /* ---------------------------------------------
     TOTAL FLIGHTS
  --------------------------------------------- */

  const totalFlights = flights.length;

  /* ---------------------------------------------
     TOTAL PRICE
  --------------------------------------------- */

  const totalPrice = flights.reduce(
    (sum, flight) =>
      sum + toNumber(flight.Price),
    0
  );

  /* ---------------------------------------------
     TOTAL INDEX
  --------------------------------------------- */

  const totalIndex = flights.reduce(
    (sum, flight) =>
      sum + toNumber(flight.Airfare_Index),
    0
  );

  /* ---------------------------------------------
     AVERAGE PRICE
  --------------------------------------------- */

  const averagePrice = Math.round(
    totalPrice / totalFlights
  );

  /* ---------------------------------------------
     CURRENT AIRFARE INDEX
  --------------------------------------------- */

  const currentAirfareIndex = Number(
    (
      totalIndex / totalFlights
    ).toFixed(2)
  );

  /* ---------------------------------------------
     UNIQUE AIRLINES
  --------------------------------------------- */

  const uniqueAirlines = new Set(
    flights
      .map((flight) => flight.Airline)
      .filter(Boolean)
  ).size;

  /* ---------------------------------------------
     UNIQUE ROUTES
  --------------------------------------------- */

  const uniqueRoutes = new Set(
    flights
      .map(
        (flight) =>
          `${flight.Source} → ${flight.Destination}`
      )
      .filter(Boolean)
  ).size;

  return {
    currentAirfareIndex,
    averagePrice,
    airlineCount: uniqueAirlines,
    routeCount: uniqueRoutes,
    totalFlights,
  };
};

/* =========================================================
   AIRFARE INDEX BY BOOKING WINDOW
========================================================= */

export const getMonthlyIndexData = (
  flights = []
) => {
  if (!flights || flights.length === 0) {
    return [];
  }

  const groups = {};

  flights.forEach((flight) => {
    const bookingWindow =
      flight.Booking_Window || 'Unknown';

    if (!groups[bookingWindow]) {
      groups[bookingWindow] = {
        bookingWindow,
        totalIndex: 0,
        totalPrice: 0,
        count: 0,
      };
    }

    groups[bookingWindow].totalIndex +=
      toNumber(flight.Airfare_Index);

    groups[bookingWindow].totalPrice +=
      toNumber(flight.Price);

    groups[bookingWindow].count += 1;
  });

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
      month: group.bookingWindow,

      monthNum:
        order[group.bookingWindow] || 99,

      Airfare_Index: Number(
        (
          group.totalIndex /
          group.count
        ).toFixed(2)
      ),

      Average_Price: Math.round(
        group.totalPrice /
          group.count
      ),

      Flight_Count: group.count,
    }));
};

/* =========================================================
   AVERAGE PRICE BY AIRLINE
========================================================= */

export const getAirlinePriceData = (
  flights = []
) => {
  if (!flights || flights.length === 0) {
    return [];
  }

  const groups = {};

  flights.forEach((flight) => {
    const airline = flight.Airline;

    if (!airline) return;

    if (!groups[airline]) {
      groups[airline] = {
        airline,
        totalPrice: 0,
        totalIndex: 0,
        totalDuration: 0,
        count: 0,
      };
    }

    groups[airline].totalPrice +=
      toNumber(flight.Price);

    groups[airline].totalIndex +=
      toNumber(flight.Airfare_Index);

    groups[airline].totalDuration +=
      toNumber(flight.Duration_Minutes);

    groups[airline].count += 1;
  });

  return Object.values(groups)
    .map((group) => ({
      airline: group.airline,

      avgPrice: Math.round(
        group.totalPrice /
          group.count
      ),

      avgIndex: Number(
        (
          group.totalIndex /
          group.count
        ).toFixed(2)
      ),

      avgDuration: Math.round(
        group.totalDuration /
          group.count
      ),

      flightCount: group.count,
    }))
    .sort(
      (a, b) =>
        a.avgPrice - b.avgPrice
    );
};

/* =========================================================
   AVERAGE PRICE BY ROUTE
========================================================= */

export const getRoutePriceData = (
  flights = [],
  limit = 12
) => {
  if (!flights || flights.length === 0) {
    return [];
  }

  const groups = {};

  flights.forEach((flight) => {
    if (!flight.Source || !flight.Destination) {
      return;
    }

    const key =
      `${flight.Source} → ${flight.Destination}`;

    if (!groups[key]) {
      groups[key] = {
        route: key,
        source: flight.Source,
        destination: flight.Destination,
        totalPrice: 0,
        totalIndex: 0,
        totalDuration: 0,
        count: 0,
      };
    }

    groups[key].totalPrice +=
      toNumber(flight.Price);

    groups[key].totalIndex +=
      toNumber(flight.Airfare_Index);

    groups[key].totalDuration +=
      toNumber(flight.Duration_Minutes);

    groups[key].count += 1;
  });

  return Object.values(groups)
    .map((group) => ({
      route: group.route,

      source: group.source,

      destination: group.destination,

      avgPrice: Math.round(
        group.totalPrice /
          group.count
      ),

      avgIndex: Number(
        (
          group.totalIndex /
          group.count
        ).toFixed(2)
      ),

      avgDuration: Math.round(
        group.totalDuration /
          group.count
      ),

      flightCount: group.count,
    }))
    .sort(
      (a, b) =>
        b.flightCount -
        a.flightCount
    )
    .slice(0, limit);
};

/* =========================================================
   PRICE BY NUMBER OF STOPS
========================================================= */

export const getStopsPriceData = (
  flights = []
) => {
  if (!flights || flights.length === 0) {
    return [];
  }

  const groups = {
    0: {
      stopsLabel: 'Non-stop (0)',
      totalPrice: 0,
      totalIndex: 0,
      count: 0,
    },

    1: {
      stopsLabel: '1 Stop',
      totalPrice: 0,
      totalIndex: 0,
      count: 0,
    },

    2: {
      stopsLabel: '2 Stops',
      totalPrice: 0,
      totalIndex: 0,
      count: 0,
    },

    3: {
      stopsLabel: '3+ Stops',
      totalPrice: 0,
      totalIndex: 0,
      count: 0,
    },
  };

  flights.forEach((flight) => {
    /* ---------------------------------------------
       IMPORTANT FIX

       Use Stops_Numeric first.
       Fall back to Total_Stops.
    --------------------------------------------- */

    const rawStops =
      flight.Stops_Numeric !== undefined &&
      flight.Stops_Numeric !== null
        ? flight.Stops_Numeric
        : flight.Total_Stops;

    let stops = parseStops(rawStops);

    /* Anything 3 or above goes into 3+ */
    if (stops >= 3) {
      stops = 3;
    }

    if (!groups[stops]) {
      return;
    }

    groups[stops].totalPrice +=
      toNumber(flight.Price);

    groups[stops].totalIndex +=
      toNumber(flight.Airfare_Index);

    groups[stops].count += 1;
  });

  return Object.values(groups)
    .filter(
      (group) => group.count > 0
    )
    .map((group) => ({
      stops: group.stopsLabel,

      avgPrice: Math.round(
        group.totalPrice /
          group.count
      ),

      avgIndex: Number(
        (
          group.totalIndex /
          group.count
        ).toFixed(2)
      ),

      flightCount: group.count,
    }));
};

/* =========================================================
   ROUTE-SPECIFIC SUMMARY
========================================================= */

export const getRouteSummary = (
  flights = [],
  source,
  destination
) => {
  if (!flights || flights.length === 0) {
    return {
      averagePrice: 0,
      airfareIndex: 0,
      flightCount: 0,
      averageDuration: 0,
      averageStops: 0,
    };
  }

  const routeFlights = flights.filter(
    (flight) => {
      const sourceMatch =
        !source ||
        source === 'All' ||
        flight.Source === source;

      const destinationMatch =
        !destination ||
        destination === 'All' ||
        flight.Destination === destination;

      return (
        sourceMatch &&
        destinationMatch
      );
    }
  );

  if (routeFlights.length === 0) {
    return {
      averagePrice: 0,
      airfareIndex: 0,
      flightCount: 0,
      averageDuration: 0,
      averageStops: 0,
    };
  }

  const totalPrice =
    routeFlights.reduce(
      (sum, flight) =>
        sum + toNumber(flight.Price),
      0
    );

  const totalIndex =
    routeFlights.reduce(
      (sum, flight) =>
        sum +
        toNumber(
          flight.Airfare_Index
        ),
      0
    );

  const totalDuration =
    routeFlights.reduce(
      (sum, flight) =>
        sum +
        toNumber(
          flight.Duration_Minutes
        ),
      0
    );

  const totalStops =
    routeFlights.reduce(
      (sum, flight) =>
        sum +
        toNumber(
          flight.Stops_Numeric ??
            flight.Total_Stops
        ),
      0
    );

  return {
    averagePrice: Math.round(
      totalPrice /
        routeFlights.length
    ),

    airfareIndex: Number(
      (
        totalIndex /
        routeFlights.length
      ).toFixed(2)
    ),

    flightCount:
      routeFlights.length,

    averageDuration: Math.round(
      totalDuration /
        routeFlights.length
    ),

    averageStops: Number(
      (
        totalStops /
        routeFlights.length
      ).toFixed(2)
    ),
  };
};

/* =========================================================
   ROUTE PRICE BY BOOKING WINDOW
========================================================= */

export const getRouteBookingWindowData = (
  flights = [],
  source,
  destination
) => {
  if (!flights || flights.length === 0) {
    return [];
  }

  const routeFlights = flights.filter(
    (flight) => {
      const sourceMatch =
        !source ||
        source === 'All' ||
        flight.Source === source;

      const destinationMatch =
        !destination ||
        destination === 'All' ||
        flight.Destination === destination;

      return (
        sourceMatch &&
        destinationMatch
      );
    }
  );

  if (routeFlights.length === 0) {
    return [];
  }

  const groups = {};

  routeFlights.forEach((flight) => {
    const window =
      flight.Booking_Window ||
      'Unknown';

    if (!groups[window]) {
      groups[window] = {
        bookingWindow: window,
        totalPrice: 0,
        totalIndex: 0,
        count: 0,
      };
    }

    groups[window].totalPrice +=
      toNumber(flight.Price);

    groups[window].totalIndex +=
      toNumber(
        flight.Airfare_Index
      );

    groups[window].count += 1;
  });

  const order = {
    'Early booking': 1,
    Normal: 2,
    'Last minute': 3,
  };

  return Object.values(groups)
    .sort(
      (a, b) =>
        (order[a.bookingWindow] ||
          99) -
        (order[b.bookingWindow] ||
          99)
    )
    .map((group) => ({
      bookingWindow:
        group.bookingWindow,

      month:
        group.bookingWindow,

      avgPrice: Math.round(
        group.totalPrice /
          group.count
      ),

      averagePrice: Math.round(
        group.totalPrice /
          group.count
      ),

      avgIndex: Number(
        (
          group.totalIndex /
          group.count
        ).toFixed(2)
      ),

      Airfare_Index: Number(
        (
          group.totalIndex /
          group.count
        ).toFixed(2)
      ),

      flightCount:
        group.count,
    }));
};

/* =========================================================
   AIRLINES ON A ROUTE
========================================================= */

export const getRouteAirlineData = (
  flights = [],
  source,
  destination
) => {
  if (!flights || flights.length === 0) {
    return [];
  }

  const routeFlights = flights.filter(
    (flight) => {
      const sourceMatch =
        !source ||
        source === 'All' ||
        flight.Source === source;

      const destinationMatch =
        !destination ||
        destination === 'All' ||
        flight.Destination === destination;

      return (
        sourceMatch &&
        destinationMatch
      );
    }
  );

  const groups = {};

  routeFlights.forEach((flight) => {
    const airline = flight.Airline;

    if (!airline) return;

    if (!groups[airline]) {
      groups[airline] = {
        airline,
        totalPrice: 0,
        totalIndex: 0,
        count: 0,
      };
    }

    groups[airline].totalPrice +=
      toNumber(flight.Price);

    groups[airline].totalIndex +=
      toNumber(
        flight.Airfare_Index
      );

    groups[airline].count += 1;
  });

  return Object.values(groups)
    .map((group) => ({
      airline: group.airline,

      avgPrice: Math.round(
        group.totalPrice /
          group.count
      ),

      avgIndex: Number(
        (
          group.totalIndex /
          group.count
        ).toFixed(2)
      ),

      flightCount:
        group.count,
    }))
    .sort(
      (a, b) =>
        b.flightCount -
        a.flightCount
    );
};

/* =========================================================
   FORMAT INDIAN RUPEE CURRENCY
========================================================= */

export const formatCurrency = (
 amount
) => {
  if (
    amount === null ||
    amount === undefined ||
    Number.isNaN(Number(amount))
  ) {
    return '₹0';
  }

  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }
  ).format(amount);
};