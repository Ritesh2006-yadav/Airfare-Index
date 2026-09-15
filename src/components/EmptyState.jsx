import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

const EmptyState = ({
  title = 'No flights found for the selected filters.',
  description = 'Try resetting or adjusting your Airline, Source, Destination, or Month filter.',
  onReset,
}) => {
  return (
    <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 text-center max-w-md mx-auto my-8 shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
        <SearchX className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 mb-5 leading-relaxed">
        {description}
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition border border-indigo-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
