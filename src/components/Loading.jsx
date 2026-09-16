import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ message = 'Loading airfare data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-xs my-8">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
      <p className="text-sm font-semibold text-slate-700">{message}</p>
      <p className="text-xs text-slate-400 mt-1">
        Parsing dataset records via PapaParse...
      </p>
    </div>
  );
};

export default Loading;
