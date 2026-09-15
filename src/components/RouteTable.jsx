import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../services/airfareService';
import { ArrowRight, TrendingUp, TrendingDown, Plane } from 'lucide-react';

const RouteTable = ({ routes = [], maxItems = 6, showViewAll = true }) => {
  const navigate = useNavigate();

  const displayedRoutes = routes.slice(0, maxItems);

  const handleRouteClick = (route) => {
    // Navigate to Route Analysis with selected origin and destination
    navigate(`/route-analysis?source=${route.source}&destination=${route.destination}`);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Popular Domestic Corridors
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Key trunk routes ranked by national aviation passenger volume
          </p>
        </div>
        {showViewAll && (
          <button
            type="button"
            onClick={() => navigate('/route-analysis')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
          >
            <span>All Routes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Route</th>
              <th className="py-3 px-4 text-right">Airfare Index</th>
              <th className="py-3 px-4 text-right">Avg Fare</th>
              <th className="py-3 px-4 text-right">Change</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {displayedRoutes.map((route) => {
              const isPositive = route.change >= 0;
              return (
                <tr
                  key={route.key}
                  onClick={() => handleRouteClick(route)}
                  className="hover:bg-slate-50 transition cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition font-mono">
                        {route.routeDisplay}
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        ({route.source} → {route.destination})
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-indigo-700">
                    {route.index}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(route.avgFare)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isPositive
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {isPositive ? '+' : ''}
                        {route.change}%
                      </span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition inline-flex items-center gap-1">
                      Analyze <ArrowRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RouteTable;
