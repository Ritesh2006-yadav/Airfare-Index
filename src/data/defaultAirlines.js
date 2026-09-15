export const AIRLINES = [
  {
    code: '6E',
    name: 'IndiGo',
    type: 'LCC', // Low Cost Carrier
    marketShare: 61.2,
    color: '#1d4ed8', // blue-700
    bgLight: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Largest domestic carrier by passenger volume and fleet size.',
  },
  {
    code: 'AI',
    name: 'Air India',
    type: 'FSC', // Full Service Carrier
    marketShare: 14.5,
    color: '#dc2626', // red-600
    bgLight: 'bg-red-50 text-red-700 border-red-200',
    description: 'National flag carrier operating extensive domestic trunk routes.',
  },
  {
    code: 'UK',
    name: 'Vistara',
    type: 'FSC',
    marketShare: 9.8,
    color: '#7e22ce', // purple-700
    bgLight: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Premium full-service airline with business and premium economy cabins.',
  },
  {
    code: 'QP',
    name: 'Akasa Air',
    type: 'LCC',
    marketShare: 5.4,
    color: '#ea580c', // orange-600
    bgLight: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'Fastest growing next-generation Indian low-cost carrier.',
  },
  {
    code: 'SG',
    name: 'SpiceJet',
    type: 'LCC',
    marketShare: 4.8,
    color: '#b91c1c', // red-700
    bgLight: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Major low-cost airline with wide regional and tier-2 connectivity.',
  },
  {
    code: 'IX',
    name: 'AIX Connect',
    type: 'LCC',
    marketShare: 4.3,
    color: '#0d9488', // teal-600
    bgLight: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'Subsidiary low-cost carrier of the Air India Group.',
  },
];

export const getAirlineByName = (name) => {
  if (!name) return null;
  const n = name.toLowerCase();
  return AIRLINES.find(a => a.name.toLowerCase().includes(n) || n.includes(a.name.toLowerCase())) || {
    code: 'OTHER',
    name: name,
    type: 'LCC',
    marketShare: 1.0,
    color: '#64748b',
    bgLight: 'bg-slate-50 text-slate-700 border-slate-200',
    description: 'Domestic airline carrier',
  };
};
