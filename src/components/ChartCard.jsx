import React from 'react';

const ChartCard = ({
  title,
  subtitle,
  badge,
  badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200',
  children,
  action,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            {badge && (
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeBg}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className="w-full">{children}</div>
    </div>
  );
};

export default ChartCard;
