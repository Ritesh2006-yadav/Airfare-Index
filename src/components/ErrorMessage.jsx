import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

const ErrorMessage = ({
  message = 'Unable to load airfare data.',
  onRetry,
}) => {
  return (
    <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 text-center max-w-md mx-auto my-8 shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">{message}</h3>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
        An error occurred while loading or parsing the flight dataset. Please verify the file and retry.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm shadow-indigo-200"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
