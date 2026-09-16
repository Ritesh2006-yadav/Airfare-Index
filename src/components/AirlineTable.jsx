import React from 'react';
import { formatCurrency } from '../services/airfareService';
import { TrendingUp, TrendingDown, Plane } from 'lucide-react';

const AirlineTable = ({ airlines = [], onSelectAirline }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
          <tr>
            <th className="py-3.5 px-4">Airline</th>
            <th className="py-3.5 px-4">Type</th>
            <th className="py-3.5 px-4 text-right">Avg Fare</th>
            <th className="py-3.5 px-4 text-right">Airfare Index</th>
            <th className="py-3.5 px-4 text-right">30d Change</th>
            <th className="py-3.5 px-4 text-right">Fare Spread</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {airlines.map((a) => {
            const isPositive = !a.change.startsWith('-');
            return (
              <tr
                key={a.code || a.airline}
                className="hover:bg-slate-50/80 transition cursor-pointer group"
                onClick={() => onSelectAirline && onSelectAirline(a)}
              >
                <td className="py-3.5 px-4 flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: a.color || '#6366f1' }}
                  />
                  <div>
                    <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                      {a.airline}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5 font-mono">
                      ({a.code})
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                      a.type === 'LCC'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {a.type || 'LCC'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(a.avgFare)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-semibold text-indigo-700">
                  {a.index}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isPositive
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{a.change}</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                  {formatCurrency(a.minFare)} – {formatCurrency(a.maxFare)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AirlineTable;
