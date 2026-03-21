import React, { useState, useEffect } from 'react';

/**
 * ProgressBar - Animated progress indicator
 * Displays an animated gradient bar with optional label
 */
const ProgressBar = ({ value, max = 100, showLabel = true, className = '' }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const hasNumericValue = value !== null && value !== undefined && Number.isFinite(Number(value));
  const normalizedValue = hasNumericValue ? Number(value) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(normalizedValue), 100);
    return () => clearTimeout(timer);
  }, [normalizedValue]);

  const percentage = Math.min((animatedValue / max) * 100, 100);

  return (
    <div className={className}>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 dark:from-emerald-500 dark:via-green-600 dark:to-teal-600 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={animatedValue}
          aria-valuemin="0"
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Vegetation Coverage</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{hasNumericValue ? `${percentage.toFixed(0)}%` : '--'}</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
