import React from 'react';

/**
 * StatusBadge - Reusable status indicator component 
 * Displays a colored badge with status label
 */
const StatusBadge = ({ status, className = '' }) => {
  const statusConfig = {
    optimal: {
      bg: 'bg-emerald-100 dark:bg-emerald-900',
      text: 'text-emerald-700 dark:text-emerald-200',
      label: 'Optimal',
    },
    good: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-700 dark:text-green-200',
      label: 'Good',
    },
    moderate: {
      bg: 'bg-amber-100 dark:bg-amber-900',
      text: 'text-amber-700 dark:text-amber-200',
      label: 'Moderate',
    },
    dry: {
      bg: 'bg-orange-100 dark:bg-orange-900',
      text: 'text-orange-700 dark:text-orange-200',
      label: 'Dry',
    },
    wet: {
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-700 dark:text-blue-200',
      label: 'Wet',
    },
    acidic: {
      bg: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-700 dark:text-red-200',
      label: 'Acidic',
    },
    neutral: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-700 dark:text-green-200',
      label: 'Neutral',
    },
    alkaline: {
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-700 dark:text-blue-200',
      label: 'Alkaline',
    },
    poor: {
      bg: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-700 dark:text-red-200',
      label: 'Poor',
    },
    medium: {
      bg: 'bg-amber-100 dark:bg-amber-900',
      text: 'text-amber-700 dark:text-amber-200',
      label: 'Medium',
    },
    high: {
      bg: 'bg-emerald-100 dark:bg-emerald-900',
      text: 'text-emerald-700 dark:text-emerald-200',
      label: 'High',
    },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.moderate;

  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md ${config.bg} ${config.text} ${className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
