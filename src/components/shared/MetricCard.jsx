import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import StatusBadge from './StatusBadge';

/**
 * MetricCard - Reusable metric display component
 * Displays icon, label, value, unit, status badge, and optional trend
 */
const MetricCard = ({ icon, label, value, unit, statusBadge, trend, trendDirection, color, isDarkMode = false }) => {
  const Icon = icon;
  const iconBgMap = {
    blue: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-500/15',
    green: isDarkMode ? 'bg-green-900/30' : 'bg-green-500/15',
    orange: isDarkMode ? 'bg-orange-900/30' : 'bg-orange-500/15',
    red: isDarkMode ? 'bg-red-900/30' : 'bg-red-500/15',
  };

  const iconColorMap = {
    blue: isDarkMode ? 'text-blue-400' : 'text-blue-600',
    green: isDarkMode ? 'text-green-400' : 'text-green-600',
    orange: isDarkMode ? 'text-orange-400' : 'text-orange-600',
    red: isDarkMode ? 'text-red-400' : 'text-red-600',
  };

  const borderColorMap = {
    blue: isDarkMode ? 'border-blue-700/20' : 'border-blue-200/40',
    green: isDarkMode ? 'border-green-700/20' : 'border-green-200/40',
    orange: isDarkMode ? 'border-orange-700/20' : 'border-orange-200/40',
    red: isDarkMode ? 'border-red-700/20' : 'border-red-200/40',
  };

  return (
    <div className={`rounded-lg p-2 transition-all duration-200 border ${
      isDarkMode ? 'bg-slate-800/30' : 'bg-white/50'
    } shadow-sm ${borderColorMap[color]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className={`w-5 h-5 ${iconBgMap[color]} rounded flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-2.5 h-2.5 ${iconColorMap[color]}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-semibold ${
            trendDirection === 'up'
              ? isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100/60 text-green-700'
              : isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100/60 text-red-700'
          }`}>
            {trendDirection === 'up' ? (
              <TrendingUp className="w-2 h-2" />
            ) : (
              <TrendingDown className="w-2 h-2" />
            )}
            <span className="text-xs">{trend}%</span>
          </div>
        )}
      </div>

      {/* Label */}
      <span className={`text-xs font-medium block mb-1 truncate ${
        isDarkMode ? 'text-slate-400' : 'text-slate-600'
      }`}>
        {label}
      </span>

      {/* Value */}
      <div className="flex items-baseline gap-0.5 mb-1.5">
        <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </span>
        {unit && (
          <span className={`text-xs font-normal ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {unit}
          </span>
        )}
      </div>

      {/* Status Badge */}
      {statusBadge && (
        <div>
          <StatusBadge status={statusBadge} />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
