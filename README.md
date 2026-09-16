# India Airfare Price Index Web Application

> **Problem Statement ID**: SIH26056  
> **Title**: Development of a Real-time Airfare Price Index for India through Automated Web Scraping of Airline and Online Travel Aggregator Portals for Augmentation of the Consumer Price Index (CPI).

---

## 🛫 Overview

This platform is a specialized analytical and financial monitoring system designed to track, calculate, and visualize the **India Airfare Price Index** in real time. Rather than functioning as a ticket booking engine, the system ingests high-frequency fare observations from domestic airline portals (IndiGo, Air India, Akasa Air, SpiceJet, Vistara, AIX Connect) and Online Travel Aggregators (OTAs) to augment official economic statistics (specifically the transport sub-index of the Consumer Price Index).

---

## 🌟 Key Features

1. **Nationwide Airfare Price Index (Base = 100.0)**
   - Tracks relative price index movements using a Laspeyres-style weighted formula:
     $$\text{Index}_t = \frac{\sum (P_t \times Q_0)}{\sum (P_0 \times Q_0)} \times 100$$
   - Displays real-time nationwide index, month-on-month change, and weighted average fare.

2. **Route Deep Dive Analysis (`/route-analysis`)**
   - High-density corridor analysis (e.g. Delhi → Mumbai, Bengaluru → Delhi).
   - Metrics: Current Index, Average Fare, Min Fare, Max Fare, Average Stops, and Dominant Carrier.
   - Stopover fare differential analysis (Non-stop vs. 1 Stop vs. 2 Stops).

3. **Airline Benchmark Comparison (`/airlines`)**
   - Head-to-head comparison across scheduled Indian carriers.
   - Low-Cost Carrier (LCC) vs Full-Service Carrier (FSC) premium spread.
   - Average Fare Bar Chart and 30-day index trajectory matrix.

4. **Booking Window Lead-Time Analysis (`/booking-window`)**
   - Dynamic pricing yield curve across advance purchase horizons (30d, 15d, 7d, 2d, 0d).
   - Clear identification of optimal booking sweet spots (15–21 days).
   - Clearly flagged as **Demo / Model Output** until live scheduled scraper queues are connected.

5. **7-Day Price Forecast (`/forecast`)**
   - Short-term time-series price projections with 84% confidence intervals.
   - Demand pressure classification (Normal, Moderate, High, Weekend Peak).
   - Standardized JSON contract ready for Python ML backends (ARIMA / Prophet / LSTM).

6. **Airfare Anomaly Surveillance (`/alerts`)**
   - Automated alerts flagging price surges (>25% spike) above statistical baselines ($2\sigma$).
   - Severity categorization: `Critical`, `Warning`, and `Normal`.
   - Root-cause diagnostics (capacity cuts, seasonal festival eve rushes, weather disruptions).

7. **Interactive India Aviation Corridor Map**
   - Built with Leaflet to visualize major Indian airport nodes and high-density flight corridors.
   - Interactive popups and one-click navigation to corridor analytics.

8. **CPI Augmentation Context**
   - Clear informational overview explaining how high-frequency automated scraping complements traditional monthly survey methods.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, React Router v6
- **Styling**: Tailwind CSS
- **Data Visualization**: Recharts (Responsive Line, Area, Composed, and Bar charts)
- **Geographic Mapping**: Leaflet & React-Leaflet
- **Icons**: Lucide React
- **Architecture**: Decoupled, API-ready service layer (`src/services/airfareService.js`) supporting `VITE_API_BASE_URL`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```

---

## 🔌 API-Ready Architecture

The service layer is built in `src/services/airfareService.js`. When `VITE_API_BASE_URL` is configured, it forwards requests directly to your backend microservices:

```
GET /api/overview?source=DEL&destination=BOM
GET /api/routes
GET /api/routes/:source/:destination
GET /api/airlines/comparison
GET /api/booking-window?source=DEL&destination=BOM
GET /api/forecast?source=DEL&destination=BOM
GET /api/alerts
GET /api/metadata
```

When `VITE_API_BASE_URL` is empty, the application runs seamlessly using the built-in dynamic calculation engine and structured flight data.
