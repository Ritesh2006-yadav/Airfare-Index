import React from 'react';
import { Filter, RotateCcw, ArrowLeftRight } from 'lucide-react';

const FilterBar = ({
  filters = {},
  options = {
    airlines: [],
    sources: [],
    destinations: [],
    bookingWindows: [],
  },
  onFilterChange,
  onReset,
}) => {
  const handleSwap = () => {
    if (!onFilterChange) return;

    const currentSrc = filters.source || 'All';
    const currentDst = filters.destination || 'All';

    onFilterChange('source', currentDst);
    onFilterChange('destination', currentSrc);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />

          <h3 className="text-sm font-semibold text-slate-800">
            Airfare Dataset Filters
          </h3>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            (Options derived directly from 300,153 CSV records)
          </span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-semibold transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">

        {/* Airline */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Airline
          </label>

          <div className="relative">
            <select
              value={filters.airline || 'All'}
              onChange={(e) =>
                onFilterChange('airline', e.target.value)
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition appearance-none cursor-pointer"
            >
              <option value="All">All Airlines</option>

              {options.airlines?.map((airline) => (
                <option key={airline} value={airline}>
                  {airline}
                </option>
              ))}
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Source */}
        <div className="lg:col-span-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            From (Source)
          </label>

          <div className="relative">
            <select
              value={filters.source || 'All'}
              onChange={(e) =>
                onFilterChange('source', e.target.value)
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition appearance-none cursor-pointer"
            >
              <option value="All">All Sources</option>

              {options.sources?.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Swap */}
        <div className="hidden lg:flex lg:col-span-1 justify-center pb-0.5">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap Source & Destination"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200 transition"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Destination */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-600">
              To (Destination)
            </label>

            <button
              type="button"
              onClick={handleSwap}
              className="lg:hidden text-xs text-indigo-600 font-medium inline-flex items-center gap-1"
            >
              <ArrowLeftRight className="w-3 h-3" />
              Swap
            </button>
          </div>

          <div className="relative">
            <select
              value={filters.destination || 'All'}
              onChange={(e) =>
                onFilterChange('destination', e.target.value)
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition appearance-none cursor-pointer"
            >
              <option value="All">All Destinations</option>

              {options.destinations?.map((destination) => (
                <option key={destination} value={destination}>
                  {destination}
                </option>
              ))}
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Booking Window */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Booking Window
          </label>

          <div className="relative">
            <select
              value={filters.bookingWindow || 'All'}
              onChange={(e) =>
                onFilterChange(
                  'bookingWindow',
                  e.target.value
                )
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs sm:text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition appearance-none cursor-pointer"
            >
              <option value="All">
                All Windows
              </option>

              {options.bookingWindows?.map((window) => (
                <option key={window} value={window}>
                  {window}
                </option>
              ))}
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FilterBar;