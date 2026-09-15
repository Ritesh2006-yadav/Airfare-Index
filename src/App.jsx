import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import RouteAnalysis from './pages/RouteAnalysis';
import AirlineComparison from './pages/AirlineComparison';
import Forecast from './pages/Forecast';
import Alerts from './pages/Alerts';
import BookingWindow from './pages/BookingWindow';
import { FilterProvider } from './context/FilterContext';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <FilterProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Top Navbar */}
        <Navbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div className="flex-1 flex">
          {/* Sidebar Navigation */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <main className="flex-1 lg:pl-64 transition-all duration-200 ease-in-out">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/routes" element={<RouteAnalysis />} />
                <Route path="/route-analysis" element={<RouteAnalysis />} />
                <Route path="/airlines" element={<AirlineComparison />} />
                <Route path="/forecast" element={<Forecast />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/booking-window" element={<BookingWindow />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </FilterProvider>
  );
}

export default App;
