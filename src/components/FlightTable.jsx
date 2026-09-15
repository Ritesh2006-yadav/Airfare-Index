import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../services/flightDataService';
import { ChevronLeft, ChevronRight, Plane, Clock } from 'lucide-react';

const FlightTable = ({
  flights = [],
  pageSizeOptions = [10, 20, 50],
  defaultPageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Reset to page 1 whenever flights list changes (e.g. filters applied)
  useMemo(() => {
    setCurrentPage(1);
  }, [flights]);

  const totalFlights = flights.length;
  const totalPages = Math.max(1, Math.ceil(totalFlights / pageSize));

  // Slice for current page
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFlights);
  const currentFlights = flights.slice(startIndex, endIndex);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Flight Records Explorer
          </h3>
        </div>

        {/* Rows per page selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-500">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Airline</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Destination</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4 text-center">Stops</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4 text-right">Airfare Index</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {currentFlights.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                  {f.Airline}
                </td>
                <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                  {f.Date_of_Journey}
                </td>
                <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                  {f.Source}
                </td>
                <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                  {f.Destination}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                  {formatCurrency(f.Price)}
                </td>
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                      f.Total_Stops === 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : f.Total_Stops === 1
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {f.Total_Stops === 0 ? 'Non-stop' : `${f.Total_Stops} stop${f.Total_Stops > 1 ? 's' : ''}`}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-slate-600 font-mono whitespace-nowrap">
                  {f.Duration}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700 whitespace-nowrap">
                  {f.Airfare_Index}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          {totalFlights === 0 ? (
            <span>No flights found</span>
          ) : (
            <span>
              Showing <strong className="font-semibold text-slate-900">{startIndex + 1}</strong>–
              <strong className="font-semibold text-slate-900">{endIndex}</strong> of{' '}
              <strong className="font-semibold text-slate-900">{totalFlights.toLocaleString()}</strong> flights
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 mr-1">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentPage === totalPages || totalFlights === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition font-semibold"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlightTable;
