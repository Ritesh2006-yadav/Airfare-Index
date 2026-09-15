import React from 'react';
import { Plane, Bell, Menu, X, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Hamburger & Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 text-slate-500 rounded-lg lg:hidden hover:bg-slate-100 hover:text-slate-800 transition"
              aria-label="Toggle Navigation"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:bg-indigo-700 transition">
                <Plane className="w-5 h-5 -rotate-45" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                    India Airfare Index
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    CPI Augmentation
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden md:block">
                  SIH26056 • Real-Time Automated Web Scraping & Aviation Analytics
                </p>
              </div>
            </Link>
          </div>

          {/* Right section: Live Status, Timestamp & Alerts */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Live Data Badge */}
            <div className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide uppercase">Live Data</span>
              <span className="text-[11px] text-emerald-700 hidden sm:inline border-l border-emerald-300 pl-2">
                Updated 2 min ago
              </span>
            </div>

            {/* Notification / Alert Icon */}
            <Link
              to="/alerts"
              className="relative p-2 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition"
              title="View Anomaly Alerts"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </Link>

            {/* Financial / Statistical Base Pill */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>Base Period: <strong className="text-slate-700 font-semibold">100.0</strong></span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
