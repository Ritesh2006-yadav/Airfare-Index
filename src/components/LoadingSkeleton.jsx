import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="h-3.5 bg-slate-200 rounded w-24"></div>
      <div className="h-7 w-7 bg-slate-200 rounded-lg"></div>
    </div>
    <div className="h-8 bg-slate-200 rounded w-32 mb-2"></div>
    <div className="h-3 bg-slate-200 rounded w-44"></div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
    <div className="flex justify-between items-center mb-6">
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-48"></div>
        <div className="h-3 bg-slate-200 rounded w-64"></div>
      </div>
      <div className="h-8 bg-slate-200 rounded-lg w-28"></div>
    </div>
    <div className="h-72 bg-slate-100 rounded-xl"></div>
  </div>
);

export const TableSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
    <div className="h-4 bg-slate-200 rounded w-44 mb-4"></div>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-100">
        <div className="h-4 bg-slate-200 rounded w-36"></div>
        <div className="h-4 bg-slate-200 rounded w-20"></div>
        <div className="h-4 bg-slate-200 rounded w-24"></div>
        <div className="h-4 bg-slate-200 rounded w-16"></div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Hero card skeleton */}
      <div className="h-48 bg-slate-800/80 rounded-2xl animate-pulse" />
      {/* 4 Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      {/* Filter skeleton */}
      <div className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      {/* Chart skeleton */}
      <ChartSkeleton />
    </div>
  );
};

export default DashboardSkeleton;
