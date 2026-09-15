import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { AIRPORTS } from '../data/airports';
import { Plane, ArrowRight, ExternalLink } from 'lucide-react';

// Key monitored trunk corridors for polyline rendering
const ROUTE_CORRIDORS = [
  { from: 'DEL', to: 'BOM', name: 'DEL ⇄ BOM', index: 121.3 },
  { from: 'DEL', to: 'BLR', name: 'DEL ⇄ BLR', index: 115.7 },
  { from: 'BOM', to: 'BLR', name: 'BOM ⇄ BLR', index: 110.4 },
  { from: 'DEL', to: 'HYD', name: 'DEL ⇄ HYD', index: 118.1 },
  { from: 'DEL', to: 'MAA', name: 'DEL ⇄ MAA', index: 114.2 },
  { from: 'CCU', to: 'DEL', name: 'CCU ⇄ DEL', index: 119.5 },
  { from: 'BOM', to: 'GOI', name: 'BOM ⇄ GOI', index: 128.4 },
  { from: 'BLR', to: 'HYD', name: 'BLR ⇄ HYD', index: 108.9 },
  { from: 'DEL', to: 'AMD', name: 'DEL ⇄ AMD', index: 112.6 },
];

const IndiaMap = () => {
  const navigate = useNavigate();

  // India geographic centroid approx: [21.5, 78.9]
  const center = [21.8, 79.5];

  const getCoordinates = (code) => {
    const airport = AIRPORTS.find(a => a.code === code);
    return airport ? [airport.lat, airport.lng] : null;
  };

  const handleRouteNavigate = (fromCode, toCode) => {
    const fromAirport = AIRPORTS.find(a => a.code === fromCode);
    const toAirport = AIRPORTS.find(a => a.code === toCode);
    if (fromAirport && toAirport) {
      navigate(`/route-analysis?source=${fromAirport.city}&destination=${toAirport.city}`);
    }
  };

  const handleAirportNavigate = (airport) => {
    // If Delhi clicked, suggest Delhi -> Mumbai, otherwise airport -> Delhi
    const target = airport.city === 'Delhi' ? 'Mumbai' : 'Delhi';
    navigate(`/route-analysis?source=${airport.city}&destination=${target}`);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              National Airfare Corridor Network
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Interactive Leaflet
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time monitored air travel hubs and high-density passenger flight corridors
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
            <span>Major Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-indigo-400 inline-block" />
            <span>Active Corridor</span>
          </div>
        </div>
      </div>

      <div className="h-[380px] sm:h-[420px] w-full rounded-xl overflow-hidden border border-slate-200 relative">
        <MapContainer
          center={center}
          zoom={4.6}
          minZoom={4}
          maxZoom={7}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          {/* OpenStreetMap CartoDB Positron style tile layer for clean analytics look */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* Render Route Corridors */}
          {ROUTE_CORRIDORS.map((corridor, idx) => {
            const p1 = getCoordinates(corridor.from);
            const p2 = getCoordinates(corridor.to);
            if (!p1 || !p2) return null;

            return (
              <Polyline
                key={`line-${idx}`}
                positions={[p1, p2]}
                pathOptions={{
                  color: '#4f46e5',
                  weight: 2,
                  opacity: 0.45,
                  dashArray: '4, 6',
                }}
                eventHandlers={{
                  click: () => handleRouteNavigate(corridor.from, corridor.to),
                }}
              >
                <Tooltip sticky>
                  <div className="text-xs p-1">
                    <strong className="block text-indigo-700">{corridor.name}</strong>
                    <span>Index: {corridor.index} • Click to analyze</span>
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

          {/* Render Airport Nodes */}
          {AIRPORTS.map((airport) => (
            <CircleMarker
              key={airport.code}
              center={[airport.lat, airport.lng]}
              radius={airport.isMajorHub ? 8 : 6}
              pathOptions={{
                color: airport.isMajorHub ? '#4338ca' : '#0284c7',
                fillColor: airport.isMajorHub ? '#6366f1' : '#38bdf8',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div className="text-xs font-semibold text-slate-900">
                  {airport.city} ({airport.code})
                </div>
              </Tooltip>
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="font-bold text-slate-900">
                    {airport.city} ({airport.code})
                  </div>
                  <div className="text-slate-500 text-[11px]">{airport.name}</div>
                  <button
                    type="button"
                    onClick={() => handleAirportNavigate(airport)}
                    className="mt-2 w-full text-center px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold transition"
                  >
                    View Routes from {airport.city}
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Click any airport marker or flight path to inspect route price dynamics</span>
        <span className="font-medium text-indigo-600">12 Hubs Connected</span>
      </div>
    </div>
  );
};

export default IndiaMap;
