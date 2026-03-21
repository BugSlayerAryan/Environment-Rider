import React, { useState, useEffect } from 'react';

/**
 * CircularProgress - Circular progress indicator for metrics
 * Displays an animated circular progress bar with center text
 */
const CircularProgress = ({ value, max = 1, label, color = 'emerald' }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const percentage = ((animatedValue / max) * 100).toFixed(0);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorConfigs = {
    emerald: {
      progressStroke: { light: '#059669', dark: '#10b981' },
      containerBg: 'bg-gradient-to-br from-white/85 to-emerald-50/40 dark:from-emerald-950/50 dark:to-slate-900/70',
      containerBorder: 'border-emerald-200/70 dark:border-emerald-800/50',
      numberText: 'text-emerald-950 dark:text-emerald-300',
      labelText: 'text-emerald-700 dark:text-emerald-400',
      ringColor: 'ring-emerald-100/80 dark:ring-emerald-900/50',
    },
    green: {
      progressStroke: { light: '#16a34a', dark: '#22c55e' },
      containerBg: 'bg-gradient-to-br from-white/85 to-green-50/40 dark:from-green-950/50 dark:to-slate-900/70',
      containerBorder: 'border-green-200/70 dark:border-green-800/50',
      numberText: 'text-green-950 dark:text-green-300',
      labelText: 'text-green-700 dark:text-green-400',
      ringColor: 'ring-green-100/80 dark:ring-green-900/50',
    },
    teal: {
      progressStroke: { light: '#0d9488', dark: '#14b8a6' },
      containerBg: 'bg-gradient-to-br from-white/85 to-teal-50/40 dark:from-teal-950/50 dark:to-slate-900/70',
      containerBorder: 'border-teal-200/70 dark:border-teal-800/50',
      numberText: 'text-teal-950 dark:text-teal-300',
      labelText: 'text-teal-700 dark:text-teal-400',
      ringColor: 'ring-teal-100/80 dark:ring-teal-900/50',
    },
  };

  const config = colorConfigs[color] || colorConfigs.emerald;

  return (
    <div className="flex flex-col items-center justify-center">
      <style>{`
        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .subtle-pulse { animation: subtle-pulse 3.5s ease-in-out infinite; }
      `}</style>
      
      <div className={`relative w-44 h-44 mb-5 flex items-center justify-center rounded-full ${config.containerBg} border-2 ${config.containerBorder} shadow-2xl dark:shadow-inner ${config.ringColor} ring-2 backdrop-blur-xl transition-all duration-300 hover:shadow-inner hover:dark:shadow-2xl subtle-pulse`}>
        
        <svg className="w-40 h-40 transform -rotate-90 absolute" viewBox="0 0 100 100">
          <defs>
            {/* Subtle background gradient */}
            <linearGradient id={`bgGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.1" />
            </linearGradient>
            
            {/* Premium progress gradient */}
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={config.progressStroke.light} stopOpacity="1" />
              <stop offset="100%" stopColor={config.progressStroke.dark} stopOpacity="0.95" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id={`glow-${color}`}>
              <feGaussianBlur stdDeviation="1" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Subtle background track */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={`url(#bgGrad-${color})`}
            strokeWidth="2"
            opacity="0.6"
          />

          {/* Progress circle with professional glow */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={`url(#gradient-${color})`}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            filter={`url(#glow-${color})`}
          />
        </svg>

        {/* Center content with premium styling */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className={`text-6xl font-black tracking-tighter leading-none ${config.numberText}`}>
            {(animatedValue * 100).toFixed(0)}
          </div>
          <div className={`text-xs font-extrabold uppercase tracking-widest mt-2.5 opacity-90 ${config.labelText}`}>
            Score
          </div>
        </div>
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-center text-slate-700 dark:text-slate-300 px-4 mt-4 leading-snug">
        {label}
      </span>
    </div>
  );
};

export default CircularProgress;
